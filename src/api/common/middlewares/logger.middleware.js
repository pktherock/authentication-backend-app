import asyncHandler from "express-async-handler";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "request-logging" },
  transports: [new winston.transports.File({ filename: "combined.log" })],
});

const loggerMiddleware = asyncHandler(async (req, res, next) => {
  if (req.url.includes("auth")) return next();
  if (req.url.includes("/swagger")) return next();
  if (req.url.includes("/favicon")) return next();
  if (req.url === "/") return next();

  const logData = {
    timeStamp: new Date().toString(),
    reqUrl: req.url,
    reqBody: req.body,
  };
  logger.info(logData);

  return next();
});

export { logger };
export default loggerMiddleware;
