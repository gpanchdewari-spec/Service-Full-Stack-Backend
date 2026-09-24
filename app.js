import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(helmet());

app.use(
  cors({
    origin: [...allowedOrigins],
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 150,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.use(
  "/api",
  (req, res, next) => {
    const origin = req.get("origin");

    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      origin &&
      !allowedOrigins.has(origin)
    ) {
      return res.status(403).json({ message: "Origin not allowed" });
    }

    next();
  },
  routes,
);

app.use("/api", (req, res) =>
  res.status(404).json({ message: "API route not found" }),
);

app.use((err, req, res, next) => {
  if (err.name === "ZodError") {
    return res.status(400).json({
      message: err.issues.map((issue) => issue.message).join(". "),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid record ID" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "This record already exists" });
  }

  console.error(err.message);

  return res.status(err.status || 500).json({
    message: err.status
      ? err.message
      : "Something went wrong. Please try again.",
  });
});

export default app;
