import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : 0,
};