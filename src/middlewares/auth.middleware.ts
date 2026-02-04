import { Response, NextFunction } from 'express';
import { verifyToken, UserRole } from '../utils/jwt';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { AuthRequest } from '../utils';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Token manquant ou invalide');
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      sendUnauthorized(res, 'Token invalide ou expiré');
      return;
    }
  } catch (error) {
    sendUnauthorized(res, 'Erreur d\'authentification');
    return;
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Non authentifié');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Vous n\'avez pas les permissions nécessaires');
      return;
    }

    next();
  };
};