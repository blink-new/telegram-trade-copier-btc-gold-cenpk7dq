import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  X,
  BarChart3,
  Wallet
} from 'lucide-react';
import { PaperTrade, TradingAccount, MarketPrice } from '../types/trading';
import { PaperTradingService } from '../services/paperTradingService';

export function PaperTradingDashboard() {
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [account, setAccount] = useState<TradingAccount | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const paperTradingService = PaperTradingService.getInstance();

  const updateData = useCallback(() => {
    setTrades(paperTradingService.getTrades());
    setAccount(paperTradingService.getAccount());
    setMarketPrices(paperTradingService.getMarketPrices());
  }, [paperTradingService]);

  useEffect(() => {
    // Initialize with demo data
    paperTradingService.generateDemoTrades();
    updateData();

    // Update market prices and PnL every 5 seconds
    const interval = setInterval(() => {
      paperTradingService.updateMarketPrices();
      updateData();
    }, 5000);

    return () => clearInterval(interval);
  }, [paperTradingService, updateData]);

  const handleCloseTrade = async (tradeId: string) => {
    try {
      await paperTradingService.closeTrade(tradeId);
      updateData();
    } catch (error) {
      console.error('Error closing trade:', error);
    }
  };

  const formatPrice = (price: number, symbol?: string) => {
    return `$${price.toLocaleString(undefined, { 
      minimumFractionDigits: symbol === 'BTC' ? 0 : 2, 
      maximumFractionDigits: symbol === 'BTC' ? 0 : 2 
    })}`;
  };

  const formatPnL = (pnl: number) => {
    const color = pnl >= 0 ? 'text-green-400' : 'text-red-400';
    const sign = pnl >= 0 ? '+' : '';
    return (
      <span className={color}>
        {sign}{formatPrice(pnl)}
      </span>
    );
  };

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalPnL = paperTradingService.getTotalPnL();
  const winRate = paperTradingService.getWinRate();

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Balance</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {account ? formatPrice(account.balance) : '$0'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-gray-400">Total P&L</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {formatPnL(totalPnL)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Open Trades</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {openTrades.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Prices */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Market Prices</CardTitle>
          <CardDescription className="text-gray-400">
            Live market data for BTC and Gold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketPrices.map((price) => (
              <div key={price.symbol} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {price.symbol === 'BTC' ? '₿' : 'Au'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{price.symbol}</p>
                    <p className="text-sm text-gray-400">
                      Updated: {new Date(price.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {formatPrice(price.price, price.symbol)}
                  </p>
                  <div className="flex items-center space-x-1">
                    {price.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                    <span className={`text-sm ${price.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trades */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Paper Trades</CardTitle>
          <CardDescription className="text-gray-400">
            Your trading history and open positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="open" className="data-[state=active]:bg-orange-600">
                Open Trades ({openTrades.length})
              </TabsTrigger>
              <TabsTrigger value="closed" className="data-[state=active]:bg-orange-600">
                Closed Trades ({closedTrades.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="open" className="mt-4">
              <ScrollArea className="h-64">
                {openTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No open trades</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {openTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {trade.action === 'BUY' ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white">
                                {trade.action} {trade.symbol}
                              </span>
                              <Badge variant="secondary" className="bg-blue-900 text-blue-300">
                                Open
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>Entry: {formatPrice(trade.entryPrice, trade.symbol)}</span>
                              <span>Current: {formatPrice(trade.currentPrice || 0, trade.symbol)}</span>
                              <span>Qty: {trade.quantity}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPnL(trade.pnl)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseTrade(trade.id)}
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="closed" className="mt-4">
              <ScrollArea className="h-64">
                {closedTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No closed trades yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {closedTrades
                      .sort((a, b) => new Date(b.closedAt || '').getTime() - new Date(a.closedAt || '').getTime())
                      .map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {trade.action === 'BUY' ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">
                                  {trade.action} {trade.symbol}
                                </span>
                                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                  Closed
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span>Entry: {formatPrice(trade.entryPrice, trade.symbol)}</span>
                                <span>Exit: {formatPrice(trade.currentPrice || 0, trade.symbol)}</span>
                                <span>Qty: {trade.quantity}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPnL(trade.pnl)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}