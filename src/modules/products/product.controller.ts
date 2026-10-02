import type { RequestHandler } from "express";
import * as productService from "./product.service";
import { asyncHandler } from "../../utils/asyncHandler";

export const createProduct: RequestHandler = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await productService.create(req.body) });
});

export const listProducts: RequestHandler = asyncHandler(async (req, res) => {
  const result = await productService.list(Number(req.query.page ?? 1)); res.status(200).json({ success: true, data: result.products, pagination: result.pagination });
});

export const listProductsByCategory: RequestHandler = asyncHandler(async (req, res) => {
  const result = await productService.listByCategory(String(req.params.category), { page: req.query.page });
  res.status(200).json({ success: true, data: result.products, pagination: result.pagination });
});

export const getProduct: RequestHandler = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await productService.getById(String(req.params.id)) });
});

export const updateProduct: RequestHandler = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await productService.update(String(req.params.id), req.body) });
});

export const deleteProduct: RequestHandler = asyncHandler(async (req, res) => {
  await productService.remove(String(req.params.id));
  res.status(200).json({ success: true, message: "Product deleted." });
});
