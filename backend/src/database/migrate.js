import sequelize from '../config/database.js';
import '../models/index.js';

async function migrate() {
  try {
    console.log('Starting database migration...');
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' }); // Using alter: true to handle schema changes
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
