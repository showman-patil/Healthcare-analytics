import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    service: "Medix AI API",
    status: "ok",
    message: "The API service is running. Use the /api routes to access healthcare features.",
    endpoints: {
      health: "/api/healthz",
      patients: "/api/patients",
      doctors: "/api/doctors",
      appointments: "/api/appointments",
      predictions: "/api/predictions",
      analytics: "/api/analytics",
    },
  });
});

app.use("/api", router);

export default app;
