import { body } from "express-validator";
export const loginValidation = [body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(), body("password").isString().notEmpty().withMessage("Password is required.")];
