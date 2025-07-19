import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Copy, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Zap,
  AlertCircle
} from 'lucide-react';

export function SignalFormatsGuide() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatExamples = {
    basic: [
      'BUY BTC @ $45000',
      'SELL GOLD @ $2000.50',
      'BUY BTC $45000',
      'SELL GOLD 2000.50'
    ],
    emoji: [
      '🚀 BTC Long Entry: $45000',
      '📈 GOLD Buy Entry: $2000.50',
      '📉 BTC Short Entry: $44000',
      '🔻 GOLD Sell Entry: $1995.00'
    ],
    structured: [
      'Signal: BUY BTC 45000',
      'Signal: SELL GOLD 2000.50',
      'Signal BUY BTC $45000',
      'Signal SELL GOLD $2000.50'
    ]
  };

  const ExampleCard = ({ title, examples, icon }: { 
    title: string; 
    examples: string[]; 
    icon: React.ReactNode;
  }) => (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2 text-sm">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {examples.map((example, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-900 rounded border border-gray-700">
            <code className="text-green-400 text-xs font-mono flex-1">{example}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(example)}
              className="h-6 w-6 p-0 hover:bg-gray-700"
            >
              {copiedText === example ? (
                <CheckCircle className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-gray-400" />
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-orange-400" />
          <span>Signal Format Guide</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Supported Telegram message formats for automatic signal parsing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="formats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="formats" className="data-[state=active]:bg-orange-600">
              Formats
            </TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:bg-orange-600">
              Rules
            </TabsTrigger>
            <TabsTrigger value="examples" className="data-[state=active]:bg-orange-600">
              Examples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formats" className="space-y-4">
            <div className="grid gap-4">
              <ExampleCard
                title="Basic Format"
                examples={formatExamples.basic}
                icon={<TrendingUp className="h-4 w-4 text-blue-400" />}
              />
              <ExampleCard
                title="Emoji Enhanced"
                examples={formatExamples.emoji}
                icon={<Zap className="h-4 w-4 text-yellow-400" />}
              />
              <ExampleCard
                title="Structured Format"
                examples={formatExamples.structured}
                icon={<MessageSquare className="h-4 w-4 text-purple-400" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Supported Elements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-white text-sm font-medium mb-2">Symbols</h4>
                    <div className="flex space-x-2">
                      <Badge variant="secondary" className="bg-orange-900 text-orange-300">BTC</Badge>
                      <Badge variant="secondary" className="bg-yellow-900 text-yellow-300">GOLD</Badge>
                    </div>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div>
                    <h4 className="text-white text-sm font-medium mb-2">Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-green-400 font-medium">BUY Signals</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs border-green-500 text-green-400">BUY</Badge>
                          <Badge variant="outline" className="text-xs border-green-500 text-green-400">Long</Badge>
                          <Badge variant="outline" className="text-xs border-green-500 text-green-400">Bullish</Badge>
                          <Badge variant="outline" className="text-xs border-green-500 text-green-400">🚀</Badge>
                          <Badge variant="outline" className="text-xs border-green-500 text-green-400">📈</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-red-400 font-medium">SELL Signals</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs border-red-500 text-red-400">SELL</Badge>
                          <Badge variant="outline" className="text-xs border-red-500 text-red-400">Short</Badge>
                          <Badge variant="outline" className="text-xs border-red-500 text-red-400">Bearish</Badge>
                          <Badge variant="outline" className="text-xs border-red-500 text-red-400">📉</Badge>
                          <Badge variant="outline" className="text-xs border-red-500 text-red-400">🔻</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div>
                    <h4 className="text-white text-sm font-medium mb-2">Price Formats</h4>
                    <div className="space-y-1">
                      <code className="text-green-400 text-xs">$45000</code>
                      <span className="text-gray-400 text-xs ml-2">With dollar sign</span>
                    </div>
                    <div className="space-y-1">
                      <code className="text-green-400 text-xs">45000</code>
                      <span className="text-gray-400 text-xs ml-2">Without dollar sign</span>
                    </div>
                    <div className="space-y-1">
                      <code className="text-green-400 text-xs">2000.50</code>
                      <span className="text-gray-400 text-xs ml-2">Decimal places supported</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-orange-400" />
                    <span>Auto-Execution Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>BTC Default Quantity:</span>
                    <Badge variant="secondary" className="bg-blue-900 text-blue-300">0.01 BTC</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>GOLD Default Quantity:</span>
                    <Badge variant="secondary" className="bg-yellow-900 text-yellow-300">1 oz</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Delay:</span>
                    <Badge variant="secondary" className="bg-gray-700 text-gray-300">1 second</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <div className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Valid Examples</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    '🚀 BTC Long Entry: $45000',
                    'Signal: BUY BTC 45000',
                    'SELL GOLD @ $2000.50',
                    '📈 Bitcoin bullish signal $45000',
                    'BTC Long $45000',
                    '📉 GOLD Short Entry: $2000.50',
                    'Signal SELL GOLD 2000.50'
                  ].map((example, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-900/20 rounded border border-green-700/50">
                      <code className="text-green-400 text-xs font-mono flex-1">{example}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(example)}
                        className="h-6 w-6 p-0 hover:bg-green-700/20"
                      >
                        {copiedText === example ? (
                          <CheckCircle className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-green-400" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span>Invalid Examples (Will Not Parse)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { text: 'BUY @ $45000', reason: 'Missing symbol' },
                    { text: 'BTC $45000', reason: 'Missing action' },
                    { text: 'BUY BTC', reason: 'Missing price' },
                    { text: 'BUY ETH $3000', reason: 'Unsupported symbol' },
                    { text: 'BUY BTC $45,000.00.50', reason: 'Malformed price' }
                  ].map((example, index) => (
                    <div key={index} className="p-2 bg-red-900/20 rounded border border-red-700/50">
                      <div className="flex items-center justify-between">
                        <code className="text-red-400 text-xs font-mono">{example.text}</code>
                        <Badge variant="outline" className="text-xs border-red-500 text-red-400">
                          {example.reason}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}