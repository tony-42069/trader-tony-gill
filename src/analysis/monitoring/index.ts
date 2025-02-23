import { TokenAnalyzer } from '../types';
import { AlertHandler, MonitoringConfig, TokenMonitor } from './types';
import { TokenMonitorImpl } from './monitor';

export * from './types';

export const createTokenMonitor = (
  analyzer: TokenAnalyzer,
  alertHandler: AlertHandler,
  config: MonitoringConfig
): TokenMonitor => {
  return new TokenMonitorImpl(analyzer, alertHandler, config);
}; 