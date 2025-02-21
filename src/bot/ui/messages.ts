import { WelcomeMessageData, SniperStatusData } from './types';

export const getWelcomeMessage = (data: WelcomeMessageData): string => `
Welcome to TraderTony - Expert Solana Trading Bot! 🚀

🎯 *SNIPERTONY - Advanced Precision Trading*
• MEV-protected transactions for optimal execution
• Custom gas optimization for faster confirmations
• Smart contract analysis & risk detection
• Auto Take-Profit/Stop-Loss management

⚡ *Ultra-Fast Execution Suite*
• Lightning-quick token sniping
• Anti-rug protection system
• Slippage control & front-run defense
• Multi-DEX liquidity monitoring

💼 *Professional Trading Features*
• Real-time price impact analysis
• Advanced charting integration
• Holder distribution tracking
• Volume & liquidity alerts

🔒 *Enterprise-Grade Security*
• Secure wallet integration
• Transaction signing verification
• Anti-MEV transaction routing
• Real-time risk assessment

*Your TraderTony wallet address:*
\`${data.walletAddress}\` (tap to copy)

💳 Buy SOL with Apple/Google Pay via MoonPay here.
📊 View tokens on: [GMGN](https://gmgn.ai/meme/STNfNik9?chain=sol) | [BullX](https://bullx.io/) | [DEX Screener](https://dexscreener.com/) | [Photon](https://photon-sol.tinyastro.io/en/discover)

*Balance:* ${data.balance} SOL
*Active Orders:* ${data.orderCount}
*Security Status:* ${data.securityStatus}`;

export const getSniperTonyWelcome = (data: SniperStatusData): string => `
🎯 *SNIPERTONY Command Center*

Status: ${data.status}
Active Snipes: ${data.snipeCount}
Success Rate: ${data.successRate}%
Protection: ${data.protectionStatus}

Select your sniping strategy:`;

export const getTokenAnalysisMessage = (tokenAddress: string): string => `
*Analyzing token:* \`${tokenAddress}\`

Please wait while I check:
📊 Price & Volume
💰 Liquidity Depth
🔒 Contract Security
👥 Holder Distribution
⚠️ Risk Assessment`;

export const getSnipeConfirmationMessage = (
  tokenAddress: string,
  amount: number,
  slippage: number
): string => `
🎯 *Snipe Configuration*

Token: \`${tokenAddress}\`
Amount: ${amount} SOL
Max Slippage: ${slippage}%

*Protection Features:*
✅ MEV Protection
✅ Slippage Guard
✅ Front-run Defense
✅ Auto Gas Adjustment

Ready to execute?`;

export const getMonitoringSetupMessage = (
  tokenAddress: string,
  priceAlert: number,
  volumeAlert: number
): string => `
📊 *Monitoring Configuration*

Token: \`${tokenAddress}\`
Price Alert: ${priceAlert}%
Volume Alert: ${volumeAlert}%

You will receive alerts when:
• Price changes exceed threshold
• Volume spikes detected
• Significant liquidity changes
• Sniper opportunities found`;

export const getErrorMessage = (error: string): string => `
⚠️ *Error Occurred*

${error}

Please try again or contact support if the issue persists.`;

export const getSuccessMessage = (message: string): string => `
✅ *Success!*

${message}`;
