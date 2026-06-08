import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'production',
  port: parseInt(process.env.PORT ?? '5000', 10),
  mongoUri: requireEnv('MONGODB_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
} as const;
