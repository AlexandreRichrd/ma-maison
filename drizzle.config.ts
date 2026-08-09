import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables (e.g. in production)
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./app/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
