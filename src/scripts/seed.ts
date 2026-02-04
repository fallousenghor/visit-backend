import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import prisma from '../config/database';

dotenv.config();

// Default logo placeholder (base64 encoded 1x1 transparent PNG)
const DEFAULT_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const uploadLogoToCloudinary = async (businessName: string): Promise<string> => {
  const { uploadLogo } = await import('../utils/uploads');
  const base64Data = DEFAULT_LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const logoPublicId = `logo_${businessName.replace(/\s+/g, '_').toLowerCase()}`;
  const uploadResult = await uploadLogo(buffer, logoPublicId);
  return uploadResult.secureUrl;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Début du seeding de la base de données...');

    // Créer un admin par défaut
    const adminEmail = process.env.ADMIN_EMAIL || 'fallousenghor@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('⚠️  Un administrateur existe déjà');
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'System',
          role: 'ADMIN',
        },
      });

      console.log('✅ Administrateur créé avec succès');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Mot de passe:', adminPassword);
    }

    // Créer un agent par défaut
    const agentEmail = process.env.AGENT_EMAIL || 'agent@smartcard.sn';
    const agentPassword = process.env.AGENT_PASSWORD || 'Agent@123456';

    const existingAgent = await prisma.user.findUnique({
      where: { email: agentEmail },
    });

    if (existingAgent) {
      console.log('⚠️  Un agent existe déjà');
    } else {
      const hashedPassword = await bcrypt.hash(agentPassword, 10);

      await prisma.user.create({
        data: {
          email: agentEmail,
          password: hashedPassword,
          firstName: 'Agent',
          lastName: 'SmartCard',
          role: 'AGENT',
        },
      });

      console.log('✅ Agent créé avec succès');
      console.log('📧 Email:', agentEmail);
      console.log('🔑 Mot de passe:', agentPassword);
    }

    // Créer des commerces de test avec des cartes de visite
    const testMerchants = [
      {
        businessName: 'Boutique Test',
        ownerName: 'Ali Diop',
        phoneNumber: '+221 77 123 45 67',
        email: 'boutique@test.com',
        description: 'Une boutique de test',
        category: 'Commerce de détail',
        address: '123 Rue Principale',
        city: 'Dakar',
        country: 'Sénégal',
      },
      {
        businessName: 'Restaurant Le Dakar',
        ownerName: 'Marie Ndiaye',
        phoneNumber: '+221 77 987 65 43',
        email: 'restaurant@ledakar.sn',
        description: 'Restaurant familial',
        category: 'Restauration',
        address: '45 Avenue de la République',
        city: 'Dakar',
        country: 'Sénégal',
      },
    ];

    for (const merchantData of testMerchants) {
      const existingMerchant = await prisma.merchant.findFirst({
        where: { email: merchantData.email },
      });

      if (existingMerchant) {
        console.log(`⚠️  Le commerce "${merchantData.businessName}" existe déjà`);
      } else {
        // Créer le commerce
        const merchant = await prisma.merchant.create({
          data: {
            ...merchantData,
            isActive: true,
            isVerified: true,
            userId: existingAdmin?.id,
            createdByUserId: existingAdmin?.id,
          },
        });
        console.log(`✅ Commerce "${merchantData.businessName}" créé`);

        // Upload du logo par défaut sur Cloudinary
        try {
          const logoUrl = await uploadLogoToCloudinary(merchantData.businessName);
          console.log(`✅ Logo uploadé sur Cloudinary pour "${merchantData.businessName}"`);

          // Mettre à jour le commerce avec le logo
          await prisma.merchant.update({
            where: { id: merchant.id },
            data: { logo: logoUrl },
          });
        } catch (logoError) {
          console.warn(`⚠️  Logo non uploadé pour "${merchantData.businessName}":`, logoError);
        }

        // Créer une carte de visite pour le commerce
        const { generateUniqueCode, generateQRCodeImage, generatePublicUrl } = await import('../utils/qrcode');
        const qrCode = generateUniqueCode();
        const publicUrl = generatePublicUrl(qrCode);
        const qrCodeDataURL = await generateQRCodeImage(publicUrl);
        const { uploadQRCode } = await import('../utils/uploads');
        const qrCodeUpload = await uploadQRCode(qrCodeDataURL, qrCode);

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await prisma.businessCard.create({
          data: {
            merchantId: merchant.id,
            qrCode,
            qrCodeImage: qrCodeUpload.secureUrl,
            publicUrl,
            cardType: 'BASIC',
            nfcEnabled: false,
            expiresAt,
            isActive: true,
          },
        });
        console.log(`✅ Carte de visite créée pour "${merchantData.businessName}"`);
      }
    }

    console.log('✨ Seeding terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase()
  .then(() => {
    console.log('👋 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
