import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Vérifier si les colonnes existent
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'merchants'
      AND column_name IN ('secondaryColor', 'useGradient')
    `;
    
    console.log('Colonnes existantes:', result);
    
    // Ajouter les colonnes si elles n'existent pas
    try {
      console.log('Tentative d ajout de secondaryColor...');
      await prisma.$executeRaw`ALTER TABLE merchants ADD COLUMN secondaryColor VARCHAR(7) DEFAULT '#764ba2'`;
      console.log('✓ secondaryColor ajoutée');
    } catch (e: any) {
      console.log('secondaryColor:', e.message);
    }
    
    try {
      console.log('Tentative d ajout de useGradient...');
      await prisma.$executeRaw`ALTER TABLE merchants ADD COLUMN useGradient BOOLEAN DEFAULT true`;
      console.log('✓ useGradient ajoutée');
    } catch (e: any) {
      console.log('useGradient:', e.message);
    }
    
    // Vérifier à nouveau
    const result2 = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'merchants'
      AND column_name IN ('secondaryColor', 'useGradient')
    `;
    
    console.log('\nColonnes après ajout:', result2);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

