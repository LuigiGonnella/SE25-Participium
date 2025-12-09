import 'dotenv/config';

// Set test environment variables if not present in .env
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = 'test-key-for-testing';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-secret-key';
}

if (!process.env.DB_TYPE) {
  process.env.DB_TYPE = 'sqlite';
}

if (!process.env.DB_DATABASE) {
  process.env.DB_DATABASE = ':memory:';
}

if (!process.env.TELEGRAM_BOT_BEARER) {
  process.env.TELEGRAM_BOT_BEARER = 'test-telegram-bearer-token';
}
