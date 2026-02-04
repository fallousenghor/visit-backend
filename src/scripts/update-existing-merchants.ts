import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Mise à jour des commerçants existants...');
    
    // Mettre à jour les commerçants sans secondaryColor
    const result1 = await prisma.$executeRaw`
      UPDATE merchants 
      SET "secondaryColor" = '#764ba2' 
      WHERE "secondaryColor" IS NULL
    `;
    console.log(`✓ ${result1} commerçants mis à jour avec secondaryColor par défaut`);
    
    // Mettre à jour les commerçants sans useGradient
    const result2 = await prisma.$executeRaw`
      UPDATE merchants 
      SET "useGradient" = true 
      WHERE "useGradient" IS NULL
    `;
    console.log(`✓ ${result2} commerçants mis à jour avec useGradient par défaut`);
    
    // Vérifier les valeurs
    const merchants = await prisma.merchant.findMany({
      take: 5,
      select: {
        businessName: true,
        primaryColor: true,
        secondaryColor: true,
        useGradient: true,
      }
    });
    
    console.log('\nÉchantillon de commerçants:');
    console.table(merchants);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

