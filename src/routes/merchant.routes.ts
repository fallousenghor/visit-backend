import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMerchant,
  getAllMerchants,
  getMerchantById,
  updateMerchant,
  deleteMerchant,
  toggleMerchantStatus,
} from '../controllers/merchand.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

// Validation pour la création d'un commerçant
const createMerchantValidation = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Le nom du commerce est requis'),
  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Le nom du propriétaire est requis'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Le numéro de téléphone est requis')
    .matches(/^(\+221)?[0-9]{9}$/)
    .withMessage('Format de téléphone invalide'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide'),
  body('city')
    .optional()
    .trim(),
  body('category')
    .optional()
    .trim(),
];

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes CRUD
router.post(
  '/',
  authorize('ADMIN', 'AGENT'),
  uploadSingle('logo'),
  createMerchantValidation,
  validate,
  createMerchant
);

router.get('/', getAllMerchants);

router.get('/:id', getMerchantById);

router.put(
  '/:id',
  authorize('ADMIN', 'AGENT'),
  uploadSingle('logo'),
  updateMerchant
);

router.delete('/:id', authorize('ADMIN'), deleteMerchant);

router.patch('/:id/toggle-status', authorize('ADMIN'), toggleMerchantStatus);

export default router;