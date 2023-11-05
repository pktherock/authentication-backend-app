import loggerMiddleware, { logger } from "./middlewares/logger.middleware.js";
import errorHandler, { CustomError } from "./middlewares/error.middleware.js";
import notFoundHandler from "./middlewares/notFound.middleware.js";

export {
  loggerMiddleware,
  logger,
  errorHandler,
  notFoundHandler,
  CustomError,
};
