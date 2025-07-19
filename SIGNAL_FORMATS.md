# Telegram Signal Formats Guide

## Supported Signal Formats

The Telegram Trade Copier platform automatically parses trading signals from Telegram messages using the following formats:

### Format 1: Basic BUY/SELL Commands
```
BUY BTC @ $45000
SELL GOLD @ $2000.50
BUY BTC $45000
SELL GOLD 2000.50
```

### Format 2: Emoji-Enhanced Signals
```
🚀 BTC Long Entry: $45000
📈 GOLD Buy Entry: $2000.50
📉 BTC Short Entry: $44000
🔻 GOLD Sell Entry: $1995.00
```

### Format 3: Structured Signal Format
```
Signal: BUY BTC 45000
Signal: SELL GOLD 2000.50
Signal BUY BTC $45000
Signal SELL GOLD $2000.50
```

## Supported Symbols
- **BTC** (Bitcoin)
- **GOLD** (Gold)

## Supported Actions
- **BUY** / **Long** / **Bullish** (with emojis: 🚀, 📈)
- **SELL** / **Short** / **Bearish** (with emojis: 📉, 🔻)

## Price Format
- With dollar sign: `$45000`, `$2000.50`
- Without dollar sign: `45000`, `2000.50`
- Decimal places supported for precise pricing

## Auto-Execution Rules
- **Default Quantities:**
  - BTC: 0.01 BTC per signal
  - GOLD: 1 oz per signal
- **Auto-execution:** Enabled by default (can be toggled off)
- **Processing delay:** 1 second simulation delay

## Example Valid Messages

### Bitcoin Signals
```
🚀 BTC Long Entry: $45000
BUY BTC @ $45000
Signal: BUY BTC 45000
📈 Bitcoin bullish signal $45000
BTC Long $45000
```

### Gold Signals
```
📉 GOLD Short Entry: $2000.50
SELL GOLD @ $2000.50
Signal: SELL GOLD 2000.50
🔻 Gold bearish signal $2000.50
GOLD Short $2000.50
```

## Signal Processing Flow
1. **Message Received** from Telegram channel
2. **Pattern Matching** using regex patterns
3. **Signal Parsing** extracts symbol, action, and price
4. **Auto-Execution** (if enabled) or manual execution
5. **Trade Creation** in paper trading account
6. **Real-time Updates** in dashboard

## Invalid Formats (Will Not Parse)
- Missing symbol: `BUY @ $45000`
- Missing action: `BTC $45000`
- Missing price: `BUY BTC`
- Unsupported symbols: `BUY ETH $3000`
- Malformed prices: `BUY BTC $45,000.00.50`

## Testing Your Signals
Use the demo signal generator in the platform to test different formats and see how they're parsed and executed.