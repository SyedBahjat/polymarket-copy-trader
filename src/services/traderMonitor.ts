import { ENV } from '../config/env';
import { getTraderActivity, TraderActivity } from '../utils/api';
import Logger from '../utils/logger';

// Track last seen trade per trader to avoid duplicates
const lastSeenTrades: Map<string, string> = new Map();

export interface NewTrade {
  traderAddress: string;
  conditionId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  usdcSize: number;
  title: string;
  outcome: string;
  timestamp: string;
}

export async function checkForNewTrades(): Promise<NewTrade[]> {
  const newTrades: NewTrade[] = [];

  for (const trader of ENV.TRADER_ADDRESSES) {
    const activities = await getTraderActivity(trader, 10);

    if (activities.length === 0) continue;

    const lastSeen = lastSeenTrades.get(trader);
    const latestTimestamp = activities[0].timestamp;

    // First run: just record the latest trade, don't copy old ones
    if (!lastSeen) {
      lastSeenTrades.set(trader, latestTimestamp);
      Logger.info(
        `Initialized tracking for ${trader.slice(0, 10)}... (latest trade: ${activities[0].title})`
      );
      continue;
    }

    // Find trades newer than what we've seen
    for (const activity of activities) {
      if (activity.timestamp <= lastSeen) break;
      if (activity.type !== 'TRADE') continue;

      const trade: NewTrade = {
        traderAddress: trader,
        conditionId: activity.conditionId,
        tokenId: activity.asset,
        side: activity.side as 'BUY' | 'SELL',
        price: parseFloat(activity.price),
        size: parseFloat(activity.size),
        usdcSize: parseFloat(activity.usdcSize),
        title: activity.title,
        outcome: activity.outcome,
        timestamp: activity.timestamp,
      };

      newTrades.push(trade);
      Logger.info(
        `New trade detected from ${trader.slice(0, 10)}...: ${trade.side} on "${trade.title}" (${trade.outcome}) @ $${trade.price.toFixed(2)}`
      );
    }

    lastSeenTrades.set(trader, latestTimestamp);
  }

  return newTrades;
}
