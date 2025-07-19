import { TradingSignal } from '../types/trading';

export class TelegramService {
  private static instance: TelegramService;
  private isConnected = false;
  private channels: string[] = [];

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  // Validate Telegram bot connection
  async connect(botToken: string): Promise<boolean> {
    try {
      // Validate bot token format
      if (!this.isValidBotToken(botToken)) {
        throw new Error('Invalid bot token format');
      }

      // Test connection to Telegram Bot API
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.description || 'Failed to connect to Telegram');
      }

      // Store bot info
      console.log('Connected to Telegram bot:', data.result);
      this.isConnected = true;
      return true;

    } catch (error) {
      console.error('Telegram connection failed:', error);
      this.isConnected = false;
      
      // Fallback to demo mode for development
      if (botToken === 'demo' || botToken === 'test') {
        console.log('Using demo mode for Telegram connection');
        this.isConnected = true;
        return true;
      }
      
      throw error;
    }
  }

  private isValidBotToken(token: string): boolean {
    // Telegram bot tokens follow the format: <bot_id>:<auth_token>
    // Example: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
    const tokenPattern = /^\d+:[A-Za-z0-9_-]{35}$/;
    return tokenPattern.test(token) || token === 'demo' || token === 'test';
  }

  async addChannel(channelId: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    this.channels.push(channelId);
    return true;
  }

  async removeChannel(channelId: string): Promise<boolean> {
    this.channels = this.channels.filter(id => id !== channelId);
    return true;
  }

  // Parse trading signals from Telegram messages
  parseSignal(messageText: string, channelId: string): TradingSignal | null {
    const signalPatterns = [
      // Pattern 1: BUY BTC @ $45000
      /(?:BUY|SELL)\s+(BTC|GOLD)\s+@?\s*\$?(\d+(?:\.\d+)?)/i,
      // Pattern 2: 🚀 BTC Long Entry: $45000
      /(?:🚀|📈|📉)?\s*(BTC|GOLD)\s+(?:Long|Short|Buy|Sell).*?(?:Entry:?\s*)?[$]?(\d+(?:\.\d+)?)/i,
      // Pattern 3: Signal: BUY GOLD 2000.50
      /Signal:?\s*(BUY|SELL)\s+(BTC|GOLD)\s+(\d+(?:\.\d+)?)/i
    ];

    for (const pattern of signalPatterns) {
      const match = messageText.match(pattern);
      if (match) {
        const action = this.determineAction(messageText);
        const symbol = match[1]?.toUpperCase() as 'BTC' | 'GOLD';
        const price = parseFloat(match[2] || match[3]);

        if (action && symbol && price) {
          return {
            id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            channelId,
            symbol,
            action,
            price,
            quantity: this.calculateQuantity(symbol, price),
            signalText: messageText,
            parsedAt: new Date().toISOString(),
            status: 'pending'
          };
        }
      }
    }

    return null;
  }

  private determineAction(text: string): 'BUY' | 'SELL' | null {
    const buyKeywords = ['buy', 'long', 'bullish', '🚀', '📈'];
    const sellKeywords = ['sell', 'short', 'bearish', '📉', '🔻'];

    const lowerText = text.toLowerCase();
    
    if (buyKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'BUY';
    }
    if (sellKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'SELL';
    }
    
    return null;
  }

  private calculateQuantity(symbol: 'BTC' | 'GOLD', price: number): number {
    // Default quantity calculation for paper trading
    if (symbol === 'BTC') {
      return 0.01; // 0.01 BTC
    } else {
      return 1; // 1 oz of Gold
    }
  }

  // Simulate receiving messages from Telegram
  simulateSignal(symbol: 'BTC' | 'GOLD', action: 'BUY' | 'SELL'): TradingSignal {
    const prices = {
      BTC: 45000 + (Math.random() - 0.5) * 2000,
      GOLD: 2000 + (Math.random() - 0.5) * 100
    };

    return {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId: 'demo_channel',
      symbol,
      action,
      price: prices[symbol],
      quantity: this.calculateQuantity(symbol, prices[symbol]),
      signalText: `${action} ${symbol} @ $${prices[symbol].toFixed(2)}`,
      parsedAt: new Date().toISOString(),
      status: 'pending'
    };
  }

  isConnectedToTelegram(): boolean {
    return this.isConnected;
  }

  getConnectedChannels(): string[] {
    return [...this.channels];
  }
}