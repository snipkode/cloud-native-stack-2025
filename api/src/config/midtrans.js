import dotenv from 'dotenv';

dotenv.config();

class MidtransConfig {
  constructor() {
    // Check that required environment variables are set
    this.validateConfig();
  }

  validateConfig() {
    if (!process.env.MIDTRANS_SERVER_KEY) {
      console.warn('WARNING: MIDTRANS_SERVER_KEY is not set. Midtrans integration will not work properly.');
    }
    if (!process.env.MIDTRANS_CLIENT_KEY) {
      console.warn('WARNING: MIDTRANS_CLIENT_KEY is not set. Midtrans integration will not work properly.');
    }
  }

  getConfig() {
    return {
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    };
  }
}

// Create a singleton instance
const midtransConfig = new MidtransConfig();

export default midtransConfig;