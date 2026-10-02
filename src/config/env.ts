import "dotenv/config";

const requiredValues = ["MONGODB_URI", "JWT_SECRET", "JWT_EXPIRES_IN"] as const;

function requireValue(key: (typeof requiredValues)[number]): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = (() => {
  const missing = requiredValues.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  const jwtSecret = requireValue("JWT_SECRET");
  if (jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters long.");
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT) || 3000,
    mongoUri: requireValue("MONGODB_URI"),
    jwtSecret,
    jwtExpiresIn: requireValue("JWT_EXPIRES_IN"),
    initialAdminEmail: process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase(),
    initialAdminPassword: process.env.INITIAL_ADMIN_PASSWORD,
    initialUserEmail: process.env.INITIAL_USER_EMAIL?.trim().toLowerCase(),
    initialUserPassword: process.env.INITIAL_USER_PASSWORD,
  };
})();
