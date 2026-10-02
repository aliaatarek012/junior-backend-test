export type UserRole = "admin" | "user";
export interface AuthenticatedUser { userId: string; role: UserRole; }
export interface LoginInput { email: string; password: string; }
export interface LoginResponse { token: string; tokenType: "Bearer"; expiresIn: string; }
