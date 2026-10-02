import { resolvePageWindow, type PageRequest } from "../../utils/pagination";
import type { SqlProductPage, SqlProductRow } from "./product.types";

export interface SqlExecutor {
  query(text: string, values: readonly unknown[]): Promise<{ rows: unknown[] }>;
}

export const PRICE_RANGE = { min: 50, max: 200 } as const;
export const PRICE_RANGE_PAGE_SIZE = 10;

// Served by idx_products_price_id (price, id); schema in sql/products.sql.
export const PRODUCTS_IN_PRICE_RANGE_SQL = `
  SELECT id, name, category, price, quantity
  FROM products
  WHERE price BETWEEN $1 AND $2
  ORDER BY price ASC, id ASC
  LIMIT $3
  OFFSET $4`;

function toProductRow(row: unknown): SqlProductRow {
  const record = row as Record<string, unknown>;
  return {
    id: Number(record.id),
    name: String(record.name),
    category: record.category == null ? null : String(record.category),
    price: Number(record.price),
    quantity: Number(record.quantity),
  };
}

export async function findProductsInPriceRange(db: SqlExecutor, request: PageRequest = {}): Promise<SqlProductPage> {
  const { page, limit, offset } = resolvePageWindow(request, PRICE_RANGE_PAGE_SIZE);
  const { rows } = await db.query(PRODUCTS_IN_PRICE_RANGE_SQL, [PRICE_RANGE.min, PRICE_RANGE.max, limit, offset]);
  return { products: rows.map(toProductRow), page, limit };
}
