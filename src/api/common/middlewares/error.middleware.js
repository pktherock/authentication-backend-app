import STATUS_CODE from "../../../constants/statusCode.js";
import conf from "../../../config/config.js";
import winston from "winston";
import { removeUnusedMulterImageFileOnError } from "../../../helpers/index.js";

export class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  defaultMeta: { service: "server-error-logging" },
  transports: [
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
  ],
});

const errorHandler = async (error, req, res, next) => {
  let statusCode = error.statusCode || STATUS_CODE.SERVER_ERROR;

  if (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    error.name === "BSONError"
  ) {
    // todo mongo error
    // Handle Mongoose validation and casting errors
    statusCode = STATUS_CODE.BAD_REQUEST;
  }

  const errResponse = {
    success: false,
    data: null,
    title: "",
    message: error.message || "Something went wrong",
    // errors: "// todo"
  };

  switch (statusCode) {
    case STATUS_CODE.BAD_REQUEST:
      errResponse.title = "Bad Request";
      break;
    case STATUS_CODE.NOT_FOUND:
      errResponse.title = "Not Found";
      break;
    case STATUS_CODE.UNAUTHORIZED:
      errResponse.title = "Unauthorized";
      break;
    case STATUS_CODE.FORBIDDEN:
      errResponse.title = "Permission Denied";
      break;
    case STATUS_CODE.CONFLICT:
      errResponse.title = "Duplicate Resource";
      break;
    case STATUS_CODE.NOT_ALLOWED:
      errResponse.title = "Operation not allowed";
      break;
    default:
      errResponse.title = "Internal Server Error";
      break;
  }

  // Check if the environment is "development" to include the stackTrace
  if (!conf.production) {
    errResponse.stackTrace = error.stack;
  }

  if (statusCode === STATUS_CODE.SERVER_ERROR) {
    const logData = {
      timeStamp: new Date().toString(),
      reqUrl: req.url,
      reqBody: req.body,
      resBody: errResponse,
    };

    logger.error(logData);
  }

  removeUnusedMulterImageFileOnError(req);
  return res.status(statusCode).json(errResponse);
};

export default errorHandler;
