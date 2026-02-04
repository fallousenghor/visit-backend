import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBusinessCard,
  getBusinessCardByMerchantId,
  getBusinessCardByQRCode,
  updateBusinessCard,
  regenerateQRCode,
  renewBusinessCard,
  deleteBusinessCard,
} from '../controllers/businessCard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Validation pour la création d'une carte
const createCardValidation = [
  body('merchantId')
    .trim()
    .notEmpty()
    .withMessage('L\'ID du commerçant est requis'),
  body('cardType')
    .optional()
    .isIn(['BASIC', 'PREMIUM', 'ENTERPRISE'])
    .withMessage('Type de carte invalide'),
  body('nfcEnabled')
    .optional()
    .isBoolean()
    .withMessage('nfcEnabled doit être un booléen'),
];

// Route publique pour scanner une carte (pas d'authentification requise)
router.get('/scan/:qrCode', getBusinessCardByQRCode);

// Routes protégées
router.use(authenticate);

router.post(
  '/',
  authorize('ADMIN', 'AGENT'),
  createCardValidation,
  validate,
  createBusinessCard
);

router.get('/merchant/:merchantId', getBusinessCardByMerchantId);

router.put('/:id', authorize('ADMIN', 'AGENT'), updateBusinessCard);

router.post('/:id/regenerate', authorize('ADMIN'), regenerateQRCode);

router.post('/:id/renew', authorize('ADMIN', 'AGENT'), renewBusinessCard);

router.delete('/:id', authorize('ADMIN'), deleteBusinessCard);

export default router;