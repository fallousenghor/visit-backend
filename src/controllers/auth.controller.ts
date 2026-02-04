import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { RegisterDTO, LoginDTO, AuthRequest } from '../utils';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName }: RegisterDTO = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(res, 'Cet email est déjà utilisé', 400);
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Générer le token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    sendCreated(res, { user, token }, 'Compte créé avec succès');
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Erreur lors de la création du compte', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendError(res, 'Email ou mot de passe incorrect', 401);
      return;
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      sendError(res, 'Votre compte est désactivé', 403);
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      sendError(res, 'Email ou mot de passe incorrect', 401);
      return;
    }

    // Générer le token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    sendSuccess(res, { user: userResponse, token }, 'Connexion réussie');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Erreur lors de la connexion', 500);
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Utilisateur non authentifié', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    sendSuccess(res, user, 'Profil récupéré avec succès');
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Erreur lors de la récupération du profil', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Utilisateur non authentifié', 401);
      return;
    }

    const { firstName, lastName } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, user, 'Profil mis à jour avec succès');
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Erreur lors de la mise à jour du profil', 500);
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Utilisateur non authentifié', 401);
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      sendError(res, 'Mot de passe actuel incorrect', 401);
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    sendSuccess(res, null, 'Mot de passe modifié avec succès');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Erreur lors du changement de mot de passe', 500);
  }
};