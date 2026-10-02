import type { Types } from "mongoose";

export interface ProductInput { name: string; category?: string; price: number; quantity: number; }
export interface Pagination { page: number; limit: number; total: number; totalPages: number; }

export interface ProductSummary { _id: Types.ObjectId; name: string; category?: string; price: number; quantity: number; }
export interface ProductPage<T> { products: T[]; pagination: Pagination; }

export interface SqlProductRow { id: number; name: string; category: string | null; price: number; quantity: number; }
export interface SqlProductPage { products: SqlProductRow[]; page: number; limit: number; }
