import multer from 'multer';
import { Request, RequestHandler } from 'express';

// Configuration du stockage en mémoire
const storage = multer.memoryStorage();

// Filtre pour accepter uniquement les images
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.'));
  }
};

// Filtre pour accepter les PDF
const pdfFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['application/pdf'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez PDF.'));
  }
};

// Configuration de multer pour les images
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Configuration de multer pour les PDF (CV)
const uploadPDF = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max pour les CV
  },
});

export const uploadSingle = (fieldName: string): RequestHandler => 
  uploadImage.single(fieldName) as unknown as RequestHandler;
export const uploadMultiple = (fieldName: string, maxCount: number): RequestHandler => 
  uploadImage.array(fieldName, maxCount) as unknown as RequestHandler;
export const uploadFields = (fields: { name: string; maxCount: number }[]): RequestHandler => 
  uploadImage.fields(fields) as unknown as RequestHandler;
export const uploadSinglePDF = (fieldName: string): RequestHandler => 
  uploadPDF.single(fieldName) as unknown as RequestHandler;

export default uploadImage;
