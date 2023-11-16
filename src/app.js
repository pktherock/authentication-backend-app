//* Core modules
import { readFile } from "node:fs/promises";
import path from "node:path";

//* third party modules
// calling config function to have the access of env variable all over the app
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import swaggerUI from "swagger-ui-express";
import cors from "cors";

//* user defined modules
import config from "./config/config.js";
import corsOptions from "./config/cors.config.js";
import connectToMongoDB from "./config/db.config.js";
import { authRouter } from "./api/v1/features/auth/index.js";
import {
  loggerMiddleware,
  errorHandler,
  notFoundHandler,
} from "../src/api/common/index.js";

// api doc (json file)
const apiDocs = JSON.parse(await readFile(path.resolve("swagger.json")));

const app = express();

//* database connection
await connectToMongoDB(); // todo how can i write it inside async func

//* create Store for storing sessions
const store = MongoStore.create({
  client: mongoose.connection.getClient(),
  dbName: mongoose.connection.name,
  collectionName: "sessions",
  stringify: false,
  ttl: 15 * 60, // todo storing session for 15 min
});

//* session configuration
const { sessionSecret, sessionTimeOut } = config;
app.use(
  session({
    secret: sessionSecret,
    saveUninitialized: false, // don't create session until something stored
    resave: false, // don't save session if unmodified
    cookie: {
      secure: "auto",
      httpOnly: true,
      maxAge: sessionTimeOut,
    },
    store: store,
    genid: (req) => new mongoose.Types.ObjectId().toString(),
  })
);

//* making public folder to accessible from anywhere
app.use(express.static("public"));

// cors configuration
app.use(cors(corsOptions));

//* this will help us to read req.body if coming request is in urlencoded or json format
app.use(express.json({ limit: "17kb" }));
app.use(express.urlencoded({ extended: true, limit: "17kb" }));

//* add cookie parser middleware to interact with cookies
app.use(cookieParser());

//* setting HTTP response headers.
app.use(helmet());

//* compress all responses
app.use(compression());

//* Enable trust proxy to trust X-Forwarded-For header
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 1000, //* 1 minutes
  max: 20, //* Limit each IP to 20 requests per `window` (here, per 1 minutes)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, //* Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, //* Disable the `X-RateLimit-*` headers
  trustProxy: true, //* Trust the X-Forwarded-For header (if you're behind a proxy/load balancer)
});

//* Apply the rate limiter to all requests
app.use(apiLimiter);

// request logger middleware
app.use(loggerMiddleware);

// all auth routes
app.use("/api/v1/auth", authRouter);

//* for api documentation using swagger.
// ? Keeping swagger code at the end so that we can load swagger on "/" or "/api/v1/docs" route
app.use(["/api/v1/docs", "/"], swaggerUI.serve);
app.get(["/api/v1/docs", "/"], swaggerUI.setup(apiDocs));

//* Middleware to handle 405(not allowed) error
//* Api end point not found
app.use("*", notFoundHandler);

//* always app level error handler will be last
app.use(errorHandler);

export default app;
