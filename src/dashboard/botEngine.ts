import { EventEmitter } from 'events';
import { ENV } from '../config/env';
import { checkForNewTrades, NewTrade } from '../services/traderMonitor';
import { executeCopyTrade, TradeResult } from '../services/tradeExecutor';
import { getTraderActivity, getTraderPositions, TraderActivity, Position } from '../utils/api';
import Logger from '../utils/logger';

export interface TradeLogEntry {
  timestamp: string;
  traderAddress: string;
  title: string;
  outcome: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  action: 'executed' | 'dry-run' | 'skipped';
  reason?: string;
}

export interface TraderSnapshot {
  address: string;
  positions: Position[];
  recentActivity: TraderActivity[];
  lastUpdated: string;
}

class BotEngine extends EventEmitter {
  status: 'running' | 'stopped' = 'stopped';
  startedAt: Date | null = null;
  tradeLog: TradeLogEntry[] = [];
  traderSnapshots: Map<string, TraderSnapshot> = new Map();
  private pollHandle: NodeJS.Timeout | null = null;
  private baselineSet = false;

  get dryRun() {
    return ENV.DRY_RUN;
  }

  async start() {
    if (this.status === 'running') return;
    this.status = 'running';
    this.startedAt = new Date();

    Logger.info('Bot started');

    // Set baseline
    if (!this.baselineSet) {
      Logger.info('Performing initial scan to set baseline...');
      await checkForNewTrades();
      this.baselineSet = true;
      Logger.info('Baseline set. Now monitoring for new trades...');
    }

    // Refresh trader data immediately
    await this.refreshTraderData();

    // Start polling
    this.pollHandle = setInterval(() => this.poll(), ENV.POLL_INTERVAL * 1000);
    this.emit('stateChange', this.getState());
  }

  stop() {
    if (this.status === 'stopped') return;
    this.status = 'stopped';
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    Logger.info('Bot stopped');
    this.emit('stateChange', this.getState());
  }

  private async poll() {
    try {
      const newTrades = await checkForNewTrades();

      for (const trade of newTrades) {
        const result = await executeCopyTrade(trade);
        this.addTradeLog(trade, result);
      }

      // Refresh trader data every poll
      await this.refreshTraderData();

      this.emit('stateChange', this.getState());
    } catch (err: any) {
      Logger.error(`Poll error: ${err.message}`);
    }
  }

  private addTradeLog(trade: NewTrade, result: TradeResult) {
    const entry: TradeLogEntry = {
      timestamp: new Date().toISOString(),
      traderAddress: trade.traderAddress,
      title: trade.title,
      outcome: trade.outcome,
      side: trade.side,
      price: trade.price,
      size: trade.usdcSize,
      action: result.action,
      reason: result.reason,
    };
    this.tradeLog.unshift(entry);
    if (this.tradeLog.length > 200) this.tradeLog.pop();
  }

  private async refreshTraderData() {
    for (const address of ENV.TRADER_ADDRESSES) {
      try {
        const [positions, activity] = await Promise.all([
          getTraderPositions(address),
          getTraderActivity(address, 10),
        ]);
        this.traderSnapshots.set(address, {
          address,
          positions,
          recentActivity: activity,
          lastUpdated: new Date().toISOString(),
        });
      } catch (err: any) {
        Logger.error(`Failed to refresh data for ${address}: ${err.message}`);
      }
    }
  }

  getState() {
    return {
      status: this.status,
      dryRun: ENV.DRY_RUN,
      uptime: this.startedAt ? Math.floor((Date.now() - this.startedAt.getTime()) / 1000) : 0,
      copyAmount: ENV.COPY_AMOUNT_USD,
      pollInterval: ENV.POLL_INTERVAL,
      traders: Array.from(this.traderSnapshots.values()),
      tradeLog: this.tradeLog.slice(0, 50),
    };
  }
}

export const botEngine = new BotEngine();
