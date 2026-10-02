import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import { ProductModel as Product } from "../src/modules/products/product.model";
import { UserModel } from "../src/modules/auth/user.model";
let database: MongoMemoryServer;
let adminToken: string;
let userToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  await UserModel.create([{ email: "admin@example.com", password: "admin-password", role: "admin" }, { email: "user@example.com", password: "user-password", role: "user" }]);
  adminToken = (await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "admin-password" })).body.data.token;
  userToken = (await request(app).post("/api/auth/login").send({ email: "user@example.com", password: "user-password" })).body.data.token;
});
afterEach(async () => Product.deleteMany({}));
afterAll(async () => { await mongoose.disconnect(); await database.stop(); });

describe("product inventory API", () => {
  it("authenticates an admin and creates a validated product", async () => {
    const response = await request(app).post("/api/products").set("Authorization", `Bearer ${adminToken}`).send({ name: "Keyboard", category: "Electronics", price: 75, quantity: 12 });
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Keyboard");
  });
  it("rejects invalid product input", async () => {
    const response = await request(app).post("/api/products").set("Authorization", `Bearer ${adminToken}`).send({ name: "", price: 0, quantity: -1 });
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(3);
  });
  it("does not allow a non-admin to create a product", async () => {
    const response = await request(app).post("/api/products").set("Authorization", `Bearer ${userToken}`).send({ name: "Keyboard", price: 75, quantity: 12 });
    expect(response.status).toBe(403);
  });
  it("returns products in pages of ten", async () => {
    await Product.insertMany(Array.from({ length: 11 }, (_, index) => ({ name: `Product ${index}`, price: index + 1, quantity: index })));
    const response = await request(app).get("/api/products?page=2");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({ page: 2, limit: 10, total: 11, totalPages: 2 });
  });
});
