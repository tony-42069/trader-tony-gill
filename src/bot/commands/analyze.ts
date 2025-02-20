import TelegramBot from 'node-telegram-bot-api';
import { BotContext } from '../types';
import { TokenAnalyzer, getRiskLevel, TokenWarning } from '../../analysis';
import { PublicKey } from '@solana/web3.js';

export const createAnalyzeCommand = (bot: TelegramBot, context: BotContext) => ({
  command: '/analyze',
  description: 'Analyze a token',
  handler: async (msg: TelegramBot.Message, args: string[]) => {
    const chatId = msg.chat.id.toString();

    if (!args.length) {
      await bot.sendMessage(
        chatId,
        'Please provide a token address to analyze.\nUsage: /analyze <token_address>'
      );
      return;
    }

    const tokenAddress = args[0];

    try {
      // Validate token address
      new PublicKey(tokenAddress);

      await bot.sendMessage(chatId, '🔍 Analyzing token...');

      // Create analyzer instance
      const analyzer = context.tokenAnalyzer;

      // Run analysis with all options enabled
      const analysis = await analyzer.analyzeToken(tokenAddress, {
        includePrice: true,
        includeRisk: true,
        forceUpdate: true
      });

      // Format analysis results
      const riskLevel = getRiskLevel(analysis.risk.score);
      const riskEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
      }[riskLevel];

      const message = `
*Token Analysis Report* 📊

*Basic Information*
Name: \`${analysis.metadata.name}\`
Symbol: ${analysis.metadata.symbol}
Address: \`${analysis.metadata.address}\`
Decimals: ${analysis.metadata.decimals}
Total Supply: ${analysis.metadata.totalSupply.toString()}
Holders: ${analysis.metadata.holders}
Verified: ${analysis.metadata.isVerified ? '✅' : '❌'}

*Price Information*
Current Price: $${analysis.price.price.toFixed(6)}
24h Change: ${analysis.price.priceChange24h.toFixed(2)}%
24h Volume: $${analysis.price.volume24h.toLocaleString()}
Market Cap: $${analysis.price.marketCap.toLocaleString()}
Liquidity: ${analysis.price.liquidity.toFixed(2)} SOL

*Risk Assessment* ${riskEmoji}
Risk Score: ${analysis.risk.score}/100 (${riskLevel.toUpperCase()})
Buy Tax: ${analysis.risk.buyTax}%
Sell Tax: ${analysis.risk.sellTax}%
Honeypot Risk: ${analysis.risk.isHoneypot ? '⚠️ High' : '✅ Low'}
Ownership Renounced: ${analysis.risk.isRenounced ? '✅' : '❌'}

*Warnings*
${analysis.risk.warnings.length ? analysis.risk.warnings.map((w: TokenWarning) => 
  `⚠️ ${w.message}${w.details ? `\n   ${w.details}` : ''}`
).join('\n') : '✅ No warnings found'}

Last Updated: ${analysis.lastAnalyzed.toLocaleString()}
`;

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      context.logger.error('Token analysis failed:', error);
      await bot.sendMessage(
        chatId,
        `❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
});
