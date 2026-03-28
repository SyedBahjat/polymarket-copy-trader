import axios from 'axios';
import { ENV } from '../config/env';
import Logger from './logger';

const dataApi = axios.create({
  baseURL: ENV.DATA_API_URL,
  timeout: 15000,
  headers: { 'User-Agent': 'polymarket-copy-trader/1.0' },
});

export interface TraderActivity {
  proxyWallet: string;
  timestamp: string;
  conditionId: string;
  type: string;
  size: string;
  usdcSize: string;
  transactionHash: string;
  price: string;
  asset: string;
  side: string;
  outcomeIndex: string;
  title: string;
  slug: string;
  outcome: string;
  eventSlug: string;
}

export interface Position {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: string;
  avgPrice: string;
  currentValue: string;
  cashPnl: string;
  percentPnl: string;
  title: string;
  outcome: string;
}

export async function getTraderActivity(
  address: string,
  limit = 20
): Promise<TraderActivity[]> {
  try {
    const { data } = await dataApi.get('/activity', {
      params: {
        user: address,
        limit,
        type: 'TRADE',
        sortBy: 'TIMESTAMP',
        sortDirection: 'DESC',
      },
    });
    return data;
  } catch (err: any) {
    Logger.error(`Failed to fetch activity for ${address}: ${err.message}`);
    return [];
  }
}

export async function getTraderPositions(
  address: string
): Promise<Position[]> {
  try {
    const { data } = await dataApi.get('/positions', {
      params: {
        user: address,
        sizeThreshold: 0,
        limit: 100,
        sortBy: 'CURRENT',
        sortDirection: 'DESC',
      },
    });
    return data;
  } catch (err: any) {
    Logger.error(`Failed to fetch positions for ${address}: ${err.message}`);
    return [];
  }
}

export async function getMarketInfo(conditionId: string) {
  try {
    const { data } = await dataApi.get('/markets', {
      params: { condition_id: conditionId },
    });
    return Array.isArray(data) ? data[0] : data;
  } catch (err: any) {
    Logger.error(`Failed to fetch market ${conditionId}: ${err.message}`);
    return null;
  }
}
