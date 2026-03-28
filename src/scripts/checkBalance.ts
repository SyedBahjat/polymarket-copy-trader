import { ethers } from 'ethers';
import { ENV } from '../config/env';

const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

async function main() {
  console.log('\n=========================================');
  console.log('  Wallet Balance Check');
  console.log('=========================================\n');

  const provider = new ethers.providers.JsonRpcProvider(ENV.RPC_URL);
  const wallet = new ethers.Wallet(ENV.PRIVATE_KEY, provider);

  console.log(`  Wallet address: ${wallet.address}`);
  console.log(`  Proxy wallet:   ${ENV.PROXY_WALLET}`);

  // Check MATIC balance (for gas)
  const maticBalance = await provider.getBalance(wallet.address);
  console.log(`\n  MATIC balance:   ${ethers.utils.formatEther(maticBalance)} MATIC`);

  // Check USDC balance on both wallets
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

  const walletUSDC = await usdc.balanceOf(wallet.address);
  console.log(`  USDC (wallet):   $${ethers.utils.formatUnits(walletUSDC, 6)}`);

  const proxyUSDC = await usdc.balanceOf(ENV.PROXY_WALLET);
  console.log(`  USDC (proxy):    $${ethers.utils.formatUnits(proxyUSDC, 6)}`);

  const totalUSDC =
    parseFloat(ethers.utils.formatUnits(walletUSDC, 6)) +
    parseFloat(ethers.utils.formatUnits(proxyUSDC, 6));

  console.log(`\n  Total USDC:      $${totalUSDC.toFixed(2)}`);

  if (totalUSDC < ENV.COPY_AMOUNT_USD) {
    console.log(
      `\n  WARNING: Your USDC balance ($${totalUSDC.toFixed(2)}) is less than your copy amount ($${ENV.COPY_AMOUNT_USD}).`
    );
    console.log('  Deposit more USDC or reduce COPY_AMOUNT_USD in .env');
  }

  if (parseFloat(ethers.utils.formatEther(maticBalance)) < 0.01) {
    console.log('\n  WARNING: Low MATIC for gas fees. Deposit at least 0.1 MATIC.');
  }

  console.log('\n');
}

main().catch(console.error);
