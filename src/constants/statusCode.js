const STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  REDIRECT: 301,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NOT_ALLOWED: 405,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

Object.freeze(STATUS_CODE);

export default STATUS_CODE;

// 200 OK:

// Meaning: The request was successful, and the response contains the requested data.
// Typical Use: Returning data in response to a GET request.

// 201 Created:

// Meaning: The request has been successfully fulfilled, and a new resource has been created as a result.

// 204 No Content:

// Meaning: The request was successful, but there is no response body to return (usually used for DELETE operations).
// Typical Use: After successfully deleting a resource using a DELETE request.

// 301 (Permanent Redirect)
// The HTTP status code 301 means that the page you have requested has moved to a new URL and which is permanent. In the future, whenever the user requests the same website, it will be redirected to the new URL. The modified permanent URL is given by the location filed in response.

// 400 Bad Request:

// Meaning: The request is malformed or contains invalid data.
// Typical Use: Handling client-side validation errors or invalid input data.

// 401 Unauthorized:

// Meaning: The request lacks valid authentication credentials, or the provided credentials are invalid.
// Typical Use: Indicates that the user needs to log in or provide valid credentials.

// 403 Forbidden:

// Meaning: The request is understood, but the server refuses to fulfill it due to permissions or authentication issues.
// Typical Use: Indicates that the client does not have permission to access a resource.

// 404 Not Found:

// Meaning: The requested resource could not be found on the server.
// Typical Use: Handling requests for non-existent resources.

// 405 Method Not Allowed:

// Meaning: The HTTP method (e.g., GET, POST, PUT) used in the request is not allowed for the requested resource.
// Typical Use: Handling requests with unsupported HTTP methods.

// 409 Conflict.

// status code indicates that the request could not be completed due to a conflict with the current state of the target resource.

// 500 Internal Server Error:

// Meaning: An unexpected error occurred on the server while processing the request.
// Typical Use: Indicating a server-side error that needs investigation and debugging.
