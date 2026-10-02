import { Router } from "express";
import { validate } from "../../middleware/validation.middleware";
import { login } from "./auth.controller";
import { loginValidation } from "./auth.validator";
const router = Router(); router.post("/login", loginValidation, validate, login); export default router;
