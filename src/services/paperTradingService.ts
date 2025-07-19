import { PaperTrade, TradingSignal, TradingAccount, MarketPrice } from '../types/trading';
import { RiskManagementService } from './riskManagementService';

export class PaperTradingService {
  private static instance: PaperTradingService;
  private trades: PaperTrade[] = [];
  private account: TradingAccount = {
    id: 'paper_default',
    accountName: 'Paper Trading Account',
    accountType: 'paper',
    balance: 10000,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  // Mock market prices
  private marketPrices: MarketPrice[] = [
    {
      symbol: 'BTC',
      price: 45000,
      change24h: 2.5,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'GOLD',
      price: 2000,
      change24h: -0.8,
      lastUpdated: new Date().toISOString()
    }
  ];

  static getInstance(): PaperTradingService {
    if (!PaperTradingService.instance) {
      PaperTradingService.instance = new PaperTradingService();
    }
    return PaperTradingService.instance;
  }

  async executeSignal(signal: TradingSignal): Promise<PaperTrade> {
    const riskManagementService = RiskManagementService.getInstance();
    const openTrades = this.getOpenTrades();
    
    // Validate signal execution with risk management
    const riskValidation = riskManagementService.validateSignalExecution(signal, this.account, openTrades);
    
    if (!riskValidation.canExecute) {
      throw new Error(riskValidation.reason || 'Risk management validation failed');
    }

    // Use adjusted quantity if provided by risk management
    const adjustedQuantity = riskValidation.adjustedQuantity || signal.quantity;
    
    // Log position size adjustment if it occurred
    if (riskValidation.adjustedQuantity && riskValidation.adjustedQuantity !== signal.quantity) {
      console.log(`Position size adjusted: ${signal.quantity} → ${adjustedQuantity} (${riskValidation.reason})`);
    }
    const currentPrice = this.getCurrentPrice(signal.symbol);
    const tradeValue = signal.price * adjustedQuantity;

    // Check if we have enough balance for BUY orders
    if (signal.action === 'BUY' && this.account.balance < tradeValue) {
      throw new Error('Insufficient balance for trade');
    }

    // Calculate stop loss and take profit levels
    const riskLevels = riskManagementService.calculateRiskLevels(signal);

    const trade: PaperTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signalId: signal.id,
      symbol: signal.symbol,
      action: signal.action,
      entryPrice: signal.price,
      quantity: adjustedQuantity,
      currentPrice,
      pnl: 0,
      status: 'open',
      executedAt: new Date().toISOString(),
      stopLoss: riskLevels.stopLoss,
      takeProfit: riskLevels.takeProfit,
      maxDrawdown: 0,
      holdingPeriod: 0,
      returnPercentage: 0
    };

    // Update account balance
    if (signal.action === 'BUY') {
      this.account.balance -= tradeValue;
    } else {
      this.account.balance += tradeValue;
    }

    this.trades.push(trade);
    this.updateTradePnL(trade);

    return trade;
  }

  async closeTrade(tradeId: string): Promise<PaperTrade> {
    const trade = this.trades.find(t => t.id === tradeId);
    if (!trade || trade.status === 'closed') {
      throw new Error('Trade not found or already closed');
    }

    const currentPrice = this.getCurrentPrice(trade.symbol);
    const closeValue = currentPrice * trade.quantity;

    // Update account balance based on closing the position
    if (trade.action === 'BUY') {
      this.account.balance += closeValue;
    } else {
      this.account.balance -= closeValue;
    }

    trade.status = 'closed';
    trade.closedAt = new Date().toISOString();
    trade.currentPrice = currentPrice;
    this.updateTradePnL(trade);

    return trade;
  }

  private updateTradePnL(trade: PaperTrade): void {
    if (!trade.currentPrice) return;

    if (trade.action === 'BUY') {
      trade.pnl = (trade.currentPrice - trade.entryPrice) * trade.quantity;
    } else {
      trade.pnl = (trade.entryPrice - trade.currentPrice) * trade.quantity;
    }
  }

  getCurrentPrice(symbol: 'BTC' | 'GOLD'): number {
    const marketPrice = this.marketPrices.find(p => p.symbol === symbol);
    if (!marketPrice) return 0;

    // Simulate price fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
    return marketPrice.price * (1 + fluctuation);
  }

