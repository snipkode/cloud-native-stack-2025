import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== 'production';
const isSupabase = process.env.SUPABASE_DB_URL && !process.env.DATABASE_URL;

const sequelize = isDevelopment
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false,
    })
  : new Sequelize(
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  {
    dialect: 'postgres',
    logging: true,
    dialectOptions: isSupabase
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {}, // Tidak kirim opsi SSL kalau pakai dokku postgres
  }
);

export default sequelize;
