import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { ensureInitialAdmin, ensureInitialUser } from "./modules/auth/auth.service";
async function startServer(): Promise<void> {
  await connectDatabase(env.mongoUri);
  await ensureInitialAdmin(env.initialAdminEmail, env.initialAdminPassword);
  await ensureInitialUser(env.initialUserEmail, env.initialUserPassword);
  app.listen(env.port, () => console.log(`API listening on port ${env.port}`));
}
startServer().catch((error: unknown) => { console.error("Failed to start server:", error); process.exit(1); });
