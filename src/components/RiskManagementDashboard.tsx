import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Settings,
  Target,
  DollarSign,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { PaperTrade, TradingAccount, RiskSettings } from '../types/trading';
import { RiskManagementService } from '../services/riskManagementService';
import { PaperTradingService } from '../services/paperTradingService';

export function RiskManagementDashboard() {
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
  const [account, setAccount] = useState<TradingAccount | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
  const [portfolioHeat, setPortfolioHeat] = useState(0);
  const [dailyLossUsed, setDailyLossUsed] = useState(0);

  const riskManagementService = RiskManagementService.getInstance();
  const paperTradingService = PaperTradingService.getInstance();

  const updateRiskData = useCallback(() => {
    const settings = riskManagementService.getRiskSettings();
    const accountData = paperTradingService.getAccount();
    const trades = paperTradingService.getOpenTrades();
    
    setRiskSettings(settings);
    setAccount(accountData);
    setOpenTrades(trades);
    
    const heat = riskManagementService.calculatePortfolioHeat(trades, accountData.balance);
    setPortfolioHeat(heat);
    
    setDailyLossUsed(accountData.dailyLossUsed || 0);
  }, [riskManagementService, paperTradingService]);

  useEffect(() => {
    updateRiskData();
    
    const interval = setInterval(updateRiskData, 5000);
    return () => clearInterval(interval);
  }, [updateRiskData]);

  const handleSettingsUpdate = (key: keyof RiskSettings, value: any) => {
    if (!riskSettings) return;
    
    const updatedSettings = { ...riskSettings, [key]: value };
    setRiskSettings(updatedSettings);
    riskManagementService.updateRiskSettings({ [key]: value });
  };

  const getRiskLevelColor = (level: number, max: number) => {
    const percentage = (level / max) * 100;
    if (percentage >= 80) return 'text-red-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskLevelBg = (level: number, max: number) => {
    const percentage = (level / max) * 100;
    if (percentage >= 80) return 'bg-red-900';
    if (percentage >= 60) return 'bg-yellow-900';
    return 'bg-green-900';
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!riskSettings || !account) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-gray-400">Loading risk management...</p>
        </div>
      </div>
    );
  }

  const dailyLossPercentage = (dailyLossUsed / riskSettings.maxDailyLoss) * 100;
  const portfolioHeatPercentage = Math.min(portfolioHeat, 100);

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Portfolio Heat</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${getRiskLevelColor(portfolioHeat, 100)}`}>
              {formatPercentage(portfolioHeat)}
            </p>
            <Progress value={portfolioHeatPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-400">Daily Loss</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${getRiskLevelColor(dailyLossUsed, riskSettings.maxDailyLoss)}`}>
              {formatCurrency(dailyLossUsed)}
            </p>
            <p className="text-xs text-gray-400">
              of {formatCurrency(riskSettings.maxDailyLoss)} limit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Open Positions</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {openTrades.length}
            </p>
            <p className="text-xs text-gray-400">
              of {riskSettings.maxOpenPositions} max
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Risk per Trade</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {formatPercentage(riskSettings.riskPerTrade)}
            </p>
            <p className="text-xs text-gray-400">
              {formatCurrency(account.balance * (riskSettings.riskPerTrade / 100))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {(dailyLossPercentage > 80 || portfolioHeat > 80 || openTrades.length >= riskSettings.maxOpenPositions) && (
        <Card className="bg-red-900/20 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Risk Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dailyLossPercentage > 80 && (
              <div className="flex items-center space-x-2 text-red-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">Daily loss limit approaching ({formatPercentage(dailyLossPercentage)})</span>
              </div>
            )}
            {portfolioHeat > 80 && (
              <div className="flex items-center space-x-2 text-red-400">
                <Activity className="h-4 w-4" />
                <span className="text-sm">High portfolio heat detected ({formatPercentage(portfolioHeat)})</span>
              </div>
            )}
            {openTrades.length >= riskSettings.maxOpenPositions && (
              <div className="flex items-center space-x-2 text-red-400">
                <Target className="h-4 w-4" />
                <span className="text-sm">Maximum open positions reached</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risk Settings */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Risk Management Settings</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure your risk parameters and position sizing rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Position Sizing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Position Sizing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPositionSize" className="text-gray-300">
                  Max Position Size ($)
                </Label>
                <Input
                  id="maxPositionSize"
                  type="number"
                  value={riskSettings.maxPositionSize}
                  onChange={(e) => handleSettingsUpdate('maxPositionSize', Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskPerTrade" className="text-gray-300">
                  Risk per Trade (%)
                </Label>
                <Input
                  id="riskPerTrade"
                  type="number"
                  step="0.1"
                  value={riskSettings.riskPerTrade}
                  onChange={(e) => handleSettingsUpdate('riskPerTrade', Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Stop Loss & Take Profit */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Stop Loss & Take Profit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stopLossPercentage" className="text-gray-300">
                  Stop Loss (%)
                </Label>
                <Input
                  id="stopLossPercentage"
                  type="number"
                  step="0.1"
                  value={riskSettings.stopLossPercentage}
                  onChange={(e) => handleSettingsUpdate('stopLossPercentage', Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="takeProfitPercentage" className="text-gray-300">
                  Take Profit (%)
                </Label>
                <Input
                  id="takeProfitPercentage"
                  type="number"
                  step="0.1"
                  value={riskSettings.takeProfitPercentage}
                  onChange={(e) => handleSettingsUpdate('takeProfitPercentage', Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableAutoStopLoss" className="text-gray-300">
                  Auto Stop Loss
                </Label>
                <Switch
                  id="enableAutoStopLoss"
                  checked={riskSettings.enableAutoStopLoss}
                  onCheckedChange={(checked) => handleSettingsUpdate('enableAutoStopLoss', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableAutoTakeProfit" className="text-gray-300">
                  Auto Take Profit
                </Label>
                <Switch
                  id="enableAutoTakeProfit"
                  checked={riskSettings.enableAutoTakeProfit}
                  onCheckedChange={(checked) => handleSettingsUpdate('enableAutoTakeProfit', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Daily Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Daily Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDailyLoss" className="text-gray-300">
                  Max Daily Loss ($)
                </Label>
                <Input
                  id="maxDailyLoss"
                  type="number"
                  value={riskSettings.maxDailyLoss}
                  onChange={(e) => handleSettingsUpdate('maxDailyLoss', Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxOpenPositions" className="text-gray-300">
                  Max Open Positions
                </Label>
                <Input
                  id="maxOpenPositions"
                  type="number"
                  value={riskSettings.maxOpenPositions}
                  onChange={(e) => handleSettingsUpdate('maxOpenPositions', Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enableDailyLossLimit" className="text-gray-300">
                Enable Daily Loss Limit
              </Label>
              <Switch
                id="enableDailyLossLimit"
                checked={riskSettings.enableDailyLossLimit}
                onCheckedChange={(checked) => handleSettingsUpdate('enableDailyLossLimit', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Risk Exposure */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Current Risk Exposure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No open positions</p>
              <p className="text-sm">Risk exposure will appear here when you have active trades</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openTrades.map(trade => {
                const positionValue = trade.entryPrice * trade.quantity;
                const riskAmount = positionValue * (riskSettings.stopLossPercentage / 100);
                const riskPercentage = (riskAmount / account.balance) * 100;
                
                return (
                  <div key={trade.id} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={trade.action === 'BUY' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}>
                          {trade.action}
                        </Badge>
                        <span className="text-white font-medium">{trade.symbol}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white">{formatCurrency(positionValue)}</p>
                        <p className="text-xs text-gray-400">Position Size</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Risk Amount</p>
                        <p className="text-red-400 font-medium">{formatCurrency(riskAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Risk %</p>
                        <p className={`font-medium ${getRiskLevelColor(riskPercentage, 5)}`}>
                          {formatPercentage(riskPercentage)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Current P&L</p>
                        <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(trade.pnl)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Total Risk Summary */}
              <div className="p-3 bg-gray-800 rounded-lg border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-medium">Total Portfolio Risk</span>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold">{formatPercentage(portfolioHeat)}</p>
                    <p className="text-xs text-gray-400">of account balance</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}