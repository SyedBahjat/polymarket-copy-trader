import dotenv from 'dotenv';
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error(`Copy .env.example to .env and fill in your values.`);
    process.exit(1);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const ENV = {
  PRIVATE_KEY: required('PRIVATE_KEY'),
  PROXY_WALLET: required('PROXY_WALLET'),

  TRADER_ADDRESSES: required('TRADER_ADDRESSES')
    .split(',')
    .map((a) => a.trim().toLowerCase()),

  COPY_AMOUNT_USD: parseFloat(optional('COPY_AMOUNT_USD', '1')),
  MAX_BALANCE_PERCENT: parseFloat(optional('MAX_BALANCE_PERCENT', '50')),
  POLL_INTERVAL: parseInt(optional('POLL_INTERVAL', '30'), 10),

  CLOB_API_URL: optional('CLOB_API_URL', 'https://clob.polymarket.com'),
  DATA_API_URL: optional('DATA_API_URL', 'https://data-api.polymarket.com'),
  RPC_URL: optional('RPC_URL', 'https://polygon-rpc.com'),

  DRY_RUN: optional('DRY_RUN', 'true').toLowerCase() === 'true',
  DASHBOARD_PORT: parseInt(optional('DASHBOARD_PORT', '3333'), 10),
};
