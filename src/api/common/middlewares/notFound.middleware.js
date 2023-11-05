import STATUS_CODE from "../../../constants/statusCode.js";

function notFoundHandler(req, res) {
  // todo
  return res.status(STATUS_CODE.NOT_ALLOWED).json({
    error: `API not found ${req.originalUrl}. Please check our documentation for information at http://localhost:3000/api/v1/docs`,
  });
}

export default notFoundHandler;
