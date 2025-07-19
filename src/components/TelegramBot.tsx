import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Bot, Plus, Trash2, Wifi, WifiOff, MessageSquare } from 'lucide-react';
import { TelegramService } from '../services/telegramService';
import { TelegramChannel } from '../types/trading';

interface TelegramBotProps {
  onSignalReceived: (signal: any) => void;
}

export function TelegramBot({ onSignalReceived }: TelegramBotProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [channels, setChannels] = useState<TelegramChannel[]>([
    {
      id: 'demo_channel',
      channelName: 'Demo Trading Signals',
      channelId: '@demo_signals',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const telegramService = TelegramService.getInstance();

  useEffect(() => {
    setIsConnected(telegramService.isConnectedToTelegram());
  }, [telegramService]);

  const handleConnect = async () => {
    if (!botToken.trim()) {
      setConnectionError('Please enter a bot token or use "demo" for testing');
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const connected = await telegramService.connect(botToken.trim());
      setIsConnected(connected);
      if (connected) {
        // Start demo signal simulation
        startDemoSignals();
        setConnectionError(null);
      }
    } catch (error) {
      console.error('Failed to connect to Telegram:', error);
      setConnectionError(error.message || 'Failed to connect to Telegram');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setBotToken('');
  };

  const addChannel = async () => {
    if (!newChannelId.trim() || !isConnected) return;

    const newChannel: TelegramChannel = {
      id: `channel_${Date.now()}`,
      channelName: newChannelId.replace('@', ''),
      channelId: newChannelId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await telegramService.addChannel(newChannelId);
    setChannels([...channels, newChannel]);
    setNewChannelId('');
  };

  const removeChannel = async (channelId: string) => {
    await telegramService.removeChannel(channelId);
    setChannels(channels.filter(c => c.id !== channelId));
  };

  const toggleChannel = (channelId: string) => {
    setChannels(channels.map(c => 
      c.id === channelId ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const startDemoSignals = () => {
    // Simulate receiving signals every 30 seconds
    const interval = setInterval(() => {
      if (isConnected && channels.some(c => c.isActive)) {
        const symbols: ('BTC' | 'GOLD')[] = ['BTC', 'GOLD'];
        const actions: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
        
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        const signal = telegramService.simulateSignal(randomSymbol, randomAction);
        onSignalReceived(signal);
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  const generateTestSignal = () => {
    const symbols: ('BTC' | 'GOLD')[] = ['BTC', 'GOLD'];
    const actions: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
    
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    const signal = telegramService.simulateSignal(randomSymbol, randomAction);
    onSignalReceived(signal);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Telegram Bot</CardTitle>
            {isConnected ? (
              <Badge variant="secondary" className="bg-green-900 text-green-300">
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-900 text-red-300">
                <WifiOff className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateTestSignal}
              className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Test Signal
            </Button>
          )}
        </div>
        <CardDescription className="text-gray-400">
          Connect your Telegram bot to monitor trading channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Bot Token
              </label>
              <Input
                type="text"
                placeholder="Enter bot token (123456789:ABC...) or type 'demo' for testing"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
              />
              <p className="text-xs text-gray-400 mt-1">
                Get your bot token from @BotFather on Telegram, or type <span className="text-orange-400 font-mono">"demo"</span> for testing
              </p>
            </div>
            
            {connectionError && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-sm text-red-400">{connectionError}</p>
              </div>
            )}
            <div className="flex space-x-2">
              <Button
                onClick={handleConnect}
                disabled={!botToken.trim() || isConnecting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isConnecting ? 'Connecting...' : 'Connect Bot'}
              </Button>
              <Button
                onClick={() => {
                  setBotToken('demo');
                  setConnectionError(null);
                }}
                variant="outline"
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                disabled={isConnecting}
              >
                Demo
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-300">Connected Channels</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                Disconnect
              </Button>
            </div>

            <div className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={channel.isActive}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {channel.channelName}
                      </p>
                      <p className="text-xs text-gray-400">{channel.channelId}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChannel(channel.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="bg-gray-700" />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Add New Channel
              </label>
              <div className="flex space-x-2">
                <Input
                  placeholder="@channel_username or channel_id"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  onClick={addChannel}
                  disabled={!newChannelId.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}