import { TradingSignal, AIValidation, MarketPrice } from '../types/trading';

export class AIValidationService {
  private static instance: AIValidationService;

  static getInstance(): AIValidationService {
    if (!AIValidationService.instance) {
      AIValidationService.instance = new AIValidationService();
    }
    return AIValidationService.instance;
  }

  async validateSignal(signal: TradingSignal, marketData: MarketPrice[]): Promise<AIValidation> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const marketPrice = marketData.find(m => m.symbol === signal.symbol);
    if (!marketPrice) {
      throw new Error(`Market data not available for ${signal.symbol}`);
    }

    // Calculate validation factors
    const technicalAnalysis = this.calculateTechnicalScore(signal, marketPrice);
    const sentimentAnalysis = this.calculateSentimentScore(signal);
    const marketConditions = this.calculateMarketConditionsScore(marketPrice);
    const historicalPerformance = this.calculateHistoricalScore(signal);

    // Weighted average for overall score
    const score = Math.round(
      technicalAnalysis * 0.3 +
      sentimentAnalysis * 0.2 +
      marketConditions * 0.3 +
      historicalPerformance * 0.2
    );

    const recommendation = this.getRecommendation(score, signal.action);
    const reasoning = this.generateReasoning(score, {
      technicalAnalysis,
      sentimentAnalysis,
      marketConditions,
      historicalPerformance
    }, signal, marketPrice);

