import { ProductModel, type Product } from "./product.model";
import { ApiError } from "../../utils/api-error";
import { resolvePageWindow, type PageRequest } from "../../utils/pagination";
import type { Pagination, ProductInput, ProductPage, ProductSummary } from "./product.types";

const PAGE_SIZE = 10;
const CATEGORY_PAGE_SIZE = 5;
const SUMMARY_FIELDS = "name category price quantity";

export async function create(data: ProductInput): Promise<Product> {
  return ProductModel.create(data);
}

export async function list(page: number): Promise<{ products: Product[]; pagination: Pagination }> {
  const [products, total] = await Promise.all([
    ProductModel.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE), ProductModel.countDocuments(),
  ]);
  return { products, pagination: { page, limit: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) } };
}

// Served by the { category: 1, price: -1, _id: -1 } index; see docs/query-optimization.md.
export async function listByCategory(category: string, request: PageRequest = {}): Promise<ProductPage<ProductSummary>> {
  const { page, limit, offset } = resolvePageWindow(request, CATEGORY_PAGE_SIZE);
  const filter = { category: { $eq: category } };
  const [products, total] = await Promise.all([
    ProductModel.find(filter).select(SUMMARY_FIELDS).sort({ price: -1, _id: -1 }).skip(offset).limit(limit).lean<ProductSummary[]>(),
    ProductModel.countDocuments(filter),
  ]);
  return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getById(id: string): Promise<Product> {
  const product = await ProductModel.findById(id);
  if (!product) throw new ApiError("Product not found.", 404);
  return product;
}

export async function update(id: string, data: ProductInput): Promise<Product> {
  const product = await ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw new ApiError("Product not found.", 404);
  return product;
}

export async function remove(id: string): Promise<void> {
  const product = await ProductModel.findByIdAndDelete(id);
  if (!product) throw new ApiError("Product not found.", 404);
}
