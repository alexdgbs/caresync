import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { doctorsRouter } from "./routes/doctorsRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { appointmentsRouter } from "./routes/appointmentsRoutes.js";
import { medicalApplicationsRouter } from "./routes/medicalApplicationsRoutes.js";
import { openapi } from "./openapi.js";

export function createApp({ frontendUrls, io }) {
  const app = express();
  app.set("io", io);
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use((request, response, next) => {
    request.id = request.get("x-request-id") || randomUUID();
    response.set("x-request-id", request.id);
    next();
  });
  const allowedOrigins = new Set(frontendUrls);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin.replace(/[\\/]+$/, "")))
          return callback(null, true);
        return callback(null, false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "X-File-Name", "X-Request-Id"],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", (_request, response) =>
    response.json({ status: "ok", service: "caresync-api" }),
  );
  app.get("/api/openapi.json", (_request, response) => response.json(openapi));
  app.use("/api/auth", authRouter);
  app.use("/api/appointments", appointmentsRouter);
  app.use("/api/medical-applications", medicalApplicationsRouter);
  app.use("/api/medicos", doctorsRouter);
  app.use((request, response) =>
    response
      .status(404)
      .json({ message: "Ruta no encontrada", requestId: request.id }),
  );
  app.use((error, request, response, _next) => {
    console.error(request.id, error);
    if (error?.type === "entity.too.large")
      return response.status(413).json({
        message: "El archivo supera el límite de 5 MB",
        requestId: request.id,
      });
    return response
      .status(500)
      .json({ message: "Error interno del servidor", requestId: request.id });
  });
  return app;
}
