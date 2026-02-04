import { Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/response';
import { AuthRequest, CreateMerchantDTO, UpdateMerchantDTO } from '../utils';
import { uploadQRCode, uploadLogo } from '../utils/uploads';
import { generateUniqueCode, generateQRCodeImage, generatePublicUrl } from '../utils/qrcode';
import { PackType } from '../utils';

export const createMerchant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Utilisateur non authentifié', 401);
      return;
    }

    const merchantData: CreateMerchantDTO = req.body;

    // Upload du logo si fourni
    let logoUrl: string | undefined;
    console.log('=== CREATE MERCHANT ===');
    console.log('req.file exists:', !!req.file);
    if (req.file) {
      console.log('req.file details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
      const logoPublicId = `logo_${merchantData.businessName.replace(/\s+/g, '_').toLowerCase()}`;
      try {
        const uploadResult = await uploadLogo(req.file.buffer, logoPublicId);
        logoUrl = uploadResult.secureUrl;
        console.log('Logo uploaded successfully:', logoUrl);
      } catch (uploadError) {
        console.error('Logo upload failed:', uploadError);
      }
    } else {
      console.log('No file in req.file');
    }

    // Créer le commerçant
    const merchant = await prisma.merchant.create({
      data: {
        ...merchantData,
        logo: logoUrl,
        createdByUserId: req.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Auto-créer une carte de visite pour le commerçant
    try {
      const qrCode = generateUniqueCode();
      const publicUrl = generatePublicUrl(qrCode);
      const qrCodeDataURL = await generateQRCodeImage(publicUrl);
      const qrCodeUpload = await uploadQRCode(qrCodeDataURL, qrCode);

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await prisma.businessCard.create({
        data: {
          merchantId: merchant.id,
          qrCode,
          qrCodeImage: qrCodeUpload.secureUrl,
          publicUrl,
          cardType: PackType.BASIC,
          nfcEnabled: false,
          expiresAt,
        },
      });
    } catch (cardError) {
      console.error('Erreur lors de la création automatique de la carte:', cardError);
    }

    sendCreated(res, merchant, 'Commerçant créé avec succès');
  } catch (error: any) {
    console.error('Create merchant error:', error);
    
    // Handle Prisma unique constraint violation (P2002)
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      sendError(res, `Un commerçant avec ce ${field} existe déjà`, 409);
      return;
    }
    
    sendError(res, 'Erreur lors de la création du commerçant', 500);
  }
};

export const getAllMerchants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, isActive, city } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Construire les filtres
    const where: any = {};

    if (search) {
      where.OR = [
        { businessName: { contains: search as string, mode: 'insensitive' } },
        { ownerName: { contains: search as string, mode: 'insensitive' } },
        { phoneNumber: { contains: search as string } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (city) {
      where.city = city as string;
    }

    // Récupérer les commerçants avec pagination
    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          businessCard: true,
          _count: {
            select: {
              scans: true,
              subscriptions: true,
            },
          },
        },
      }),
      prisma.merchant.count({ where }),
    ]);

    sendSuccess(res, {
      merchants,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Commerçants récupérés avec succès');
  } catch (error) {
    console.error('Get all merchants error:', error);
    sendError(res, 'Erreur lors de la récupération des commerçants', 500);
  }
};

export const getMerchantById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        businessCard: true,
        openingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        paymentMethods: {
          where: { isActive: true },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            scans: true,
          },
        },
      },
    });

    if (!merchant) {
      sendNotFound(res, 'Commerçant non trouvé');
      return;
    }

    sendSuccess(res, merchant, 'Commerçant récupéré avec succès');
  } catch (error) {
    console.error('Get merchant by id error:', error);
    sendError(res, 'Erreur lors de la récupération du commerçant', 500);
  }
};

export const updateMerchant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updateData: UpdateMerchantDTO = req.body;

    // Convertir useGradient de string en boolean si nécessaire
    if (updateData.useGradient !== undefined && typeof updateData.useGradient === 'string') {
      updateData = {
        ...updateData,
        useGradient: updateData.useGradient === 'true',
      };
    }

    // Vérifier si le commerçant existe
    const existingMerchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!existingMerchant) {
      sendNotFound(res, 'Commerçant non trouvé');
      return;
    }

    // Upload du nouveau logo si fourni
    let logoUrl = existingMerchant.logo;
    console.log('=== UPDATE MERCHANT ===');
    console.log('req.file exists:', !!req.file);
    if (req.file) {
      console.log('req.file details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
      try {
        const uploadResult = await uploadLogo(req.file.buffer, id);
        logoUrl = uploadResult.secureUrl;
        console.log('Logo uploaded successfully:', logoUrl);
      } catch (uploadError) {
        console.error('Logo upload failed:', uploadError);
      }
    } else {
      console.log('No file in req.file, keeping existing logo:', logoUrl);
    }

    // Mettre à jour le commerçant
    const merchant = await prisma.merchant.update({
      where: { id },
      data: {
        ...updateData,
        logo: logoUrl,
      },
      include: {
        businessCard: true,
        openingHours: true,
        paymentMethods: true,
      },
    });

    sendSuccess(res, merchant, 'Commerçant mis à jour avec succès');
  } catch (error: any) {
    console.error('Update merchant error:', error);
    
    // Handle Prisma unique constraint violation (P2002)
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      sendError(res, `Un commerçant avec ce ${field} existe déjà`, 409);
      return;
    }
    
    sendError(res, 'Erreur lors de la mise à jour du commerçant', 500);
  }
};

export const deleteMerchant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Vérifier si le commerçant existe
    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      sendNotFound(res, 'Commerçant non trouvé');
      return;
    }

    // Supprimer le commerçant (cascade sur les relations)
    await prisma.merchant.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Commerçant supprimé avec succès');
  } catch (error) {
    console.error('Delete merchant error:', error);
    sendError(res, 'Erreur lors de la suppression du commerçant', 500);
  }
};

export const toggleMerchantStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      sendNotFound(res, 'Commerçant non trouvé');
      return;
    }

    const updatedMerchant = await prisma.merchant.update({
      where: { id },
      data: { isActive: !merchant.isActive },
    });

    sendSuccess(
      res,
      updatedMerchant,
      `Commerçant ${updatedMerchant.isActive ? 'activé' : 'désactivé'} avec succès`
    );
  } catch (error) {
    console.error('Toggle merchant status error:', error);
    sendError(res, 'Erreur lors du changement de statut', 500);
  }
};