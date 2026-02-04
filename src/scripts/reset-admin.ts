import bcrypt from 'bcryptjs';
import prisma from '../config/database';

const resetAdmin = async () => {
  const email = 'fallousenghor@gmail.com';
  const newPassword = 'Admin@123';
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  
  console.log('✅ Mot de passe admin réinitialisé');
};

resetAdmin()
  .then(() => prisma.$disconnect())
  .catch(console.error);
