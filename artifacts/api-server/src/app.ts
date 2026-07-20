import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", router);

// Serve built frontend in production
const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  // Static files built by vite (../sasuty/dist/public relative to this file at runtime)
  const frontendDist = path.resolve(__dirname, "../../sasuty/dist/public");
  app.use(express.static(frontendDist));

  // SPA fallback — serve index.html for any non-API route
  app.get("*path", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
