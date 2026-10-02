import { ProductModel, type Product } from "./product.model";
import { ApiError } from "../../utils/api-error";
import type { Pagination, ProductInput } from "./product.types";

const PAGE_SIZE = 10;

export async function create(data: ProductInput): Promise<Product> {
  return ProductModel.create(data);
}

export async function list(page: number): Promise<{ products: Product[]; pagination: Pagination }> {
  const [products, total] = await Promise.all([
    ProductModel.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE), ProductModel.countDocuments(),
  ]);
  return { products, pagination: { page, limit: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) } };
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
