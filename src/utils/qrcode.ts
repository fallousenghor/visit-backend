import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const generateUniqueCode = (): string => {
  return uuidv4();
};

export const generateQRCodeImage = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      type: 'image/png',
      margin: 1,
      width: 500,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Erreur lors de la génération du QR code');
  }
};

export const generatePublicUrl = (qrCode: string): string => {
  const baseUrl = process.env.CARD_PUBLIC_URL || 'http://localhost:5173/card';
  return `${baseUrl}/${qrCode}`;
};