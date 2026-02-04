import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Renommer les colonnes pour utiliser le camelCase
    console.log('Renommage des colonnes...');
    
    await prisma.$executeRaw`ALTER TABLE merchants RENAME COLUMN secondarycolor TO "secondaryColor"`;
    console.log('✓ secondarycolor -> secondaryColor');
    
    await prisma.$executeRaw`ALTER TABLE merchants RENAME COLUMN usegradient TO "useGradient"`;
    console.log('✓ usegradient -> useGradient');
    
    console.log('\n✅ Colonnes renommées avec succès!');
    
    // Vérifier
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'merchants'
      AND column_name IN ('secondaryColor', 'useGradient')
    `;
    
    console.log('\nColonnes vérifiées:', result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

