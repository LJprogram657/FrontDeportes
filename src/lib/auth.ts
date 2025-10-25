import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_EXPIRES_IN = '60m';

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.sub) return null;

  const user = await prisma.user.findUnique({ where: { id: Number(decoded.sub) } });
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAdmin(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || !user.isAdmin) return null;
  return user;
}