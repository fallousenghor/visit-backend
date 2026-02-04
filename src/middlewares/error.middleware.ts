import { Request, Response, NextFunction } from 'express';
import { sendServerError } from '../utils/response';

// Express error handler requires 4 parameters
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      error: err.message,
    });
    return;
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Token invalide ou expiré') {
    res.status(401).json({
      success: false,
      message: 'Non autorisé',
      error: err.message,
    });
    return;
  }

  sendServerError(
    res,
    'Une erreur est survenue',
    process.env.NODE_ENV === 'development' ? err.message : undefined
  );
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`,
  });
};
