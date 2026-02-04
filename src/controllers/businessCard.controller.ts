import { Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/response';
import { generateUniqueCode, generateQRCodeImage, generatePublicUrl } from '../utils/qrcode';
import { PackType } from '../utils';
import { AuthRequest, CreateBusinessCardDTO } from '../utils';
import { uploadQRCode } from '../utils/uploads';

export const createBusinessCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, cardType, nfcEnabled }: CreateBusinessCardDTO = req.body;

    // Vérifier si le commerçant existe
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      sendNotFound(res, 'Commerçant non trouvé');
      return;
    }

    // Vérifier si une carte existe déjà
    const existingCard = await prisma.businessCard.findUnique({
      where: { merchantId },
    });

    if (existingCard) {
      sendError(res, 'Ce commerçant possède déjà une carte', 400);
      return;
    }

    // Générer un code unique
    const qrCode = generateUniqueCode();
    const publicUrl = generatePublicUrl(qrCode);

    // Générer le QR code image
    const qrCodeDataURL = await generateQRCodeImage(publicUrl);

    // Upload du QR code sur Cloudinary
    const qrCodeUpload = await uploadQRCode(qrCodeDataURL, qrCode);

    // Calculer la date d'expiration (1 an par défaut)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Créer la carte
    const businessCard = await prisma.businessCard.create({
      data: {
        merchantId,
        qrCode,
        qrCodeImage: qrCodeUpload.secureUrl,
        publicUrl,
        cardType: cardType || PackType.BASIC,
        nfcEnabled: nfcEnabled || false,
        expiresAt,
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phoneNumber: true,
          },
        },
      },
    });

    sendCreated(res, businessCard, 'Carte de visite créée avec succès');
  } catch (error) {
    console.error('Create business card error:', error);
    sendError(res, 'Erreur lors de la création de la carte', 500);
  }
};

export const getBusinessCardByMerchantId = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { merchantId } = req.params;

    const businessCard = await prisma.businessCard.findUnique({
      where: { merchantId },
      include: {
        merchant: true,
      },
    });

    if (!businessCard) {
      sendNotFound(res, 'Carte de visite non trouvée');
      return;
    }

    sendSuccess(res, businessCard, 'Carte de visite récupérée avec succès');
  } catch (error) {
    console.error('Get business card error:', error);
    sendError(res, 'Erreur lors de la récupération de la carte', 500);
  }
};

export const getBusinessCardByQRCode = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { qrCode } = req.params;

    const businessCard = await prisma.businessCard.findUnique({
      where: { qrCode },
      include: {
        merchant: {
          include: {
            openingHours: {
              orderBy: { dayOfWeek: 'asc' },
            },
            paymentMethods: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!businessCard) {
      sendNotFound(res, 'Carte de visite non trouvée');
      return;
    }

    if (!businessCard.isActive) {
      sendError(res, 'Cette carte est désactivée', 403);
      return;
    }

    // Vérifier l'expiration
    if (new Date() > businessCard.expiresAt) {
      sendError(res, 'Cette carte a expiré', 403);
      return;
    }

    // Enregistrer le scan
    await prisma.scan.create({
      data: {
        merchantId: businessCard.merchantId,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.socket.remoteAddress || '',
      },
    });

    sendSuccess(res, businessCard, 'Carte de visite récupérée avec succès');
  } catch (error) {
    console.error('Get business card by QR code error:', error);
    sendError(res, 'Erreur lors de la récupération de la carte', 500);
  }
};

export const updateBusinessCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cardType, nfcEnabled, isActive } = req.body;

    const businessCard = await prisma.businessCard.findUnique({
      where: { id },
    });

    if (!businessCard) {
      sendNotFound(res, 'Carte de visite non trouvée');
      return;
    }

    const updatedCard = await prisma.businessCard.update({
      where: { id },
      data: {
        cardType,
        nfcEnabled,
        isActive,
      },
      include: {
        merchant: true,
      },
    });

    sendSuccess(res, updatedCard, 'Carte de visite mise à jour avec succès');
  } catch (error) {
    console.error('Update business card error:', error);
    sendError(res, 'Erreur lors de la mise à jour de la carte', 500);
  }
};

export const regenerateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const businessCard = await prisma.businessCard.findUnique({
      where: { id },
    });

    if (!businessCard) {
      sendNotFound(res, 'Carte de visite non trouvée');
      return;
    }

    // Générer un nouveau code unique
    const qrCode = generateUniqueCode();
    const publicUrl = generatePublicUrl(qrCode);

    // Générer le nouveau QR code image
    const qrCodeDataURL = await generateQRCodeImage(publicUrl);

    // Upload du nouveau QR code
    const qrCodeUpload = await uploadQRCode(qrCodeDataURL, qrCode);

    // Mettre à jour la carte
    const updatedCard = await prisma.businessCard.update({
      where: { id },
      data: {
        qrCode,
        qrCodeImage: qrCodeUpload.secureUrl,
        publicUrl,
      },
      include: {
        merchant: true,
      },
    });

    sendSuccess(res, updatedCard, 'QR code régénéré avec succès');
  } catch (error) {
    console.error('Regenerate QR code error:', error);
    sendError(res, 'Erreur lors de la régénération du QR code', 500);
  }
};

export const renewBusinessCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { months = 12 } = req.body;

    const businessCard = await prisma.businessCard.findUnique({
      where: { id },
    });

    if (!businessCard) {
      sendNotFound(res, 'Carte de visite non trouvée');
      return;
    }

    // Calculer la nouvelle date d'expiration
    const currentExpiry = businessCard.expiresAt;
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + Number(months));

    // Renouveler la carte
    const renewedCard = await prisma.businessCard.update({
      where: { id },
      data: {
        expiresAt: newExpiry,
        isActive: true,
      },
      include: {
        merchant: true,
      },
    });

    sendSuccess(res, renewedCard, 'Carte de visite renouvelée avec succès');
  } catch (error) {
    console.error('Renew business card error:', error);
    sendError(res, 'Erreur lors du renouvellement de la carte', 500);
  }
};

export const deleteBusinessCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const businessCard = await prisma.businessCard.findUnique({
      where: { id },
    });

    if (!businessCard) {
      sendNotFound(res, 'Carte de visite non trouvée');
      return;
    }

    await prisma.businessCard.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Carte de visite supprimée avec succès');
  } catch (error) {
    console.error('Delete business card error:', error);
    sendError(res, 'Erreur lors de la suppression de la carte', 500);
  }
};