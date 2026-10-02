import bcrypt from "bcryptjs";
import { HydratedDocument, Schema, model } from "mongoose";
import type { UserRole } from "./auth.types";

export interface User { email: string; password: string; role: UserRole; comparePassword(password: string): Promise<boolean>; }
const userSchema = new Schema<User>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true }, password: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "user"], default: "user", required: true },
}, { timestamps: true, versionKey: false });
userSchema.pre("save", async function hashPassword() { if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12); });
userSchema.methods.comparePassword = function (this: HydratedDocument<User>, password: string): Promise<boolean> { return bcrypt.compare(password, this.password); };
export const UserModel = model<User>("User", userSchema);
