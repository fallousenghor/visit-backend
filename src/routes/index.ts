import { Router } from 'express';
import authRoutes from './auth.routes';
import businessCardRoutes from './businessCard.routes';
import statsRoutes from './stats.routes';
import merchantRoutes from './merchant.routes';


const router = Router();

// Configuration des routes principales
router.use('/auth', authRoutes);
router.use('/merchants', merchantRoutes);
router.use('/cards', businessCardRoutes);
router.use('/stats', statsRoutes);

// Route de test
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;