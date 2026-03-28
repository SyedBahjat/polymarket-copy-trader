import express, { Response } from 'express';
import { ENV } from '../config/env';
import { botEngine } from './botEngine';
import Logger from '../utils/logger';

const sseClients: Map<number, Response> = new Map();
let clientIdCounter = 0;

function broadcast(data: object) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const [id, res] of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(id);
    }
  }
}

botEngine.on('stateChange', (state) => broadcast(state));

export function startDashboard() {
  const app = express();
  app.use(express.json());

  // SSE endpoint
  app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify(botEngine.getState())}\n\n`);

    const id = clientIdCounter++;
    sseClients.set(id, res);
    req.on('close', () => sseClients.delete(id));
  });

  // Control endpoints
  app.post('/api/bot/start', async (_req, res) => {
    await botEngine.start();
    res.json({ status: botEngine.status });
  });

  app.post('/api/bot/stop', (_req, res) => {
    botEngine.stop();
    res.json({ status: botEngine.status });
  });

  app.get('/api/status', (_req, res) => {
    res.json(botEngine.getState());
  });

  // Dashboard HTML
  app.get('/', (_req, res) => {
    res.type('html').send(dashboardHTML());
  });

  app.listen(ENV.DASHBOARD_PORT, () => {
    Logger.info(`Dashboard running at http://localhost:${ENV.DASHBOARD_PORT}`);
    console.log(`\n  Dashboard: http://localhost:${ENV.DASHBOARD_PORT}\n`);
  });
}

function dashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Polymarket Copy Trader</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0e17; color: #e1e5ee; min-height: 100vh; }

  .header { background: #111827; border-bottom: 1px solid #1f2937; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 20px; font-weight: 600; }
  .header h1 span { color: #818cf8; }
  .header-right { display: flex; align-items: center; gap: 16px; }

  .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .badge-running { background: #065f46; color: #34d399; }
  .badge-stopped { background: #7f1d1d; color: #fca5a5; }
  .badge-dry { background: #92400e; color: #fbbf24; }

  .btn { padding: 8px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-start { background: #059669; color: white; }
  .btn-start:hover { background: #047857; }
  .btn-stop { background: #dc2626; color: white; }
  .btn-stop:hover { background: #b91c1c; }

  .container { max-width: 1400px; margin: 0 auto; padding: 24px; }

  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; }
  .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stat-value { font-size: 28px; font-weight: 700; }
  .stat-value.green { color: #34d399; }
  .stat-value.yellow { color: #fbbf24; }
  .stat-value.blue { color: #60a5fa; }
  .stat-value.purple { color: #a78bfa; }

  .section { background: #111827; border: 1px solid #1f2937; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
  .section-header { padding: 16px 20px; border-bottom: 1px solid #1f2937; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .section-header .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot-green { background: #34d399; }
  .dot-blue { background: #60a5fa; }
  .dot-purple { background: #a78bfa; }

  .traders-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1px; background: #1f2937; }
  .trader-card { background: #111827; padding: 20px; }
  .trader-addr { font-family: monospace; font-size: 13px; color: #818cf8; margin-bottom: 12px; }
  .trader-meta { display: flex; gap: 16px; margin-bottom: 16px; }
  .trader-meta span { font-size: 12px; color: #6b7280; }
  .trader-meta span b { color: #e1e5ee; font-weight: 600; }

  .mini-table { width: 100%; font-size: 13px; }
  .mini-table th { text-align: left; color: #6b7280; font-weight: 500; padding: 4px 8px; font-size: 11px; text-transform: uppercase; }
  .mini-table td { padding: 4px 8px; border-top: 1px solid #1f2937; }
  .mini-table .truncate { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pnl-pos { color: #34d399; }
  .pnl-neg { color: #f87171; }

  .trade-log { max-height: 400px; overflow-y: auto; }
  .trade-log table { width: 100%; font-size: 13px; border-collapse: collapse; }
  .trade-log th { text-align: left; color: #6b7280; font-weight: 500; padding: 10px 16px; font-size: 11px; text-transform: uppercase; position: sticky; top: 0; background: #111827; }
  .trade-log td { padding: 10px 16px; border-top: 1px solid #1f2937; }
  .trade-log tr:hover { background: #1a2235; }

  .action-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .action-executed { background: #065f46; color: #34d399; }
  .action-dry-run { background: #92400e; color: #fbbf24; }
  .action-skipped { background: #374151; color: #9ca3af; }

  .side-buy { color: #34d399; font-weight: 600; }
  .side-sell { color: #f87171; font-weight: 600; }

  .empty-state { padding: 40px; text-align: center; color: #4b5563; }
  .empty-state p { font-size: 14px; margin-top: 8px; }

  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  @media (max-width: 768px) {
    .stats-row { grid-template-columns: repeat(2, 1fr); }
    .traders-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<div class="header">
  <h1><span>Polymarket</span> Copy Trader</h1>
  <div class="header-right">
    <span id="dryBadge" class="badge badge-dry" style="display:none">DRY RUN</span>
    <span id="statusBadge" class="badge badge-stopped">Stopped</span>
    <button id="toggleBtn" class="btn btn-start" onclick="toggleBot()">Start Bot</button>
  </div>
</div>

<div class="container">
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-label">Status</div>
      <div id="statStatus" class="stat-value green">--</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Uptime</div>
      <div id="statUptime" class="stat-value blue">--</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Copy Amount</div>
      <div id="statCopy" class="stat-value yellow">--</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Trades Logged</div>
      <div id="statTrades" class="stat-value purple">--</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header"><div class="dot dot-blue"></div> Tracked Traders</div>
    <div id="tradersGrid" class="traders-grid">
      <div class="empty-state"><p>Waiting for data...</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header"><div class="dot dot-purple"></div> Copy Trade Log</div>
    <div id="tradeLog" class="trade-log">
      <div class="empty-state">
        <p>No trades yet. The bot will log trades here when tracked traders make moves.</p>
      </div>
    </div>
  </div>
</div>

<script>
let currentStatus = 'stopped';

const es = new EventSource('/api/events');
es.onmessage = (e) => update(JSON.parse(e.data));

function update(s) {
  currentStatus = s.status;

  // Status badge
  const sb = document.getElementById('statusBadge');
  sb.textContent = s.status === 'running' ? 'Running' : 'Stopped';
  sb.className = 'badge ' + (s.status === 'running' ? 'badge-running' : 'badge-stopped');

  // Dry run badge
  const db = document.getElementById('dryBadge');
  db.style.display = s.dryRun ? 'inline' : 'none';

  // Toggle button
  const btn = document.getElementById('toggleBtn');
  btn.textContent = s.status === 'running' ? 'Stop Bot' : 'Start Bot';
  btn.className = 'btn ' + (s.status === 'running' ? 'btn-stop' : 'btn-start');

  // Stats
  document.getElementById('statStatus').textContent = s.status === 'running' ? 'Active' : 'Idle';
  document.getElementById('statStatus').className = 'stat-value ' + (s.status === 'running' ? 'green' : '');
  document.getElementById('statUptime').textContent = formatUptime(s.uptime);
  document.getElementById('statCopy').textContent = '$' + s.copyAmount;
  document.getElementById('statTrades').textContent = s.tradeLog.length;

  // Traders
  renderTraders(s.traders);

  // Trade log
  renderTradeLog(s.tradeLog);
}

function formatUptime(sec) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + s + 's';
  return s + 's';
}

function renderTraders(traders) {
  const grid = document.getElementById('tradersGrid');
  if (!traders || traders.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>No trader data yet. Start the bot to begin tracking.</p></div>';
    return;
  }
  grid.innerHTML = traders.map(t => {
    const addr = t.address.slice(0, 6) + '...' + t.address.slice(-4);
    const posCount = t.positions ? t.positions.length : 0;
    const topPos = (t.positions || []).slice(0, 3);
    const recentTrades = (t.recentActivity || []).slice(0, 5);

    return '<div class="trader-card">' +
      '<div class="trader-addr">' + addr + '</div>' +
      '<div class="trader-meta"><span>Positions: <b>' + posCount + '</b></span>' +
      '<span>Updated: <b>' + new Date(t.lastUpdated).toLocaleTimeString() + '</b></span></div>' +

      (topPos.length > 0 ? '<table class="mini-table"><tr><th>Position</th><th>PnL</th></tr>' +
        topPos.map(p => {
          const pnl = parseFloat(p.cashPnl || '0');
          const cls = pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
          return '<tr><td class="truncate">' + esc(p.title) + ' (' + esc(p.outcome) + ')</td>' +
            '<td class="' + cls + '">$' + pnl.toFixed(2) + '</td></tr>';
        }).join('') + '</table>' : '') +

      (recentTrades.length > 0 ? '<table class="mini-table" style="margin-top:12px"><tr><th>Recent Trade</th><th>Side</th><th>Price</th></tr>' +
        recentTrades.map(a => {
          const sideCls = a.side === 'BUY' ? 'side-buy' : 'side-sell';
          return '<tr><td class="truncate">' + esc(a.title) + '</td>' +
            '<td class="' + sideCls + '">' + a.side + '</td>' +
            '<td>$' + parseFloat(a.price).toFixed(2) + '</td></tr>';
        }).join('') + '</table>' : '') +
    '</div>';
  }).join('');
}

function renderTradeLog(log) {
  const el = document.getElementById('tradeLog');
  if (!log || log.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>No trades yet. The bot will log trades here when tracked traders make moves.</p></div>';
    return;
  }
  el.innerHTML = '<table><tr><th>Time</th><th>Trader</th><th>Market</th><th>Side</th><th>Price</th><th>Size</th><th>Action</th><th>Reason</th></tr>' +
    log.map(t => {
      const addr = t.traderAddress.slice(0, 6) + '...' + t.traderAddress.slice(-4);
      const sideCls = t.side === 'BUY' ? 'side-buy' : 'side-sell';
      const actionCls = 'action-' + t.action;
      return '<tr><td>' + new Date(t.timestamp).toLocaleTimeString() + '</td>' +
        '<td style="font-family:monospace;color:#818cf8">' + addr + '</td>' +
        '<td class="truncate" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.title) + '</td>' +
        '<td class="' + sideCls + '">' + t.side + '</td>' +
        '<td>$' + t.price.toFixed(2) + '</td>' +
        '<td>$' + t.size.toFixed(2) + '</td>' +
        '<td><span class="action-badge ' + actionCls + '">' + t.action + '</span></td>' +
        '<td style="color:#6b7280;font-size:12px">' + (t.reason || '-') + '</td></tr>';
    }).join('') + '</table>';
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

async function toggleBot() {
  const action = currentStatus === 'running' ? 'stop' : 'start';
  await fetch('/api/bot/' + action, { method: 'POST' });
}
</script>
</body>
</html>`;
}
