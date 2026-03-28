import { ENV } from './config/env';
import { botEngine } from './dashboard/botEngine';
import { startDashboard } from './dashboard/server';
import Logger from './utils/logger';

async function main() {
  console.log('\n=========================================');
  console.log('  Polymarket Copy Trader');
  console.log('=========================================\n');

  Logger.info(`Mode: ${ENV.DRY_RUN ? 'DRY RUN (no real trades)' : 'LIVE TRADING'}`);
  Logger.info(`Copy amount: $${ENV.COPY_AMOUNT_USD} per trade`);
  Logger.info(`Tracking ${ENV.TRADER_ADDRESSES.length} trader(s)`);
  Logger.info(`Poll interval: ${ENV.POLL_INTERVAL}s`);

  if (ENV.DRY_RUN) {
    console.log('\n  Running in DRY RUN mode - no real trades will execute.');
    console.log('  Set DRY_RUN=false in .env to enable live trading.\n');
  }

  // Start the web dashboard
  startDashboard();

  // Start the bot (auto-starts monitoring)
  await botEngine.start();
}

main().catch((err) => {
  Logger.error(`Fatal: ${err.message}`);
  process.exit(1);
});
