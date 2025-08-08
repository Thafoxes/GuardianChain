export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      reports: '/api/reports',
      admin: '/api/admin'
    }
  });
};

export default notFound;
