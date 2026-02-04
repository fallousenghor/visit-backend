import multer from 'multer';
import { Request } from 'express';
import { RequestHandler } from 'express';

// Configuration du stockage en mémoire
const storage = multer.memoryStorage();

// Filtre pour accepter uniquement les images
const fileFilter = (
  req: Request,
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

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export const uploadSingle = (fieldName: string): RequestHandler => 
  upload.single(fieldName) as unknown as RequestHandler;
export const uploadMultiple = (fieldName: string, maxCount: number): RequestHandler => 
  upload.array(fieldName, maxCount) as unknown as RequestHandler;
export const uploadFields = (fields: { name: string; maxCount: number }[]): RequestHandler => 
  upload.fields(fields) as unknown as RequestHandler;

export default upload;
