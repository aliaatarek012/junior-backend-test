import { Schema, model } from "mongoose";
import type { ProductInput } from "./product.types";
export interface Product extends ProductInput { createdAt: Date; updatedAt: Date; }
const productSchema = new Schema<Product>({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, trim: true, maxlength: 100 },
  price: { type: Number, required: true, min: 0.01 },
  quantity: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger, message: "Quantity must be an integer." } },
}, { timestamps: true, versionKey: false });

productSchema.index({ category: 1, price: -1, _id: -1 });
export const ProductModel = model<Product>("Product", productSchema);
