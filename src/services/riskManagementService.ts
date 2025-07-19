import { TradingSignal, PaperTrade, TradingAccount, RiskSettings } from '../types/trading';

export class RiskManagementService {
  private static instance: RiskManagementService;
  private riskSettings: RiskSettings = {
    maxDailyLoss: 2000, // $2000 max daily loss
    maxPositionSize: 5000, // $5000 max position size (50% of account)
    stopLossPercentage: 2, // 2% stop loss
    takeProfitPercentage: 4, // 4% take profit
    maxOpenPositions: 5,
    riskPerTrade: 25, // 25% of account per trade (more reasonable for paper trading)
    enableAutoStopLoss: true,
    enableAutoTakeProfit: true,
    enableDailyLossLimit: true
  };

  static getInstance(): RiskManagementService {
    if (!RiskManagementService.instance) {
      RiskManagementService.instance = new RiskManagementService();
    }
    return RiskManagementService.instance;
  }

  // Validate if a signal can be executed based on risk rules
  validateSignalExecution(
    signal: TradingSignal, 
    account: TradingAccount, 
    openTrades: PaperTrade[]
  ): { canExecute: boolean; reason?: string; adjustedQuantity?: number } {
    // Check daily loss limit
    if (this.riskSettings.enableDailyLossLimit) {
      const dailyLossCheck = this.checkDailyLossLimit(account);
      if (!dailyLossCheck.canTrade) {
        return { canExecute: false, reason: dailyLossCheck.reason };
      }
    }

    // Check maximum open positions
    if (openTrades.length >= this.riskSettings.maxOpenPositions) {
      return { 
        canExecute: false, 
        reason: `Maximum open positions reached (${this.riskSettings.maxOpenPositions})` 
      };
    }

    // Check position size limits
    const positionValue = signal.price * signal.quantity;
    const maxPositionValue = Math.min(
      this.riskSettings.maxPositionSize,
      account.balance * (this.riskSettings.riskPerTrade / 100)
    );

    if (positionValue > maxPositionValue) {
      const adjustedQuantity = Math.floor(maxPositionValue / signal.price * 100) / 100;
      
      if (adjustedQuantity <= 0) {
        return { 
          canExecute: false, 
          reason: `Position size too large. Max allowed: $${maxPositionValue.toFixed(2)}` 
        };
      }

      return { 
        canExecute: true, 
        adjustedQuantity,
        reason: `Position size adjusted from ${signal.quantity} to ${adjustedQuantity} to comply with risk limits`
      };
    }

    // Check account balance for BUY orders
    if (signal.action === 'BUY' && positionValue > account.balance) {
      return { 
        canExecute: false, 
        reason: `Insufficient balance. Required: $${positionValue.toFixed(2)}, Available: $${account.balance.toFixed(2)}` 
      };
    }

    return { canExecute: true };
  }

  // Calculate stop loss and take profit levels
  calculateRiskLevels(signal: TradingSignal): { stopLoss: number; takeProfit: number } {
    const stopLossMultiplier = this.riskSettings.stopLossPercentage / 100;
    const takeProfitMultiplier = this.riskSettings.takeProfitPercentage / 100;

    let stopLoss: number;
    let takeProfit: number;

    if (signal.action === 'BUY') {
      stopLoss = signal.price * (1 - stopLossMultiplier);
      takeProfit = signal.price * (1 + takeProfitMultiplier);
    } else {
      stopLoss = signal.price * (1 + stopLossMultiplier);
      takeProfit = signal.price * (1 - takeProfitMultiplier);
    }

    return { stopLoss, takeProfit };
  }

  // Check if stop loss or take profit should be triggered
  checkStopLossAndTakeProfit(
    trade: PaperTrade, 
    currentPrice: number
  ): { shouldClose: boolean; reason?: string } {
    if (!trade.stopLoss && !trade.takeProfit) {
      return { shouldClose: false };
    }

    if (trade.action === 'BUY') {
      // For BUY positions: close if price drops below stop loss or rises above take profit
      if (trade.stopLoss && currentPrice <= trade.stopLoss) {
        return { shouldClose: true, reason: `Stop loss triggered at $${currentPrice.toFixed(2)}` };
      }
      if (trade.takeProfit && currentPrice >= trade.takeProfit) {
        return { shouldClose: true, reason: `Take profit triggered at $${currentPrice.toFixed(2)}` };
      }
    } else {
      // For SELL positions: close if price rises above stop loss or drops below take profit
      if (trade.stopLoss && currentPrice >= trade.stopLoss) {
        return { shouldClose: true, reason: `Stop loss triggered at $${currentPrice.toFixed(2)}` };
      }
      if (trade.takeProfit && currentPrice <= trade.takeProfit) {
        return { shouldClose: true, reason: `Take profit triggered at $${currentPrice.toFixed(2)}` };
      }
    }

    return { shouldClose: false };
  }

