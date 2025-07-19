import { PaperTrade, PerformanceMetrics, ChartData, EquityCurve } from '../types/trading';

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  calculatePerformanceMetrics(trades: PaperTrade[], initialBalance: number = 10000): PerformanceMetrics {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl < 0);

    const totalPnL = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    const averageWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length 
      : 0;

    const averageLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length)
      : 0;

    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

    // Calculate Sharpe Ratio (simplified)
    const returns = closedTrades.map(t => (t.pnl / initialBalance) * 100);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const returnStdDev = this.calculateStandardDeviation(returns);
    const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0; // Annualized

    // Calculate drawdown
    const { maxDrawdown, maxDrawdownPercent } = this.calculateMaxDrawdown(trades, initialBalance);

    // Calculate holding periods
    const holdingPeriods = closedTrades
      .filter(t => t.closedAt && t.executedAt)
      .map(t => {
        const start = new Date(t.executedAt).getTime();
        const end = new Date(t.closedAt!).getTime();
        return (end - start) / (1000 * 60); // minutes
      });

    const averageHoldingPeriod = holdingPeriods.length > 0 
      ? holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length 
      : 0;

    const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl)) : 0;
    const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl)) : 0;

    // Calculate consecutive wins/losses
    const { consecutiveWins, consecutiveLosses } = this.calculateConsecutiveResults(closedTrades);

    // Risk metrics
    const valueAtRisk = this.calculateVaR(returns, 0.05); // 95% VaR
    const expectedShortfall = this.calculateExpectedShortfall(returns, 0.05);
    const calmarRatio = maxDrawdownPercent > 0 ? (totalPnL / initialBalance * 100) / maxDrawdownPercent : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnL,
      averageWin,
      averageLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      maxDrawdownPercent,
      averageHoldingPeriod,
      bestTrade,
      worstTrade,
      consecutiveWins,
      consecutiveLosses,
      valueAtRisk,
      expectedShortfall,
      calmarRatio
    };
  }

  generateEquityCurve(trades: PaperTrade[], initialBalance: number = 10000): EquityCurve[] {
    const curve: EquityCurve[] = [];
    let runningBalance = initialBalance;
    let peak = initialBalance;

    // Add initial point
    curve.push({
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      balance: initialBalance,
      drawdown: 0,
      pnl: 0
    });

    // Sort trades by execution time
    const sortedTrades = [...trades]
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

    sortedTrades.forEach(trade => {
      runningBalance += trade.pnl;
      peak = Math.max(peak, runningBalance);
      const drawdown = peak - runningBalance;
      
      curve.push({
        timestamp: trade.closedAt || trade.executedAt,
        balance: runningBalance,
        drawdown,
        pnl: trade.pnl
      });
    });

    return curve;
  }

  generatePnLDistribution(trades: PaperTrade[]): ChartData[] {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const bins = 10;
    const pnls = closedTrades.map(t => t.pnl);
    
    if (pnls.length === 0) return [];

    const min = Math.min(...pnls);
    const max = Math.max(...pnls);
    const binSize = (max - min) / bins;

    const distribution: ChartData[] = [];
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const count = pnls.filter(pnl => pnl >= binStart && pnl < binEnd).length;
      
      distribution.push({
        timestamp: `${binStart.toFixed(0)} to ${binEnd.toFixed(0)}`,
        value: count,
        label: `$${binStart.toFixed(0)} - $${binEnd.toFixed(0)}`
      });
    }

    return distribution;
  }

  generateWinLossChart(trades: PaperTrade[]): ChartData[] {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const wins = closedTrades.filter(t => t.pnl > 0).length;
    const losses = closedTrades.filter(t => t.pnl < 0).length;
    const breakeven = closedTrades.filter(t => t.pnl === 0).length;

    return [
      { timestamp: 'Wins', value: wins, label: `${wins} Winning Trades` },
      { timestamp: 'Losses', value: losses, label: `${losses} Losing Trades` },
      { timestamp: 'Breakeven', value: breakeven, label: `${breakeven} Breakeven Trades` }
    ];
  }

  generateMonthlyReturns(trades: PaperTrade[]): ChartData[] {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const monthlyData = new Map<string, number>();

    closedTrades.forEach(trade => {
      const date = new Date(trade.closedAt || trade.executedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + trade.pnl);
    });

    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({
        timestamp: month,
        value: pnl,
        label: `${month}: $${pnl.toFixed(2)}`
      }));
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateMaxDrawdown(trades: PaperTrade[], initialBalance: number): { maxDrawdown: number; maxDrawdownPercent: number } {
    let peak = initialBalance;
    let maxDrawdown = 0;
    let runningBalance = initialBalance;

    const sortedTrades = [...trades]
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

    sortedTrades.forEach(trade => {
      runningBalance += trade.pnl;
      peak = Math.max(peak, runningBalance);
      const currentDrawdown = peak - runningBalance;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
    });

    const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

    return { maxDrawdown, maxDrawdownPercent };
  }

  private calculateConsecutiveResults(trades: PaperTrade[]): { consecutiveWins: number; consecutiveLosses: number } {
    if (trades.length === 0) return { consecutiveWins: 0, consecutiveLosses: 0 };

    const sortedTrades = [...trades]
      .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    sortedTrades.forEach(trade => {
      if (trade.pnl > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else if (trade.pnl < 0) {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      } else {
        currentWins = 0;
        currentLosses = 0;
      }
    });

    return { consecutiveWins: maxConsecutiveWins, consecutiveLosses: maxConsecutiveLosses };
  }

  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(returns.length * confidence);
    
    return sortedReturns[index] || 0;
  }

  private calculateExpectedShortfall(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoffIndex = Math.floor(returns.length * confidence);
    const tailReturns = sortedReturns.slice(0, cutoffIndex);
    
    if (tailReturns.length === 0) return 0;
    
    return tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;
  }

  // Calculate correlation between signals and market performance
  calculateSignalCorrelation(trades: PaperTrade[]): number {
    // Simplified correlation calculation
    // In a real implementation, this would correlate signal timing with market movements
    const closedTrades = trades.filter(t => t.status === 'closed');
    if (closedTrades.length < 2) return 0;

    const returns = closedTrades.map(t => t.returnPercentage || 0);
    const timeDelays = closedTrades.map((t, i) => i); // Simplified time series

    return this.calculateCorrelationCoefficient(returns, timeDelays);
  }

  // Advanced Performance Analytics
  calculateAdvancedMetrics(trades: PaperTrade[], initialBalance: number = 10000): {
    ulcerIndex: number;
    sortinoRatio: number;
    informationRatio: number;
    treynorRatio: number;
    maxConsecutiveLosses: number;
    averageTimeToProfit: number;
    profitabilityIndex: number;
    recoveryFactor: number;
    payoffRatio: number;
    expectancy: number;
  } {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl < 0);

    // Ulcer Index (downside risk measure)
    const ulcerIndex = this.calculateUlcerIndex(trades, initialBalance);

    // Sortino Ratio (risk-adjusted return using downside deviation)
    const sortinoRatio = this.calculateSortinoRatio(closedTrades, initialBalance);

    // Information Ratio (excess return per unit of tracking error)
    const informationRatio = this.calculateInformationRatio(closedTrades);

    // Treynor Ratio (return per unit of systematic risk)
    const treynorRatio = this.calculateTreynorRatio(closedTrades, initialBalance);

    // Maximum consecutive losses
    const maxConsecutiveLosses = this.calculateMaxConsecutiveLosses(closedTrades);

    // Average time to profit
    const averageTimeToProfit = this.calculateAverageTimeToProfit(winningTrades);

    // Profitability Index
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitabilityIndex = totalLosses > 0 ? totalWins / totalLosses : 0;

    // Recovery Factor
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const { maxDrawdown } = this.calculateMaxDrawdown(trades, initialBalance);
    const recoveryFactor = maxDrawdown > 0 ? totalPnL / maxDrawdown : 0;

    // Payoff Ratio
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Expectancy
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    return {
      ulcerIndex,
      sortinoRatio,
      informationRatio,
      treynorRatio,
      maxConsecutiveLosses,
      averageTimeToProfit,
      profitabilityIndex,
      recoveryFactor,
      payoffRatio,
      expectancy
    };
  }

  // Multi-timeframe analysis
  generateTimeframeAnalysis(trades: PaperTrade[]): {
    hourly: { winRate: number; avgReturn: number; count: number };
    daily: { winRate: number; avgReturn: number; count: number };
    weekly: { winRate: number; avgReturn: number; count: number };
  } {
    const closedTrades = trades.filter(t => t.status === 'closed');
    
    const hourlyTrades = closedTrades.filter(t => (t.holdingPeriod || 0) <= 60);
    const dailyTrades = closedTrades.filter(t => (t.holdingPeriod || 0) > 60 && (t.holdingPeriod || 0) <= 1440);
    const weeklyTrades = closedTrades.filter(t => (t.holdingPeriod || 0) > 1440);

    return {
      hourly: this.calculateTimeframeMetrics(hourlyTrades),
      daily: this.calculateTimeframeMetrics(dailyTrades),
      weekly: this.calculateTimeframeMetrics(weeklyTrades)
    };
  }

  private calculateTimeframeMetrics(trades: PaperTrade[]): { winRate: number; avgReturn: number; count: number } {
    if (trades.length === 0) return { winRate: 0, avgReturn: 0, count: 0 };

    const winningTrades = trades.filter(t => t.pnl > 0);
    const winRate = (winningTrades.length / trades.length) * 100;
    const avgReturn = trades.reduce((sum, t) => sum + (t.returnPercentage || 0), 0) / trades.length;

    return { winRate, avgReturn, count: trades.length };
  }

  private calculateUlcerIndex(trades: PaperTrade[], initialBalance: number): number {
    const equityCurve = this.generateEquityCurve(trades, initialBalance);
    if (equityCurve.length < 2) return 0;

    let peak = initialBalance;
    let sumSquaredDrawdowns = 0;

    equityCurve.forEach(point => {
      peak = Math.max(peak, point.balance);
      const drawdownPercent = ((peak - point.balance) / peak) * 100;
      sumSquaredDrawdowns += Math.pow(drawdownPercent, 2);
    });

    return Math.sqrt(sumSquaredDrawdowns / equityCurve.length);
  }

  private calculateSortinoRatio(trades: PaperTrade[], initialBalance: number): number {
    if (trades.length === 0) return 0;

    const returns = trades.map(t => (t.pnl / initialBalance) * 100);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    const negativeReturns = returns.filter(r => r < 0);
    if (negativeReturns.length === 0) return avgReturn > 0 ? 10 : 0;

    const downsideDeviation = Math.sqrt(
      negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    );

    return downsideDeviation > 0 ? (avgReturn / downsideDeviation) * Math.sqrt(252) : 0;
  }

  private calculateInformationRatio(trades: PaperTrade[]): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.returnPercentage || 0);
    const benchmarkReturn = 0; // Assuming 0% benchmark
    const excessReturns = returns.map(r => r - benchmarkReturn);
    
    const avgExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
    const trackingError = this.calculateStandardDeviation(excessReturns);

    return trackingError > 0 ? avgExcessReturn / trackingError : 0;
  }

  private calculateTreynorRatio(trades: PaperTrade[], initialBalance: number): number {
    if (trades.length === 0) return 0;

    const totalReturn = trades.reduce((sum, t) => sum + t.pnl, 0);
    const annualizedReturn = (totalReturn / initialBalance) * 100;
    const beta = 1; // Simplified beta assumption

    return beta > 0 ? annualizedReturn / beta : 0;
  }

  private calculateMaxConsecutiveLosses(trades: PaperTrade[]): number {
    if (trades.length === 0) return 0;

    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
    );

    let maxConsecutive = 0;
    let currentConsecutive = 0;

    sortedTrades.forEach(trade => {
      if (trade.pnl < 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    return maxConsecutive;
  }

  private calculateAverageTimeToProfit(winningTrades: PaperTrade[]): number {
    if (winningTrades.length === 0) return 0;

    const times = winningTrades
      .filter(t => t.holdingPeriod !== undefined)
      .map(t => t.holdingPeriod!);

    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  private calculateCorrelationCoefficient(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}