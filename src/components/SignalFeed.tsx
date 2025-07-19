import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  Play,
  Pause,
  Brain,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { TradingSignal } from '../types/trading';
import { PaperTradingService } from '../services/paperTradingService';

interface SignalFeedProps {
  signals: TradingSignal[];
  onExecuteSignal: (signal: TradingSignal) => void;
  signalValidations?: Map<string, any>;
}

export function SignalFeed({ signals, onExecuteSignal, signalValidations }: SignalFeedProps) {
  const [autoExecute, setAutoExecute] = useState(true);
  const paperTradingService = PaperTradingService.getInstance();

  useEffect(() => {
    if (autoExecute) {
      // Auto-execute pending signals
      const pendingSignals = signals.filter(s => s.status === 'pending');
      pendingSignals.forEach(signal => {
        setTimeout(() => {
          onExecuteSignal(signal);
        }, 1000); // Small delay to simulate processing
      });
    }
  }, [signals, autoExecute, onExecuteSignal]);

  const getSignalIcon = (action: 'BUY' | 'SELL') => {
    return action === 'BUY' ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400" />
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'executed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900 text-yellow-300';
      case 'executed':
        return 'bg-green-900 text-green-300';
      case 'failed':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const formatPrice = (price: number, symbol: string) => {
    return symbol === 'BTC' 
      ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBadgeColor = (score?: number) => {
    if (!score) return 'bg-gray-900 text-gray-300';
    if (score >= 80) return 'bg-green-900 text-green-300';
    if (score >= 60) return 'bg-yellow-900 text-yellow-300';
    return 'bg-red-900 text-red-300';
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'LOW':
        return <Shield className="h-3 w-3 text-green-400" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
      case 'HIGH':
        return <AlertTriangle className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center space-x-2">
              <span>Signal Feed</span>
              <Badge variant="secondary" className="bg-orange-900 text-orange-300">
                {signals.length} signals
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Live trading signals from connected channels
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoExecute(!autoExecute)}
            className={`${
              autoExecute 
                ? 'border-green-500 text-green-400 hover:bg-green-500/10' 
                : 'border-gray-500 text-gray-400 hover:bg-gray-500/10'
            }`}
          >
            {autoExecute ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Auto Execute ON
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Auto Execute OFF
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {signals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No signals received yet</p>
              <p className="text-sm">Connect to Telegram channels to start receiving signals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals
                .sort((a, b) => new Date(b.parsedAt).getTime() - new Date(a.parsedAt).getTime())
                .map((signal, index) => (
                  <div key={signal.id}>
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getSignalIcon(signal.action)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">
                              {signal.action} {signal.symbol}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(signal.status)}
                            >
                              {getStatusIcon(signal.status)}
                              <span className="ml-1">{signal.status}</span>
                            </Badge>
                            {signal.riskLevel && (
                              <Badge variant="secondary" className={`${
                                signal.riskLevel === 'LOW' ? 'bg-green-900 text-green-300' :
                                signal.riskLevel === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {getRiskIcon(signal.riskLevel)}
                                <span className="ml-1">{signal.riskLevel}</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                            <span>Price: {formatPrice(signal.price, signal.symbol)}</span>
                            <span>Qty: {signal.quantity}</span>
                            <span>{formatTime(signal.parsedAt)}</span>
                          </div>
                          
                          {/* AI Confidence Score */}
                          {signal.confidenceScore && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Brain className="h-3 w-3 text-purple-400" />
                                <span className="text-xs text-gray-400">AI Confidence:</span>
                                <span className={`text-xs font-medium ${getConfidenceColor(signal.confidenceScore)}`}>
                                  {signal.confidenceScore}%
                                </span>
                              </div>
                              <Progress value={signal.confidenceScore} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {signal.confidenceScore && (
                          <Badge variant="secondary" className={getConfidenceBadgeColor(signal.confidenceScore)}>
                            <Brain className="h-3 w-3 mr-1" />
                            {signal.confidenceScore}
                          </Badge>
                        )}
                        {signal.status === 'pending' && !autoExecute && (
                          <Button
                            size="sm"
                            onClick={() => onExecuteSignal(signal)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Execute
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Signal text preview */}
                    <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-400 font-mono">
                      {signal.signalText}
                    </div>
                    
                    {index < signals.length - 1 && (
                      <Separator className="bg-gray-700 my-3" />
                    )}
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}