  updateMarketPrices(): void {
    const riskManagementService = RiskManagementService.getInstance();
    
    this.marketPrices.forEach(price => {
      const fluctuation = (Math.random() - 0.5) * 0.01; // ±0.5% fluctuation
      price.price *= (1 + fluctuation);
      price.lastUpdated = new Date().toISOString();
      
      // Add technical indicators (simulated)
      price.rsi = 30 + Math.random() * 40; // RSI between 30-70
      price.volatility = 0.02 + Math.random() * 0.03; // 2-5% volatility
      price.volume24h = 1000000 + Math.random() * 5000000;
    });

    // Update PnL for open trades and check stop loss/take profit
    this.trades
      .filter(trade => trade.status === 'open')
      .forEach(trade => {
        const newPrice = this.getCurrentPrice(trade.symbol);
        trade.currentPrice = newPrice;
        this.updateTradePnL(trade);
        
        // Update holding period
        const executedTime = new Date(trade.executedAt).getTime();
        trade.holdingPeriod = (Date.now() - executedTime) / (1000 * 60); // minutes
        
        // Update return percentage
        trade.returnPercentage = (trade.pnl / (trade.entryPrice * trade.quantity)) * 100;
        
        // Check stop loss and take profit
        const stopLossCheck = riskManagementService.checkStopLossAndTakeProfit(trade, newPrice);
        if (stopLossCheck.shouldClose) {
          try {
            this.closeTrade(trade.id);
            console.log(`Trade ${trade.id} closed: ${stopLossCheck.reason}`);
          } catch (error) {
            console.error(`Error auto-closing trade ${trade.id}:`, error);
          }
        }
      });
  }

  getTrades(): PaperTrade[] {
    return [...this.trades];
  }

  getOpenTrades(): PaperTrade[] {
    return this.trades.filter(trade => trade.status === 'open');
  }

  getClosedTrades(): PaperTrade[] {
    return this.trades.filter(trade => trade.status === 'closed');
  }

  getAccount(): TradingAccount {
    return { ...this.account };
  }

  getMarketPrices(): MarketPrice[] {
    return [...this.marketPrices];
  }

  getTotalPnL(): number {
    return this.trades.reduce((total, trade) => total + trade.pnl, 0);
  }

  getWinRate(): number {
    const closedTrades = this.getClosedTrades();
    if (closedTrades.length === 0) return 0;
    
    const winningTrades = closedTrades.filter(trade => trade.pnl > 0);
    return (winningTrades.length / closedTrades.length) * 100;
  }

  // Simulate some demo trades for testing
  generateDemoTrades(): void {
    const riskManagementService = RiskManagementService.getInstance();
    const riskSettings = riskManagementService.getRiskSettings();
    const maxPositionValue = Math.min(
      riskSettings.maxPositionSize,
      this.account.balance * (riskSettings.riskPerTrade / 100)
    );

    // Calculate safe quantities that fit within risk limits
    const btcPrice = 44500;
    const goldPrice = 2010;
    const safeBtcQuantity = Math.floor((maxPositionValue * 0.6) / btcPrice * 10000) / 10000; // 60% of max, rounded to 4 decimals
    const safeGoldQuantity = Math.floor((maxPositionValue * 0.6) / goldPrice * 100) / 100; // 60% of max, rounded to 2 decimals

    console.log(`Demo trades: Max position value: ${maxPositionValue.toFixed(2)}`);
    console.log(`BTC quantity: ${safeBtcQuantity} (value: ${(safeBtcQuantity * btcPrice).toFixed(2)})`);
    console.log(`Gold quantity: ${safeGoldQuantity} (value: ${(safeGoldQuantity * goldPrice).toFixed(2)})`);

    const demoSignals: TradingSignal[] = [
      {
        id: 'demo_1',
        channelId: 'demo_channel',
        symbol: 'BTC',
        action: 'BUY',
        price: btcPrice,
        quantity: safeBtcQuantity,
        signalText: `BUY BTC @ ${btcPrice.toLocaleString()}`,
        parsedAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'executed'
      },
      {
        id: 'demo_2',
        channelId: 'demo_channel',
        symbol: 'GOLD',
        action: 'SELL',
        price: goldPrice,
        quantity: safeGoldQuantity,
        signalText: `SELL GOLD @ ${goldPrice.toLocaleString()}`,
        parsedAt: new Date(Date.now() - 1800000).toISOString(),
        status: 'executed'
      }
    ];

    demoSignals.forEach(signal => {
      try {
        this.executeSignal(signal);
      } catch (error) {
        console.error('Error executing demo signal:', error);
      }
    });
  }
}