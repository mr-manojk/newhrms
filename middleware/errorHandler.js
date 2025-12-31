const errorHandler = (err, req, res, next) => {
  console.error('❌ Backend Error:', err.stack);

  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred on the server.';

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
