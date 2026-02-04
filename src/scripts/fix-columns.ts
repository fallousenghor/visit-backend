import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Vérifier TOUTES les colonnes de la table merchants
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'merchants'
      ORDER BY column_name
    `;
    
    console.log('Toutes les colonnes de merchants:');
    console.log(result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

