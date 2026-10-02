import { body, param, query } from "express-validator";

export const productFields = [
  body("name").trim().notEmpty().withMessage("Name is required.").isLength({ max: 200 }).withMessage("Name must be at most 200 characters."),
  body("category").optional().isString().trim().isLength({ max: 100 }).withMessage("Category must be a string of at most 100 characters."),
  body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number.").toFloat(),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer.").toInt(),
];
export const productIdValidation = [param("id").isMongoId().withMessage("Product id must be valid.")];
export const paginationValidation = [query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer.").toInt()];
