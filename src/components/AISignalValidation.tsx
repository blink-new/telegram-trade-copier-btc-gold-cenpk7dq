import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import { TradingSignal, AIValidation } from '../types/trading';
import { AIValidationService } from '../services/aiValidationService';
import { PaperTradingService } from '../services/paperTradingService';

interface AISignalValidationProps {
  signals: TradingSignal[];
  onValidationComplete?: (signalId: string, validation: AIValidation) => void;
}

export function AISignalValidation({ signals, onValidationComplete }: AISignalValidationProps) {
  const [validations, setValidations] = useState<Map<string, AIValidation>>(new Map());
  const [validatingSignals, setValidatingSignals] = useState<Set<string>>(new Set());
  const [autoValidate, setAutoValidate] = useState(true);

  const aiValidationService = AIValidationService.getInstance();
  const paperTradingService = PaperTradingService.getInstance();

  useEffect(() => {
    if (autoValidate) {
      const pendingSignals = signals.filter(s => 
        s.status === 'pending' && 
        !validations.has(s.id) && 
        !validatingSignals.has(s.id)
      );

      if (pendingSignals.length > 0) {
        validateSignals(pendingSignals);
      }
    }
  }, [signals, autoValidate, validations, validatingSignals, validateSignals]);

  const validateSignals = useCallback(async (signalsToValidate: TradingSignal[]) => {
    const marketData = paperTradingService.getMarketPrices();
    
    // Mark signals as being validated
    setValidatingSignals(prev => {
      const newSet = new Set(prev);
      signalsToValidate.forEach(s => newSet.add(s.id));
      return newSet;
    });

    try {
      const newValidations = await aiValidationService.validateSignals(signalsToValidate, marketData);
      
      setValidations(prev => {
        const updated = new Map(prev);
        newValidations.forEach((validation, signalId) => {
          updated.set(signalId, validation);
          onValidationComplete?.(signalId, validation);
        });
        return updated;
      });
    } catch (error) {
      console.error('Error validating signals:', error);
    } finally {
      // Remove from validating set
      setValidatingSignals(prev => {
        const newSet = new Set(prev);
        signalsToValidate.forEach(s => newSet.delete(s.id));
        return newSet;
      });
    }
  }, [aiValidationService, paperTradingService, onValidationComplete]);

  const validateSingleSignal = async (signal: TradingSignal) => {
    await validateSignals([signal]);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-900 text-green-300';
    if (score >= 60) return 'bg-yellow-900 text-yellow-300';
    return 'bg-red-900 text-red-300';
  };

  const getRecommendationIcon = (recommendation: AIValidation['recommendation']) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'BUY':
        return <TrendingUp className="h-4 w-4 text-green-300" />;
      case 'HOLD':
        return <Target className="h-4 w-4 text-yellow-400" />;
      case 'SELL':
        return <TrendingDown className="h-4 w-4 text-red-300" />;
      case 'STRONG_SELL':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRecommendationColor = (recommendation: AIValidation['recommendation']) => {
    switch (recommendation) {
      case 'STRONG_BUY':
      case 'BUY':
        return 'text-green-400';
      case 'HOLD':
        return 'text-yellow-400';
      case 'SELL':
      case 'STRONG_SELL':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatPrice = (price: number, symbol: string) => {
    return symbol === 'BTC' 
      ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const pendingValidations = signals.filter(s => validatingSignals.has(s.id));
  const validatedSignals = signals.filter(s => validations.has(s.id));
  const unvalidatedSignals = signals.filter(s => !validations.has(s.id) && !validatingSignals.has(s.id));

  return (
    <div className="space-y-6">
      {/* AI Validation Header */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span>AI Signal Validation</span>
                <Badge variant="secondary" className="bg-purple-900 text-purple-300">
                  {validatedSignals.length} validated
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">
                AI-powered analysis and confidence scoring for trading signals
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoValidate(!autoValidate)}
              className={`${
                autoValidate 
                  ? 'border-purple-500 text-purple-400 hover:bg-purple-500/10' 
                  : 'border-gray-500 text-gray-400 hover:bg-gray-500/10'
              }`}
            >
              <Brain className="h-4 w-4 mr-1" />
              Auto AI {autoValidate ? 'ON' : 'OFF'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Queue */}
      {pendingValidations.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-400 animate-pulse" />
              <span>AI Processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingValidations.map(signal => (
                <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-white font-medium">
                      {signal.action} {signal.symbol} @ {formatPrice(signal.price, signal.symbol)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-400">Analyzing...</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unvalidated Signals */}
      {unvalidatedSignals.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <span>Pending Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unvalidatedSignals.map(signal => (
                <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {signal.action === 'BUY' ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <div>
                      <span className="text-white font-medium">
                        {signal.action} {signal.symbol}
                      </span>
                      <p className="text-sm text-gray-400">
                        {formatPrice(signal.price, signal.symbol)} • Qty: {signal.quantity}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => validateSingleSignal(signal)}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={validatingSignals.has(signal.id)}
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Validate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validated Signals */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>AI Validated Signals</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Signals analyzed by AI with confidence scores and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {validatedSignals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No validated signals yet</p>
                <p className="text-sm">AI validation will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {validatedSignals
                  .sort((a, b) => new Date(b.parsedAt).getTime() - new Date(a.parsedAt).getTime())
                  .map(signal => {
                    const validation = validations.get(signal.id);
                    if (!validation) return null;

                    return (
                      <div key={signal.id} className="p-4 bg-gray-800 rounded-lg space-y-3">
                        {/* Signal Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {signal.action === 'BUY' ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                            <div>
                              <span className="text-white font-medium">
                                {signal.action} {signal.symbol}
                              </span>
                              <p className="text-sm text-gray-400">
                                {formatPrice(signal.price, signal.symbol)} • {formatTime(signal.parsedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className={getConfidenceBadgeColor(validation.score)}>
                              {validation.score}/100
                            </Badge>
                            <div className="flex items-center space-x-1">
                              {getRecommendationIcon(validation.recommendation)}
                              <span className={`text-sm font-medium ${getRecommendationColor(validation.recommendation)}`}>
                                {validation.recommendation.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confidence Score */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">AI Confidence</span>
                            <span className={`text-sm font-medium ${getConfidenceColor(validation.score)}`}>
                              {validation.score}%
                            </span>
                          </div>
                          <Progress value={validation.score} className="h-2" />
                        </div>

                        {/* Factor Breakdown */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Technical</span>
                              <span className="text-xs text-white">{validation.factors.technicalAnalysis}%</span>
                            </div>
                            <Progress value={validation.factors.technicalAnalysis} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Sentiment</span>
                              <span className="text-xs text-white">{validation.factors.sentimentAnalysis}%</span>
                            </div>
                            <Progress value={validation.factors.sentimentAnalysis} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Market</span>
                              <span className="text-xs text-white">{validation.factors.marketConditions}%</span>
                            </div>
                            <Progress value={validation.factors.marketConditions} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Historical</span>
                              <span className="text-xs text-white">{validation.factors.historicalPerformance}%</span>
                            </div>
                            <Progress value={validation.factors.historicalPerformance} className="h-1" />
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        <div className="space-y-2">
                          <span className="text-sm text-gray-400">AI Analysis:</span>
                          <div className="space-y-1">
                            {validation.reasoning.map((reason, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <div className="w-1 h-1 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                                <p className="text-xs text-gray-300">{reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Timeframe */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                          <span className="text-xs text-gray-400">Timeframe: {validation.timeframe}</span>
                          <span className="text-xs text-gray-400">
                            Validated: {formatTime(validation.validatedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}