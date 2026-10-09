import express from "express";
import cors from "cors";
import morgan from "morgan";
import client from "prom-client";
import responseTime from "response-time";

import { defineSlowTask, collectDefaultMetrics } from "./util.js";

const app = express();

const PORT = process.env.PORT || 9000;

app.use(morgan("dev"));

app.use(cors());
app.use(express.json());

// Metrics
collectDefaultMetrics({ register: client.register });

const reqResTime = new client.Histogram({
  name: "http_request_response_time_taken",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 1500, 2000], // Buckets for response time in seconds
});

const totalRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

app.use(
  responseTime((req, res, time) => {
    totalRequests.inc({
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode,
    });
    reqResTime.observe(
      {
        method: req.method,
        route: req.route?.path || req.url,
        status_code: res.statusCode,
      },
      time / 1000,
    ); // Convert to seconds
  }),
);

app.get("/", (_, res) => {
  res.status(200).json({
    message: "Hello, World!",
  });
});

app.get("/fast", (_, res) => {
  res.status(200).json({
    message: "Fast response!",
  });
});

app.get("/slow", async (_, res) => {
  try {
    const timeTaken = await defineSlowTask();

    return res.status(200).json({
      success: true,
      message: "Slow task completed successfully",
      timeTakenMs: timeTaken,
    });
  } catch (error) {
    console.error("Slow task failed:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Metrics Route
app.get("/metrics", async (_, res) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.status(200).send(metrics);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
