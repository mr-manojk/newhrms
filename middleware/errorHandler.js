// @ts-nocheck
/**
 * @param {any} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // Log the full stack trace to the server logs (visible in Render Dashboard)
  console.error('❌ Backend Error:', err);

  const status = err.status || 500;
  
  // Return descriptive error information to the client
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.',
    code: err.code || 'INTERNAL_ERROR', // e.g., 'ER_NO_SUCH_TABLE'
    status: status
  });
};

module.exports = errorHandler;
