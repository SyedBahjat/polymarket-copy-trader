import { ethers } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';
import { SignatureType } from '@polymarket/order-utils';
import { ENV } from '../config/env';
import Logger from './logger';

let clientInstance: ClobClient | null = null;

async function isGnosisSafe(address: string): Promise<boolean> {
  try {
    const provider = new ethers.providers.JsonRpcProvider(ENV.RPC_URL);
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch {
    return false;
  }
}

export async function getClobClient(): Promise<ClobClient> {
  if (clientInstance) return clientInstance;

  const wallet = new ethers.Wallet(ENV.PRIVATE_KEY);
  const isSafe = await isGnosisSafe(ENV.PROXY_WALLET);
  const sigType = isSafe ? SignatureType.POLY_GNOSIS_SAFE : SignatureType.EOA;

  Logger.info(`Wallet type: ${isSafe ? 'Gnosis Safe' : 'EOA'}`);

  let client = new ClobClient(
    ENV.CLOB_API_URL,
    137,
    wallet,
    undefined,
    sigType,
    isSafe ? ENV.PROXY_WALLET : undefined
  );

  let creds = await client.createApiKey();
  if (!creds.key) {
    creds = await client.deriveApiKey();
  }

  clientInstance = new ClobClient(
    ENV.CLOB_API_URL,
    137,
    wallet,
    creds,
    sigType,
    isSafe ? ENV.PROXY_WALLET : undefined
  );

  Logger.info('CLOB client initialized successfully');
  return clientInstance;
}
