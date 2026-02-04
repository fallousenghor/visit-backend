import { Response } from 'express';
import { ApiResponse } from '.';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Succès',
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = 'Erreur',
  statusCode: number = 400,
  error?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Créé avec succès'
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendNoContent = (
  res: Response,
  message: string = 'Supprimé avec succès'
): Response => {
  return res.status(204).json({ success: true, message });
};

export const sendUnauthorized = (
  res: Response,
  message: string = 'Non autorisé'
): Response => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = 'Accès interdit'
): Response => {
  return sendError(res, message, 403);
};

export const sendNotFound = (
  res: Response,
  message: string = 'Ressource non trouvée'
): Response => {
  return sendError(res, message, 404);
};

export const sendServerError = (
  res: Response,
  message: string = 'Erreur serveur',
  error?: string
): Response => {
  return sendError(res, message, 500, error);
};