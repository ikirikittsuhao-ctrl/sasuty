import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESモジュール環境（import）で __dirname を安全に取得するための標準的な書き方
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数がない場合、初期化フェーズでの即時クラッシュを防ぐためにフォールバック（ダミー）URLを設定
const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.warn("Warning: DATABASE_URL environment variable is missing during initialization.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
