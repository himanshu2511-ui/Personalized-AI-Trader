export const MOCK_ASSETS = [
  { id: 'BTC-USD', symbol: 'Bitcoin', basePrice: 65000, volatility: 0.02 },
  { id: 'ETH-USD', symbol: 'Ethereum', basePrice: 3500, volatility: 0.03 },
  { id: 'AAPL', symbol: 'Apple Inc.', basePrice: 175, volatility: 0.015 },
  { id: 'TSLA', symbol: 'Tesla Inc.', basePrice: 200, volatility: 0.04 },
  { id: 'NVDA', symbol: 'NVIDIA Corp.', basePrice: 850, volatility: 0.035 }
];

export function generateHistoricalData(asset, numPoints = 100) {
  let data = [];
  let currentPrice = asset.basePrice;
  // Let's generate data backwards from today to ensure we end at standard time.
  let now = Math.floor(Date.now() / 1000);
  // Subtract one hour per bar (3600 seconds)
  now = now - (now % 3600); // Normalize to start of hour
  
  let timeStamp = now - (numPoints * 3600);

  // Random walk for historical data
  for (let i = 0; i < numPoints; i++) {
    // Basic random walk with some trend
    const change = 1 + (Math.random() - 0.5) * asset.volatility;
    currentPrice *= change;
    
    // Create OHLC
    const open = currentPrice;
    const high = open * (1 + Math.random() * asset.volatility * 0.5);
    const low = open * (1 - Math.random() * asset.volatility * 0.5);
    const close = low + Math.random() * (high - low);

    data.push({
      time: timeStamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });
    
    currentPrice = close; // Carry over
    timeStamp += 3600; // Next hour
  }
  return data;
}

export function generateNextTick(asset, lastTick) {
  const change = 1 + (Math.random() - 0.5) * asset.volatility;
  let close = lastTick.close * change;
  // A simplistic tick mapping just adding to the existing bar or creating new (for simplicity, we will simulate a new day tick if time advances, but let's just make it intraday changes to the current bar for real-time feel, or advance by hour).
  // Actually, to make the chart move, let's advance time by 1 hour (3600 seconds)
  
  const open = lastTick.close;
  const high = Math.max(open, close) * (1 + Math.random() * asset.volatility * 0.1);
  const low = Math.min(open, close) * (1 - Math.random() * asset.volatility * 0.1);

  return {
    time: lastTick.time + 3600,
    open: parseFloat(open.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
  };
}
