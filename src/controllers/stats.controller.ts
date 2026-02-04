import { Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, DashboardStats, ScanStats } from '../utils';

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Statistiques générales
    const [
      totalMerchants,
      activeMerchants,
      totalScans,
      _activeSubscriptions,
    ] = await Promise.all([
      prisma.merchant.count(),
      prisma.merchant.count({ where: { isActive: true } }),
      prisma.scan.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Calcul du revenu total (somme des abonnements actifs)
    const revenueData = await prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { price: true },
    });

    // Commerçants récents
    const recentMerchants = await prisma.merchant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        phoneNumber: true,
        city: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Scans récents
    const recentScans = await prisma.scan.findMany({
      take: 10,
      orderBy: { scannedAt: 'desc' },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            city: true,
          },
        },
      },
    });

    // Statistiques par mois (derniers 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const dashboardStats: DashboardStats = {
      totalMerchants,
      activeMerchants,
      totalScans,
      totalRevenue: revenueData._sum.price || 0,
      recentMerchants,
      recentScans,
    };

    sendSuccess(res, dashboardStats, 'Statistiques récupérées avec succès');
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    sendError(res, 'Erreur lors de la récupération des statistiques', 500);
  }
};

export const getMerchantStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;

    // Vérifier si le commerçant existe
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      sendError(res, 'Commerçant non trouvé', 404);
      return;
    }

    // Total des scans
    const totalScans = await prisma.scan.count({
      where: { merchantId },
    });

    // Scans aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scansToday = await prisma.scan.count({
      where: {
        merchantId,
        scannedAt: { gte: today },
      },
    });

    // Scans cette semaine
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const scansThisWeek = await prisma.scan.count({
      where: {
        merchantId,
        scannedAt: { gte: startOfWeek },
      },
    });

    // Scans ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const scansThisMonth = await prisma.scan.count({
      where: {
        merchantId,
        scannedAt: { gte: startOfMonth },
      },
    });

    // Scans par jour (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const scans = await prisma.scan.findMany({
      where: {
        merchantId,
        scannedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { scannedAt: 'asc' },
    });

    // Grouper les scans par jour
    const scansByDay = scans.reduce((acc: Array<{ date: string; count: number }>, scan: { scannedAt: Date }) => {
      const date = scan.scannedAt.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, []);

    // Scans par type d'appareil
    const scansByDevice = await prisma.scan.groupBy({
      by: ['deviceType'],
      where: { merchantId },
      _count: true,
    });

    const formattedScansByDevice = scansByDevice.map((item: { deviceType: string | null; _count: number }) => ({
      deviceType: item.deviceType || 'Unknown',
      count: item._count,
    }));

    const stats: ScanStats = {
      totalScans,
      scansToday,
      scansThisWeek,
      scansThisMonth,
      scansByDay,
      scansByDevice: formattedScansByDevice,
    };

    sendSuccess(res, stats, 'Statistiques du commerçant récupérées avec succès');
  } catch (error) {
    console.error('Get merchant stats error:', error);
    sendError(res, 'Erreur lors de la récupération des statistiques', 500);
  }
};

export const getTopMerchants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    // Récupérer les commerçants avec le plus de scans
    const merchants = await prisma.merchant.findMany({
      take: Number(limit),
      include: {
        _count: {
          select: { scans: true },
        },
        businessCard: {
          select: {
            qrCode: true,
            cardType: true,
          },
        },
      },
      orderBy: {
        scans: {
          _count: 'desc',
        },
      },
    });

    const topMerchants = merchants.map((merchant: { id: string; businessName: string; ownerName: string; city: string | null; _count: { scans: number }; businessCard: { cardType: string } | null }) => ({
      id: merchant.id,
      businessName: merchant.businessName,
      ownerName: merchant.ownerName,
      city: merchant.city,
      totalScans: merchant._count.scans,
      cardType: merchant.businessCard?.cardType,
    }));

    sendSuccess(res, topMerchants, 'Top commerçants récupérés avec succès');
  } catch (error) {
    console.error('Get top merchants error:', error);
    sendError(res, 'Erreur lors de la récupération du classement', 500);
  }
};

export const getScanHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [scans, total] = await Promise.all([
      prisma.scan.findMany({
        where: { merchantId },
        skip,
        take: Number(limit),
        orderBy: { scannedAt: 'desc' },
      }),
      prisma.scan.count({ where: { merchantId } }),
    ]);

    sendSuccess(res, {
      scans,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Historique des scans récupéré avec succès');
  } catch (error) {
    console.error('Get scan history error:', error);
    sendError(res, 'Erreur lors de la récupération de l\'historique', 500);
  }
};