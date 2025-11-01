import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type Environment = {
  port: number;
  jwtSecret: string;
  adminEmail: string;
  adminPassword: string;
  corsOrigins: string[];
  mongoUri: string;
  mongoDbName: string;
  mpesa: {
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
    initiatorName: string;
    securityCredential?: string;
    initiatorPassword?: string;
    certificatePath?: string;
    environment: 'sandbox' | 'production';
    callbackBaseUrl: string;
    c2bConfirmationUrl: string;
    c2bValidationUrl: string;
    b2cResultUrl: string;
    b2cQueueTimeoutUrl: string;
    countryCode: string;
  };
};

function parseOrigins(value?: string): string[] {
  if (!value) return ['http://localhost:5173'];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function sanitizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const callbackBase = sanitizeBaseUrl(process.env.MPESA_CALLBACK_BASE_URL || 'http://localhost:4000');
const callbackNamespace = `${callbackBase}/api/finance/mpesa`;
const mpesaEnvironment = process.env.MPESA_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

export const env: Environment = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-change-me',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@fluxobet.co.mz',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  mongoDbName: process.env.MONGO_DB_NAME || 'fluxobet',
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'your-consumer-key',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your-consumer-secret',
    shortcode: process.env.MPESA_SHORTCODE || '000000',
    passkey: process.env.MPESA_PASSKEY || 'your-passkey',
    initiatorName: process.env.MPESA_INITIATOR || 'apiInitiator',
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
    certificatePath: process.env.MPESA_CERTIFICATE_PATH,
    environment: mpesaEnvironment,
    callbackBaseUrl: callbackBase,
    c2bConfirmationUrl:
      process.env.MPESA_C2B_CONFIRMATION_URL || `${callbackNamespace}/c2b-confirmation`,
    c2bValidationUrl: process.env.MPESA_C2B_VALIDATION_URL || `${callbackNamespace}/c2b-validation`,
    b2cResultUrl: process.env.MPESA_B2C_RESULT_URL || `${callbackNamespace}/b2c-result`,
    b2cQueueTimeoutUrl:
      process.env.MPESA_B2C_QUEUE_URL || `${callbackNamespace}/b2c-timeout`,
    countryCode: process.env.MPESA_COUNTRY_CODE || '258',
  },
};
