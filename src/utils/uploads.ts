import cloudinary from '../config/cloudinary';

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
}

export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string = 'business-cards'
): Promise<UploadResult> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
};

export const uploadQRCode = async (
  base64Data: string,
  qrCode: string
): Promise<UploadResult> => {
  try {
    // Extraire les données base64
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'qr-codes',
          public_id: `qr_${qrCode}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    throw new Error('Erreur lors de l\'upload du QR code');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error('Erreur lors de la suppression de l\'image');
  }
};

export const uploadLogo = async (
  fileBuffer: Buffer,
  merchantId: string
): Promise<UploadResult> => {
  try {
    console.log('=== Début uploadLogo ===');
    console.log('Buffer size:', fileBuffer.length);
    console.log('Merchant ID:', merchantId);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'merchants/logos',
          public_id: `logo_${merchantId}`,
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Erreur Cloudinary uploadLogo:', error);
            reject(error);
          } else if (result) {
            console.log('UploadLogo succès:', result.secure_url);
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Erreur dans uploadLogo:', error);
    throw new Error('Erreur lors de l\'upload du logo');
  }
};