  // Calculate position size based on risk percentage
  calculateOptimalPositionSize(
    signal: TradingSignal, 
    account: TradingAccount
  ): number {
    const riskAmount = account.balance * (this.riskSettings.riskPerTrade / 100);
    const stopLossDistance = Math.abs(signal.price - this.calculateRiskLevels(signal).stopLoss);
    
    if (stopLossDistance === 0) return 0;
    
    const optimalQuantity = riskAmount / stopLossDistance;
    const maxQuantityByBalance = this.riskSettings.maxPositionSize / signal.price;
    
    return Math.min(optimalQuantity, maxQuantityByBalance, signal.quantity);
  }

  // Check daily loss limit
  private checkDailyLossLimit(account: TradingAccount): { canTrade: boolean; reason?: string } {
    const today = new Date().toDateString();
    const lastResetDate = account.lastResetDate ? new Date(account.lastResetDate).toDateString() : '';
    
    // Reset daily loss if it's a new day
    if (today !== lastResetDate) {
      account.dailyLossUsed = 0;
      account.lastResetDate = new Date().toISOString();
    }

    const dailyLossUsed = account.dailyLossUsed || 0;
    const maxDailyLoss = account.maxDailyLoss || this.riskSettings.maxDailyLoss;

    if (dailyLossUsed >= maxDailyLoss) {
      return { 
        canTrade: false, 
        reason: `Daily loss limit reached ($${dailyLossUsed.toFixed(2)} / $${maxDailyLoss.toFixed(2)})` 
      };
    }

    return { canTrade: true };
  }

  // Update daily loss tracking
  updateDailyLoss(account: TradingAccount, lossAmount: number): void {
    if (lossAmount > 0) return; // Only track losses

    const today = new Date().toDateString();
    const lastResetDate = account.lastResetDate ? new Date(account.lastResetDate).toDateString() : '';
    
    // Reset if new day
    if (today !== lastResetDate) {
      account.dailyLossUsed = 0;
      account.lastResetDate = new Date().toISOString();
    }

    account.dailyLossUsed = (account.dailyLossUsed || 0) + Math.abs(lossAmount);
  }

  // Calculate maximum drawdown for a trade
  calculateTradeDrawdown(trade: PaperTrade, priceHistory: number[]): number {
    if (!trade.currentPrice || priceHistory.length === 0) return 0;

    let maxDrawdown = 0;
    let peak = trade.entryPrice;

    priceHistory.forEach(price => {
      if (trade.action === 'BUY') {
        peak = Math.max(peak, price);
        const drawdown = peak - price;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      } else {
        peak = Math.min(peak, price);
        const drawdown = price - peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    });

    return maxDrawdown;
  }

  // Risk assessment for a signal
  assessSignalRisk(signal: TradingSignal, marketVolatility: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // Market volatility factor
    if (marketVolatility > 0.05) riskScore += 2; // High volatility
    else if (marketVolatility > 0.03) riskScore += 1; // Medium volatility

    // Position size factor
    const positionValue = signal.price * signal.quantity;
    if (positionValue > 1000) riskScore += 2;
    else if (positionValue > 500) riskScore += 1;

    // Time factor (weekend/after hours trading is riskier)
    const hour = new Date().getHours();
    const day = new Date().getDay();
    if (day === 0 || day === 6) riskScore += 1; // Weekend
    if (hour < 6 || hour > 20) riskScore += 1; // After hours

    // Symbol-specific risk
    if (signal.symbol === 'BTC') riskScore += 1; // Crypto is generally more volatile

    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  // Get current risk settings
  getRiskSettings(): RiskSettings {
    return { ...this.riskSettings };
  }

  // Update risk settings
  updateRiskSettings(newSettings: Partial<RiskSettings>): void {
    this.riskSettings = { ...this.riskSettings, ...newSettings };
  }

  // Calculate Kelly Criterion for optimal position sizing
  calculateKellyCriterion(winRate: number, averageWin: number, averageLoss: number): number {
    if (averageLoss === 0 || winRate === 0) return 0;
    
    const winProbability = winRate / 100;
    const lossProbability = 1 - winProbability;
    const winLossRatio = averageWin / averageLoss;
    
    const kellyPercentage = winProbability - (lossProbability / winLossRatio);
    
    // Cap at 25% for safety
    return Math.max(0, Math.min(0.25, kellyPercentage));
  }

  // Portfolio heat calculation (total risk exposure)
  calculatePortfolioHeat(openTrades: PaperTrade[], accountBalance: number): number {
    const totalRiskAmount = openTrades.reduce((total, trade) => {
      const positionValue = trade.entryPrice * trade.quantity;
      const riskPercentage = this.riskSettings.stopLossPercentage / 100;
      return total + (positionValue * riskPercentage);
    }, 0);

    return (totalRiskAmount / accountBalance) * 100;
  }
}