    return {
      score,
      factors: {
        technicalAnalysis,
        sentimentAnalysis,
        marketConditions,
        historicalPerformance
      },
      recommendation,
      reasoning,
      timeframe: this.determineTimeframe(signal),
      validatedAt: new Date().toISOString()
    };
  }

  private calculateTechnicalScore(signal: TradingSignal, marketPrice: MarketPrice): number {
    const priceDifference = Math.abs(signal.price - marketPrice.price) / marketPrice.price;
    
    // Score based on how close signal price is to current market price
    let score = 85 - (priceDifference * 1000); // Penalize large price differences
    
    // Add RSI consideration (simulated)
    const rsi = marketPrice.rsi || (30 + Math.random() * 40);
    if (signal.action === 'BUY' && rsi < 30) score += 10; // Oversold
    if (signal.action === 'SELL' && rsi > 70) score += 10; // Overbought
    if (signal.action === 'BUY' && rsi > 70) score -= 15; // Buying overbought
    if (signal.action === 'SELL' && rsi < 30) score -= 15; // Selling oversold

    // Add volatility consideration
    const volatility = marketPrice.volatility || (0.02 + Math.random() * 0.03);
    if (volatility > 0.04) score -= 5; // High volatility reduces confidence

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateSentimentScore(signal: TradingSignal): number {
    // Analyze signal text for sentiment indicators
    const text = signal.signalText.toLowerCase();
    let score = 50; // Base score

    // Positive sentiment indicators
    const positiveWords = ['strong', 'bullish', 'breakout', 'support', 'buy', 'long', 'pump'];
    const negativeWords = ['weak', 'bearish', 'breakdown', 'resistance', 'sell', 'short', 'dump'];

    positiveWords.forEach(word => {
      if (text.includes(word)) {
        score += signal.action === 'BUY' ? 8 : -5;
      }
    });

    negativeWords.forEach(word => {
      if (text.includes(word)) {
        score += signal.action === 'SELL' ? 8 : -5;
      }
    });

    // Check for confidence indicators
    if (text.includes('confirmed') || text.includes('strong signal')) score += 10;
    if (text.includes('maybe') || text.includes('possible')) score -= 10;

    // Add some randomness to simulate real sentiment analysis
    score += (Math.random() - 0.5) * 20;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateMarketConditionsScore(marketPrice: MarketPrice): number {
    let score = 60; // Base score

    // Consider 24h change
    const change = marketPrice.change24h;
    if (Math.abs(change) < 1) score += 10; // Stable market
    if (Math.abs(change) > 5) score -= 15; // Highly volatile market

    // Consider volume (simulated)
    const volume = marketPrice.volume24h || (1000000 + Math.random() * 5000000);
    const avgVolume = marketPrice.symbol === 'BTC' ? 3000000 : 2000000;
    
    if (volume > avgVolume * 1.5) score += 5; // High volume is good
    if (volume < avgVolume * 0.5) score -= 10; // Low volume is concerning

    // Add market trend consideration
    if (change > 2) score += 5; // Uptrend
    if (change < -2) score -= 5; // Downtrend

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateHistoricalScore(signal: TradingSignal): number {
    // Simulate historical performance analysis
    let score = 65; // Base score

    // Simulate channel reliability (would be based on actual historical data)
    const channelReliability = 0.6 + Math.random() * 0.3; // 60-90%
    score = score * channelReliability;

    // Time of day factor
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 16) score += 5; // Market hours
    if (hour >= 0 && hour <= 6) score -= 10; // Low activity hours

    // Symbol-specific adjustments
    if (signal.symbol === 'BTC') {
      score += 5; // BTC generally more predictable
    } else {
      score += 3; // Gold is also relatively stable
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private getRecommendation(score: number, action: 'BUY' | 'SELL'): AIValidation['recommendation'] {
    if (score >= 85) return action === 'BUY' ? 'STRONG_BUY' : 'STRONG_SELL';
    if (score >= 70) return action === 'BUY' ? 'BUY' : 'SELL';
    if (score >= 40) return 'HOLD';
    return action === 'BUY' ? 'SELL' : 'BUY'; // Opposite recommendation for low scores
  }

  private generateReasoning(
    score: number, 
    factors: AIValidation['factors'], 
    signal: TradingSignal, 
    marketPrice: MarketPrice
  ): string[] {
    const reasoning: string[] = [];

    // Overall assessment
    if (score >= 80) {
      reasoning.push(`High confidence signal (${score}/100) with strong technical and fundamental alignment`);
    } else if (score >= 60) {
      reasoning.push(`Moderate confidence signal (${score}/100) with acceptable risk-reward ratio`);
    } else {
      reasoning.push(`Low confidence signal (${score}/100) - proceed with caution or avoid`);
    }

    // Technical analysis
    if (factors.technicalAnalysis >= 75) {
      reasoning.push(`Strong technical setup with favorable price action and indicators`);
    } else if (factors.technicalAnalysis <= 40) {
      reasoning.push(`Weak technical setup - price levels and indicators not aligned`);
    }

    // Market conditions
    if (factors.marketConditions >= 70) {
      reasoning.push(`Favorable market conditions with good volume and stability`);
    } else if (factors.marketConditions <= 40) {
      reasoning.push(`Challenging market conditions with high volatility or low volume`);
    }

    // Sentiment analysis
    if (factors.sentimentAnalysis >= 70) {
      reasoning.push(`Positive sentiment analysis from signal text and market mood`);
    } else if (factors.sentimentAnalysis <= 40) {
      reasoning.push(`Negative sentiment indicators detected in signal context`);
    }

    // Historical performance
    if (factors.historicalPerformance >= 70) {
      reasoning.push(`Strong historical performance from this signal source`);
    } else if (factors.historicalPerformance <= 40) {
      reasoning.push(`Below-average historical performance from this signal source`);
    }

    // Price analysis
    const priceDiff = ((signal.price - marketPrice.price) / marketPrice.price) * 100;
    if (Math.abs(priceDiff) > 2) {
      reasoning.push(`Signal price differs significantly from current market (${priceDiff.toFixed(1)}%)`);
    }

    return reasoning;
  }

  private determineTimeframe(signal: TradingSignal): string {
    const text = signal.signalText.toLowerCase();
    
    if (text.includes('scalp') || text.includes('quick')) return '5m-15m';
    if (text.includes('day') || text.includes('intraday')) return '1h-4h';
    if (text.includes('swing') || text.includes('week')) return '4h-1d';
    if (text.includes('position') || text.includes('long term')) return '1d-1w';
    
    // Default based on symbol
    return signal.symbol === 'BTC' ? '1h-4h' : '4h-1d';
  }

  // Batch validation for multiple signals
  async validateSignals(signals: TradingSignal[], marketData: MarketPrice[]): Promise<Map<string, AIValidation>> {
    const validations = new Map<string, AIValidation>();
    
    // Process signals in parallel with some delay to simulate real AI processing
    const promises = signals.map(async (signal, index) => {
      // Stagger requests to avoid overwhelming the "AI service"
      await new Promise(resolve => setTimeout(resolve, index * 500));
      
      try {
        const validation = await this.validateSignal(signal, marketData);
        validations.set(signal.id, validation);
      } catch (error) {
        console.error(`Failed to validate signal ${signal.id}:`, error);
      }
    });

    await Promise.all(promises);
    return validations;
  }

  // Get confidence score for quick display
  getConfidenceScore(validation: AIValidation): number {
    return validation.score;
  }

  // Get risk level based on confidence score
  getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 75) return 'LOW';
    if (score >= 50) return 'MEDIUM';
    return 'HIGH';
  }
}