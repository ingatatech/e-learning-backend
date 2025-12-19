import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { AppDataSource } from "./config/db";
import session from "express-session";
import router from "./routes";
import "reflect-metadata";
import cookieParser from "cookie-parser"; 
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import path from "path";
import pgSession from 'connect-pg-simple';
import pg from 'pg';
import { handleStripeWebhook } from "./webhooks/stripeWebhook";
import { initSocket } from "./socket/socket";

const { Pool } = pg;

const pgPool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: true },
});


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000', 'https://e-learning-yixk.onrender.com', 'https://e-learning-backend-v7pk.onrender.com', 'https://e-learning-backend-production-3563.up.railway.app', 'https://e-learning-9aud.onrender.com'],
  credentials: true // Enable CORS with credentials
}));
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser()); // Add cookie parser middleware

app.post(
  "/api/v1/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Express Session
const PgSession = pgSession(session);

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.JWT_SECRET || "fallback-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);

// Routes
app.use("/api/v1", router);

// Multer errors
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Specific multer errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large!" });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected file upload field!" });
    }

    return res.status(400).json({ message: "Upload error", error: err.message });
  }

  if (err.message?.includes("Filename must not end with a whitespace")) {
    return res.status(400).json({ message: "Bad filename", error: err.message });
  }

  if (err.message?.includes("File is empty")) {
    return res.status(400).json({ message: "File is empty", error: err.message });
  }

  console.error("Unhandled error in middleware:", err);
  res.status(500).json({ message: "Server error", error: String(err) });
});



const PORT = process.env.PORT || 5000;

// **Initialize Database First, Then Start Server**
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database Connected");


    // Start Express server
    server.listen(PORT, () =>
      console.log(`Server running on: http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Database Connection Error:", error);
  }
};

// Swagger setup
const isDev = process.env.NODE_ENV !== "production";

const swaggerPath = isDev
  ? path.resolve(__dirname, "./routes/*.ts")
  : path.resolve(__dirname, "./routes/*.js");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [
      {
        url: isDev ? "http://localhost:8000/api/v1" : "https://e-learning-backend-v7pk.onrender.com/api/v1",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [swaggerPath],
};


const specs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  swaggerOptions: {
    withCredentials: true,
    requestInterceptor: (req: { credentials: string; }) => {
      req.credentials = 'include';
      return req;
    }
  }
}));

// websockets
import http from 'http';
import multer from "multer";
const server = http.createServer(app)
const io = initSocket(server)
export { io }


// Run server
startServer();
