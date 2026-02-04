import { Router } from 'express';
import authRoutes from './auth.routes';
import businessCardRoutes from './businessCard.routes';
import statsRoutes from './stats.routes';
import merchantRoutes from './merchant.routes';


const router = Router();

// Redirect /card/:qrCode to frontend public card page
router.get('/card/:qrCode', (req, res) => {
  const frontendUrl = process.env.CARD_PUBLIC_URL || 'https://visit-frontend-skf6-cprpme11x-fallousenghors-projects.vercel.app/card';
  const { qrCode } = req.params;
  res.redirect(`${frontendUrl}/${qrCode}`);
});

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
