import argon2 from "argon2";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { config } from "./config.ts";
import type { AuthUser, UserRole } from "./types.ts";

interface JwtPayload {
  sub: string;
  clinicId: string;
  role: UserRole;
  name: string;
}

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signAccessToken(user: AuthUser) {
  const payload: JwtPayload = {
    sub: user.id,
    clinicId: user.clinicId,
    role: user.role,
    name: user.name,
  };

  const options: SignOptions = { expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, config.JWT_SECRET as Secret, options);
}

export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  return {
    id: decoded.sub,
    clinicId: decoded.clinicId,
    role: decoded.role,
    name: decoded.name,
  };
}
