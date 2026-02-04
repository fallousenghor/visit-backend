import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Define UserRole locally to avoid Prisma dependency issues
export type UserRole = 'ADMIN' | 'AGENT' | 'USER';

export const UserRole = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  USER: 'USER',
} as const;

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: '7d' as const,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};