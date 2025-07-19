export interface TelegramChannel {
  id: string;
  channelName: string;
  channelId: string;
  isActive: boolean;
  createdAt: string;
}

export interface TradingSignal {
  id: string;
  channelId: string;
  symbol: 'BTC' | 'GOLD';
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  signalText: string;
  parsedAt: string;
  status: 'pending' | 'executed' | 'failed';
  // AI Validation
  confidenceScore?: number; // 0-100
  aiValidation?: AIValidation;
  // Risk Management
  stopLoss?: number;
  takeProfit?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIValidation {
  score: number; // 0-100
  factors: {
    technicalAnalysis: number;
    sentimentAnalysis: number;
    marketConditions: number;
    historicalPerformance: number;
  };
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  reasoning: string[];
  timeframe: string;
  validatedAt: string;
}

export interface PaperTrade {
  id: string;
  signalId: string;
  symbol: 'BTC' | 'GOLD';
  action: 'BUY' | 'SELL';
  entryPrice: number;
  quantity: number;
  currentPrice?: number;
  pnl: number;
  status: 'open' | 'closed';
  executedAt: string;
  closedAt?: string;
  // Risk Management
  stopLoss?: number;
  takeProfit?: number;
  maxDrawdown?: number;
  // Performance Metrics
  holdingPeriod?: number; // in minutes
  returnPercentage?: number;
}

export interface TradingAccount {
  id: string;
  accountName: string;
  accountType: 'paper' | 'live';
  balance: number;
  isActive: boolean;
  createdAt: string;
  // Risk Management
  maxDailyLoss?: number;
  maxPositionSize?: number;
  dailyLossUsed?: number;
  lastResetDate?: string;
}

export interface MarketPrice {
  symbol: 'BTC' | 'GOLD';
  price: number;
  change24h: number;
  lastUpdated: string;
  // Technical indicators
  rsi?: number;
  macd?: number;
  volume24h?: number;
  volatility?: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  averageHoldingPeriod: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  // Risk metrics
  valueAtRisk: number; // VaR 95%
  expectedShortfall: number;
  calmarRatio: number;
}

export interface RiskSettings {
  maxDailyLoss: number;
  maxPositionSize: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxOpenPositions: number;
  riskPerTrade: number; // percentage of account
  enableAutoStopLoss: boolean;
  enableAutoTakeProfit: boolean;
  enableDailyLossLimit: boolean;
}

export interface ChartData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface EquityCurve {
  timestamp: string;
  balance: number;
  drawdown: number;
  pnl: number;
}