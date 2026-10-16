const { randomUUID } = require("node:crypto");
function fail(status, message) {
  return Object.assign(new Error(message), { status, publicMessage: message });
}
function logError(scope, error, requestId = randomUUID()) {
  // Never log SDK errors, request/response objects, URLs, headers or document content.
  const safeCode = String(error?.code || error?.name || "Error")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 70);
  console.error(
    JSON.stringify({
      scope,
      requestId,
      code: safeCode,
      status: Number(error?.status || error?.statusCode) || 500,
    }),
  );
  return requestId;
}
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const requestId = logError(
    `${req.method} ${req.route?.path || "request"}`,
    error,
  );
  const status =
    error.code === "LIMIT_FILE_SIZE" ? 413 : Number(error.status) || 500;
  const message =
    error.code === "LIMIT_FILE_SIZE"
      ? "File exceeds the 10 MB limit."
      : error.publicMessage ||
        "The service could not complete this request. Check the backend diagnostic code and retry.";
  res
    .status(status >= 400 && status < 600 ? status : 500)
    .json({ message, requestId });
}
const route = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { fail, logError, errorHandler, route };
