import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthenticatedUser } from "../modules/auth/auth.types";

export function createAccessToken(user: AuthenticatedUser): string {
  const options: SignOptions = { algorithm: "HS256", expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ userId: user.userId, role: user.role }, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): AuthenticatedUser {
  const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as JwtPayload;
  if (typeof decoded.userId !== "string" || (decoded.role !== "admin" && decoded.role !== "user")) {
    throw new Error("Malformed JWT payload");
  }
  return { userId: decoded.userId, role: decoded.role };
}
