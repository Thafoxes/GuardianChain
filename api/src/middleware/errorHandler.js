import { logger } from '../utils/logger.js';

export const errorHandler = (error, req, res, next) => {
  logger.error(`${req.method} ${req.path} - ${error.message}`, { 
    error: error.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.message.includes('insufficient funds')) {
    statusCode = 400;
    message = 'Insufficient funds for transaction';
  } else if (error.message.includes('User denied')) {
    statusCode = 400;
    message = 'Transaction was rejected by user';
  } else if (error.message.includes('nonce')) {
    statusCode = 400;
    message = 'Transaction nonce error. Please try again';
  } else if (error.code === 'NETWORK_ERROR') {
    statusCode = 503;
    message = 'Network connection error. Please try again';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.message,
      stack: error.stack 
    })
  });
};

export default errorHandler;
