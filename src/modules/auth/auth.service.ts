import { ApiError } from "../../utils/api-error";
import { createAccessToken } from "../../utils/jwt";
import { env } from "../../config/env";
import { UserModel } from "./user.model";
import type { LoginInput, LoginResponse, UserRole } from "./auth.types";
export async function login(input: LoginInput): Promise<LoginResponse> {
  const user = await UserModel.findOne({ email: input.email }).select("+password");
  if (!user || !(await user.comparePassword(input.password))) throw new ApiError("Invalid email or password.", 401);
  return { token: createAccessToken({ userId: user.id, role: user.role }), tokenType: "Bearer", expiresIn: env.jwtExpiresIn };
}
async function ensureInitialAccount(role: UserRole, email?: string, password?: string): Promise<void> {
  if (email && password && !(await UserModel.exists({ email }))) await UserModel.create({ email, password, role });
}
export async function ensureInitialAdmin(email?: string, password?: string): Promise<void> {
  await ensureInitialAccount("admin", email, password);
}
export async function ensureInitialUser(email?: string, password?: string): Promise<void> {
  await ensureInitialAccount("user", email, password);
}
