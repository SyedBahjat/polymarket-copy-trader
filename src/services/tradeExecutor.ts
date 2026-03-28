import { Side } from '@polymarket/clob-client';
import { ENV } from '../config/env';
import { getClobClient } from '../utils/clobClient';
import Logger from '../utils/logger';
import { NewTrade } from './traderMonitor';

export interface TradeResult {
  executed: boolean;
  action: 'executed' | 'dry-run' | 'skipped';
  reason?: string;
}

export async function executeCopyTrade(trade: NewTrade): Promise<TradeResult> {
  const copyAmount = ENV.COPY_AMOUNT_USD;

  if (trade.side === 'SELL') {
    Logger.info(`Skipping SELL trade on "${trade.title}" - sell copying not yet supported`);
    return { executed: false, action: 'skipped', reason: 'SELL not supported' };
  }

  if (trade.price > 0.95) {
    Logger.warn(`Skipping "${trade.title}" - price too high ($${trade.price.toFixed(2)})`);
    return { executed: false, action: 'skipped', reason: 'Price too high (>$0.95)' };
  }
  if (trade.price < 0.05) {
    Logger.warn(`Skipping "${trade.title}" - price too low ($${trade.price.toFixed(2)})`);
    return { executed: false, action: 'skipped', reason: 'Price too low (<$0.05)' };
  }

  const size = Math.floor((copyAmount / trade.price) * 100) / 100;

  if (size < 1) {
    Logger.warn(`Skipping "${trade.title}" - calculated size too small (${size})`);
    return { executed: false, action: 'skipped', reason: 'Size too small' };
  }

  if (ENV.DRY_RUN) {
    Logger.trade(
      `[DRY RUN] Would BUY ${size} shares of "${trade.title}" (${trade.outcome}) @ $${trade.price.toFixed(2)} = ~$${copyAmount.toFixed(2)}`
    );
    return { executed: false, action: 'dry-run' };
  }

  try {
    const client = await getClobClient();

    const order = await client.createAndPostOrder({
      tokenID: trade.tokenId,
      price: trade.price,
      side: Side.BUY,
      size,
    });

    if (order.success) {
      Logger.trade(
        `BUY ${size} shares of "${trade.title}" (${trade.outcome}) @ $${trade.price.toFixed(2)} | OrderID: ${order.orderID}`
      );
      return { executed: true, action: 'executed' };
    } else {
      Logger.error(`Order failed for "${trade.title}": ${order.errorMsg}`);
      return { executed: false, action: 'skipped', reason: `Order failed: ${order.errorMsg}` };
    }
  } catch (err: any) {
    Logger.error(`Trade execution failed: ${err.message}`);
    return { executed: false, action: 'skipped', reason: `Error: ${err.message}` };
  }
}
