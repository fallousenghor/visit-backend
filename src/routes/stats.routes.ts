import { Router } from 'express';
import {
  getDashboardStats,
  getMerchantStats,
  getTopMerchants,
  getScanHistory,
} from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/merchants/top', getTopMerchants);
router.get('/merchant/:merchantId', getMerchantStats);
router.get('/merchant/:merchantId/scans', getScanHistory);

export default router;