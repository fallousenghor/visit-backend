import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding secondaryColor column...');
    await prisma.$executeRaw`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS secondaryColor VARCHAR(7) DEFAULT '#764ba2'`;
    console.log('✓ secondaryColor added');
    
    console.log('Adding useGradient column...');
    await prisma.$executeRaw`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS useGradient BOOLEAN DEFAULT true`;
    console.log('✓ useGradient added');
    
    console.log('\n✅ Columns added successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

