import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { TelegramBot } from './components/TelegramBot';
import { SignalFeed } from './components/SignalFeed';
import { PaperTradingDashboard } from './components/PaperTradingDashboard';
import { SignalFormatsGuide } from './components/SignalFormatsGuide';
import { AdvancedAnalytics } from './components/AdvancedAnalytics';
import { RiskManagementDashboard } from './components/RiskManagementDashboard';
import { 
  Bot, 
  Radio, 
  BarChart3, 
  Settings, 
  Zap,
  TrendingUp,
  MessageSquare,
  Shield,
  Activity
} from 'lucide-react';
import { TradingSignal, AIValidation } from './types/trading';
import { PaperTradingService } from './services/paperTradingService';
import { AIValidationService } from './services/aiValidationService';
import './App.css';

function App() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signalValidations, setSignalValidations] = useState<Map<string, AIValidation>>(new Map());
  const [aiValidationEnabled, setAiValidationEnabled] = useState(true);
  const paperTradingService = PaperTradingService.getInstance();
  const aiValidationService = AIValidationService.getInstance();

  const handleSignalReceived = (signal: TradingSignal) => {
    setSignals(prev => [signal, ...prev]);
    
    // Auto-validate if enabled
    if (aiValidationEnabled) {
      validateSignal(signal);
    }
  };

  const validateSignal = async (signal: TradingSignal) => {
    try {
      const marketData = paperTradingService.getMarketPrices();
      const validation = await aiValidationService.validateSignal(signal, marketData);
      
      setSignalValidations(prev => {
        const updated = new Map(prev);
        updated.set(signal.id, validation);
        return updated;
      });

      // Update signal with confidence score and risk level
      setSignals(prev => 
        prev.map(s => 
          s.id === signal.id 
            ? { 
                ...s, 
                confidenceScore: validation.score,
                aiValidation: validation,
                riskLevel: aiValidationService.getRiskLevel(validation.score)
              }
            : s
        )
      );
    } catch (error) {
      console.error('Error validating signal:', error);
    }
  };

  const handleExecuteSignal = async (signal: TradingSignal) => {
    try {
      await paperTradingService.executeSignal(signal);
      
      // Update signal status
      setSignals(prev => 
        prev.map(s => 
          s.id === signal.id 
            ? { ...s, status: 'executed' as const }
            : s
        )
      );
    } catch (error) {
      console.error('Error executing signal:', error);
      
      // Update signal status to failed
      setSignals(prev => 
        prev.map(s => 
          s.id === signal.id 
            ? { ...s, status: 'failed' as const, failureReason: error.message }
            : s
        )
      );
    }
  };

  const pendingSignals = signals.filter(s => s.status === 'pending').length;
  const executedSignals = signals.filter(s => s.status === 'executed').length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Telegram Trade Copier
                </h1>
                <p className="text-sm text-gray-400">BTC & Gold Trading Automation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-orange-900 text-orange-300">
                <Radio className="h-3 w-3 mr-1" />
                Paper Trading
              </Badge>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Signals:</span>
                <Badge variant="secondary" className="bg-green-900 text-green-300">
                  {executedSignals} executed
                </Badge>
                <Badge variant="secondary" className="bg-yellow-900 text-yellow-300">
                  {pendingSignals} pending
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800 mb-8">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-orange-600 flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="signals" 
              className="data-[state=active]:bg-orange-600 flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Signals</span>
              {pendingSignals > 0 && (
                <Badge variant="secondary" className="bg-yellow-900 text-yellow-300 ml-1">
                  {pendingSignals}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-orange-600 flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="risk" 
              className="data-[state=active]:bg-orange-600 flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Risk</span>
            </TabsTrigger>
            <TabsTrigger 
              value="telegram" 
              className="data-[state=active]:bg-orange-600 flex items-center space-x-2"
            >
              <Bot className="h-4 w-4" />
              <span>Telegram</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-orange-600 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Trading Dashboard</h2>
                <p className="text-gray-400">Monitor your paper trading performance</p>
              </div>
            </div>
            <PaperTradingDashboard />
          </TabsContent>

          <TabsContent value="signals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Signal Monitor</h2>
                <p className="text-gray-400">Live trading signals with AI validation</p>
              </div>
            </div>
            <SignalFeed 
              signals={signals} 
              onExecuteSignal={handleExecuteSignal}
              signalValidations={signalValidations}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
                <p className="text-gray-400">Performance metrics, risk analysis, and trading insights</p>
              </div>
            </div>
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Risk Management</h2>
                <p className="text-gray-400">Configure risk parameters and monitor exposure</p>
              </div>
            </div>
            <RiskManagementDashboard />
          </TabsContent>

          <TabsContent value="telegram" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Telegram Integration</h2>
                <p className="text-gray-400">Connect and manage your Telegram bot</p>
              </div>
            </div>
            <TelegramBot onSignalReceived={handleSignalReceived} />
            
            {/* Signal Formats Guide */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Signal Formats Guide</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Learn how to format Telegram messages for automatic parsing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignalFormatsGuide />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <p className="text-gray-400">Configure your trading preferences and AI validation</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Validation Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-purple-400" />
                    <span>AI Validation</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure AI-powered signal analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Enable AI Validation</p>
                      <p className="text-xs text-gray-400">Automatically analyze incoming signals with AI</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiValidationEnabled}
                        onChange={(e) => setAiValidationEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Confidence Threshold</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="60"
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-white">60%</span>
                    </div>
                    <p className="text-xs text-gray-400">Minimum confidence score to execute signals</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Validation Factors</p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Technical Analysis</span>
                        <span>30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Conditions</span>
                        <span>30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sentiment Analysis</span>
                        <span>20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Historical Performance</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Trading Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure your trading parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Auto Execute Signals</p>
                      <p className="text-xs text-gray-400">Automatically execute validated signals</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Paper Trading Mode</p>
                      <p className="text-xs text-gray-400">Trade with virtual money for testing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        disabled
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-orange-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                  
                  <div className="text-center py-4 text-gray-400">
                    <Settings className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">More settings coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;