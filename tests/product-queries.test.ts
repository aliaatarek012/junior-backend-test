import fs from "fs";
import path from "path";
import request from "supertest";
import mongoose from "mongoose";
import { newDb } from "pg-mem";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import { ProductModel } from "../src/modules/products/product.model";
import * as productService from "../src/modules/products/product.service";
import { findProductsInPriceRange, PRODUCTS_IN_PRICE_RANGE_SQL, type SqlExecutor } from "../src/modules/products/product.sql-repository";

describe("PostgreSQL price-range query", () => {
  let pool: SqlExecutor & { end: () => Promise<void> };

  beforeAll(async () => {
    const db = newDb();
    db.public.none(fs.readFileSync(path.join(__dirname, "..", "sql", "products.sql"), "utf8"));
    const { Pool } = db.adapters.createPg();
    pool = new Pool();
    const prices = [10, 49.99, 50, 200, 200.01, 500, ...Array.from({ length: 12 }, (_, index) => 60 + index * 10)];
    for (const [index, price] of prices.entries()) {
      await pool.query("INSERT INTO products (name, category, price, quantity) VALUES ($1, $2, $3, $4)", [`Product ${index}`, "General", price, index]);
    }
  });
  afterAll(async () => pool.end());

  it("uses placeholders instead of interpolated values", () => {
    expect(PRODUCTS_IN_PRICE_RANGE_SQL).toMatch(/BETWEEN \$1 AND \$2[\s\S]*LIMIT \$3\s+OFFSET \$4/);
    expect(PRODUCTS_IN_PRICE_RANGE_SQL).not.toMatch(/SELECT \*/);
  });

  it("returns only prices between 50 and 200 inclusive, ascending, ten per page", async () => {
    const first = await findProductsInPriceRange(pool);
    const prices = first.products.map((product) => product.price);
    expect(first).toMatchObject({ page: 1, limit: 10 });
    expect(prices).toHaveLength(10);
    expect(prices[0]).toBe(50);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices.every((price) => price >= 50 && price <= 200)).toBe(true);
  });

  it("returns the next rows on page 2 without overlap", async () => {
    const first = await findProductsInPriceRange(pool, { page: 1 });
    const second = await findProductsInPriceRange(pool, { page: 2 });
    const all = [...first.products, ...second.products].map((product) => product.price);
    expect(second.products.map((product) => product.price)).toEqual([150, 160, 170, 200]);
    expect(all).toHaveLength(14);
    expect(all).not.toContain(49.99);
    expect(all).not.toContain(200.01);
    expect(new Set(all).size).toBe(all.length);
  });

  it("returns the selected columns only", async () => {
    const { products } = await findProductsInPriceRange(pool);
    expect(Object.keys(products[0] ?? {}).sort()).toEqual(["category", "id", "name", "price", "quantity"]);
  });

  it.each([{ page: 0 }, { page: -1 }, { page: "abc" }, { page: 1.5 }, { limit: 11 }, { limit: 0 }])("rejects invalid pagination %o", async (input) => {
    await expect(findProductsInPriceRange(pool, input)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("MongoDB category query", () => {
  let database: MongoMemoryServer;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    await mongoose.connect(database.getUri());
    await ProductModel.syncIndexes();
    await ProductModel.insertMany([
      ...Array.from({ length: 7 }, (_, index) => ({ name: `Electronic ${index}`, category: "Electronics", price: 100 + index * 10, quantity: index })),
      { name: "Tie A", category: "Electronics", price: 130, quantity: 1 },
      { name: "Book", category: "Books", price: 999, quantity: 1 },
      { name: "Uncategorised", price: 500, quantity: 1 },
    ]);
  });
  afterAll(async () => { await mongoose.disconnect(); await database.stop(); });

  it("returns only the requested category, price descending, five per page", async () => {
    const { products, pagination } = await productService.listByCategory("Electronics");
    expect(products).toHaveLength(5);
    expect(products.every((product) => product.category === "Electronics")).toBe(true);
    expect(products.map((product) => product.price)).toEqual([160, 150, 140, 130, 130]);
    expect(pagination).toEqual({ page: 1, limit: 5, total: 8, totalPages: 2 });
  });

  it("returns the remaining products on page 2 without duplicates", async () => {
    const first = await productService.listByCategory("Electronics", { page: 1 });
    const second = await productService.listByCategory("Electronics", { page: 2 });
    expect(second.products.map((product) => product.price)).toEqual([120, 110, 100]);
    const ids = [...first.products, ...second.products].map((product) => String(product._id));
    expect(new Set(ids).size).toBe(8);
  });

  it("projects only the summary fields", async () => {
    const { products } = await productService.listByCategory("Electronics");
    expect(Object.keys(products[0] ?? {}).sort()).toEqual(["_id", "category", "name", "price", "quantity"]);
  });

  it("is answered from the compound index without a collection scan or in-memory sort", async () => {
    const explain = (await ProductModel.find({ category: "Electronics" }).select("name category price quantity").sort({ price: -1, _id: -1 }).skip(0).limit(5).explain("executionStats")) as unknown as { executionStats: { totalDocsExamined: number } };
    const plan = JSON.stringify(explain);
    expect(plan).toContain("category_1_price_-1__id_-1");
    expect(plan).toContain("IXSCAN");
    expect(plan).not.toContain("COLLSCAN");
    expect(plan).not.toMatch(/"stage":"SORT"/);
    expect(explain.executionStats.totalDocsExamined).toBeLessThanOrEqual(5);
  });

  it("rejects invalid page values over HTTP", async () => {
    for (const page of ["0", "-1", "abc"]) {
      const response = await request(app).get(`/api/products/category/Electronics?page=${page}`);
      expect(response.status).toBe(400);
    }
    const ok = await request(app).get("/api/products/category/Electronics?page=2");
    expect(ok.status).toBe(200);
    expect(ok.body.data).toHaveLength(3);
  });

  it.each([{ page: 0 }, { page: "abc" }, { limit: 6 }])("rejects invalid pagination %o in the service", async (input) => {
    await expect(productService.listByCategory("Electronics", input)).rejects.toMatchObject({ statusCode: 400 });
  });
});
