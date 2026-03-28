import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function timestamp(): string {
  return new Date().toISOString();
}

function writeToFile(level: string, message: string) {
  ensureLogDir();
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOG_DIR, `bot-${date}.log`);
  const line = `[${timestamp()}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, line);
}

const Logger = {
  info(msg: string) {
    const formatted = `[${timestamp()}] INFO  ${msg}`;
    console.log(formatted);
    writeToFile('INFO', msg);
  },
  warn(msg: string) {
    const formatted = `[${timestamp()}] WARN  ${msg}`;
    console.warn(formatted);
    writeToFile('WARN', msg);
  },
  error(msg: string) {
    const formatted = `[${timestamp()}] ERROR ${msg}`;
    console.error(formatted);
    writeToFile('ERROR', msg);
  },
  trade(msg: string) {
    const formatted = `[${timestamp()}] TRADE ${msg}`;
    console.log(`\x1b[32m${formatted}\x1b[0m`);
    writeToFile('TRADE', msg);
  },
};

export default Logger;
