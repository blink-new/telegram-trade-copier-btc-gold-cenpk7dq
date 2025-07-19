import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  Shield,
  Brain,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import { PaperTrade, PerformanceMetrics, ChartData, EquityCurve } from '../types/trading';
import { AnalyticsService } from '../services/analyticsService';
import { PaperTradingService } from '../services/paperTradingService';

export function AdvancedAnalytics() {
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityCurve[]>([]);
  const [pnlDistribution, setPnlDistribution] = useState<ChartData[]>([]);
  const [winLossData, setWinLossData] = useState<ChartData[]>([]);
  const [monthlyReturns, setMonthlyReturns] = useState<ChartData[]>([]);

  const analyticsService = AnalyticsService.getInstance();
  const paperTradingService = PaperTradingService.getInstance();

  const updateAnalytics = useCallback(() => {
    const allTrades = paperTradingService.getTrades();
    const account = paperTradingService.getAccount();
    
    setTrades(allTrades);
    
    const performanceMetrics = analyticsService.calculatePerformanceMetrics(allTrades, account.balance);
    setMetrics(performanceMetrics);
    
    const equity = analyticsService.generateEquityCurve(allTrades, 10000);
    setEquityCurve(equity);
    
    const distribution = analyticsService.generatePnLDistribution(allTrades);
    setPnlDistribution(distribution);
    
    const winLoss = analyticsService.generateWinLossChart(allTrades);
    setWinLossData(winLoss);
    
    const monthly = analyticsService.generateMonthlyReturns(allTrades);
    setMonthlyReturns(monthly);
  }, [analyticsService, paperTradingService]);

  useEffect(() => {
    updateAnalytics();
    
    const interval = setInterval(updateAnalytics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [updateAnalytics]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getMetricColor = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value > 0 ? 'text-green-400' : 'text-red-400';
    } else {
      return value < 0 ? 'text-green-400' : 'text-red-400';
    }
  };

  const getRiskLevel = (sharpe: number) => {
    if (sharpe > 1.5) return { level: 'LOW', color: 'text-green-400' };
    if (sharpe > 0.5) return { level: 'MEDIUM', color: 'text-yellow-400' };
    return { level: 'HIGH', color: 'text-red-400' };
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Sharpe Ratio</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {metrics.sharpeRatio.toFixed(2)}
            </p>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className={`${getRiskLevel(metrics.sharpeRatio).color} bg-gray-800`}>
                {getRiskLevel(metrics.sharpeRatio).level} RISK
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-400">Max Drawdown</span>
            </div>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {formatCurrency(metrics.maxDrawdown)}
            </p>
            <p className="text-sm text-gray-400">
              {formatPercentage(metrics.maxDrawdownPercent)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Profit Factor</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {metrics.profitFactor.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400">
              {metrics.profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Value at Risk</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {formatPercentage(metrics.valueAtRisk)}
            </p>
            <p className="text-sm text-gray-400">95% confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="performance" className="data-[state=active]:bg-orange-600">
            Performance
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-orange-600">
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="distribution" className="data-[state=active]:bg-orange-600">
            Distribution
          </TabsTrigger>
          <TabsTrigger value="equity" className="data-[state=active]:bg-orange-600">
            Equity Curve
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Performance Metrics */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Trades</p>
                    <p className="text-lg font-bold text-white">{metrics.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-lg font-bold text-white">{formatPercentage(metrics.winRate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Average Win</p>
                    <p className={`text-lg font-bold ${getMetricColor(metrics.averageWin)}`}>
                      {formatCurrency(metrics.averageWin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Average Loss</p>
                    <p className="text-lg font-bold text-red-400">
                      {formatCurrency(metrics.averageLoss)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Best Trade</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatCurrency(metrics.bestTrade)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Worst Trade</p>
                    <p className="text-lg font-bold text-red-400">
                      {formatCurrency(metrics.worstTrade)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Win/Loss Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Win/Loss Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {winLossData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.timestamp === 'Wins' ? 'bg-green-400' :
                          item.timestamp === 'Losses' ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-300">{item.timestamp}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{item.value}</p>
                        <p className="text-xs text-gray-400">
                          {((item.value / metrics.totalTrades) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consecutive Results */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Consecutive Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Consecutive Wins</span>
                    <span className="text-lg font-bold text-green-400">{metrics.consecutiveWins}</span>
                  </div>
                  <Progress 
                    value={(metrics.consecutiveWins / Math.max(metrics.consecutiveWins, metrics.consecutiveLosses, 1)) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Consecutive Losses</span>
                    <span className="text-lg font-bold text-red-400">{metrics.consecutiveLosses}</span>
                  </div>
                  <Progress 
                    value={(metrics.consecutiveLosses / Math.max(metrics.consecutiveWins, metrics.consecutiveLosses, 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Metrics */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Risk Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Sharpe Ratio</span>
                    <span className="text-lg font-bold text-white">{metrics.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Calmar Ratio</span>
                    <span className="text-lg font-bold text-white">{metrics.calmarRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Value at Risk (95%)</span>
                    <span className="text-lg font-bold text-yellow-400">{formatPercentage(metrics.valueAtRisk)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Expected Shortfall</span>
                    <span className="text-lg font-bold text-red-400">{formatPercentage(metrics.expectedShortfall)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Drawdown Analysis */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5" />
                  <span>Drawdown Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Max Drawdown ($)</span>
                    <span className="text-lg font-bold text-red-400">{formatCurrency(metrics.maxDrawdown)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Max Drawdown (%)</span>
                    <span className="text-lg font-bold text-red-400">{formatPercentage(metrics.maxDrawdownPercent)}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-gray-400">Drawdown Severity</span>
                    <Progress 
                      value={Math.min(metrics.maxDrawdownPercent, 50)} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500">
                      {metrics.maxDrawdownPercent < 5 ? 'Low' : 
                       metrics.maxDrawdownPercent < 15 ? 'Moderate' : 'High'} Risk
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>P&L Distribution</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Distribution of profit and loss across all trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {pnlDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-sm text-gray-300">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${(item.value / Math.max(...pnlDistribution.map(d => d.value))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-8">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equity" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <LineChart className="h-5 w-5" />
                <span>Equity Curve</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Account balance progression over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simplified equity curve visualization */}
                <div className="h-48 bg-gray-800 rounded-lg p-4 flex items-end space-x-1">
                  {equityCurve.slice(-20).map((point, index) => {
                    const height = Math.max(10, (point.balance / 12000) * 100); // Scale to fit
                    return (
                      <div
                        key={index}
                        className="bg-orange-500 rounded-t flex-1 min-w-0"
                        style={{ height: `${height}%` }}
                        title={`${new Date(point.timestamp).toLocaleDateString()}: ${formatCurrency(point.balance)}`}
                      />
                    );
                  })}
                </div>
                
                {/* Equity curve stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-400">Starting Balance</p>
                    <p className="text-lg font-bold text-white">$10,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Balance</p>
                    <p className={`text-lg font-bold ${getMetricColor(metrics.totalPnL)}`}>
                      {formatCurrency(10000 + metrics.totalPnL)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Return</p>
                    <p className={`text-lg font-bold ${getMetricColor(metrics.totalPnL)}`}>
                      {formatPercentage((metrics.totalPnL / 10000) * 100)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}