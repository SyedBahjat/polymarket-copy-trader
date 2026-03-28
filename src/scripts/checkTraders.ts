import { ENV } from '../config/env';
import { getTraderActivity, getTraderPositions } from '../utils/api';

async function main() {
  console.log('\n=========================================');
  console.log('  Trader Activity Check');
  console.log('=========================================\n');

  for (const address of ENV.TRADER_ADDRESSES) {
    console.log(`\nTrader: ${address}`);
    console.log('-'.repeat(50));

    const positions = await getTraderPositions(address);
    const activities = await getTraderActivity(address, 5);

    console.log(`  Active positions: ${positions.length}`);

    if (positions.length > 0) {
      console.log('\n  Top positions:');
      for (const pos of positions.slice(0, 5)) {
        const pnl = parseFloat(pos.cashPnl || '0');
        const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        console.log(`    "${pos.title}" (${pos.outcome})`);
        console.log(`      Size: ${parseFloat(pos.size).toFixed(2)} shares | PnL: ${pnlStr}`);
      }
    }

    if (activities.length > 0) {
      console.log('\n  Recent trades:');
      for (const act of activities) {
        const date = new Date(parseInt(act.timestamp) * 1000).toLocaleDateString();
        console.log(
          `    ${date} | ${act.side} "${act.title}" (${act.outcome}) @ $${parseFloat(act.price).toFixed(2)} | $${parseFloat(act.usdcSize).toFixed(2)}`
        );
      }
    }
  }

  console.log('\n');
}

main().catch(console.error);
