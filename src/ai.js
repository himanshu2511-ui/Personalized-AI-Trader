// Calculate Simple Moving Average
export function calculateSMA(data, period) {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({ time: data[i].time, value: sum / period });
  }
  return sma;
}

// Calculate Relative Strength Index
export function calculateRSI(data, period = 14) {
  const rsi = [];
  if (data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change; // Absolute value natively
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let currentRSI = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
  
  rsi.push({ time: data[period].time, value: currentRSI });

  // Smoothed formula for the rest
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    let gain = change > 0 ? change : 0;
    let loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    currentRSI = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    rsi.push({ time: data[i].time, value: currentRSI });
  }

  return rsi;
}

// Generate AI Analysis based on current data
export function getAIRecommendation(chartData, asset) {
  if (chartData.length < 50) return null;

  const currentPrice = chartData[chartData.length - 1].close;
  
  // Calculate Indicators
  const sma20 = calculateSMA(chartData, 20);
  const sma50 = calculateSMA(chartData, 50);
  const rsiData = calculateRSI(chartData, 14);

  const currentSMA20 = sma20[sma20.length - 1].value;
  const currentSMA50 = sma50[sma50.length - 1].value;
  const currentRSI = rsiData[rsiData.length - 1].value;

  let signal = 'HOLD';
  let confidence = 50;
  let risk = 'Medium';
  let trend = 'Neutral';

  // Rule-based logic
  let points = 0;
  
  // Trend Detection
  if (currentSMA20 > currentSMA50) {
    trend = 'Bullish';
    points += 2;
  } else if (currentSMA20 < currentSMA50) {
    trend = 'Bearish';
    points -= 2;
  }

  // RSI Overbought/Oversold
  if (currentRSI < 30) {
    points += 3; // Oversold -> Buy Signal
    confidence += 20;
    risk = 'High'; // Picking bottoms is risky
  } else if (currentRSI > 70) {
    points -= 3; // Overbought -> Sell Signal
    confidence += 20;
    risk = 'Medium';
  } else {
    // Trend continuation confidence
    confidence += Math.abs(currentRSI - 50);
  }

  // Price action vs SMA
  if (currentPrice > currentSMA20 && trend === 'Bullish') points += 1;
  if (currentPrice < currentSMA20 && trend === 'Bearish') points -= 1;

  // Signal Output Output
  if (points >= 3) {
    signal = 'BUY';
    confidence = Math.min(confidence + 10, 95);
  } else if (points <= -3) {
    signal = 'SELL';
    confidence = Math.min(confidence + 10, 95);
  } else {
    signal = 'HOLD';
    confidence = Math.max(30, Math.min(confidence, 70));
    risk = 'Low';
  }

  // Calculate generic limits
  let target, stop;
  if (signal === 'BUY') {
    target = currentPrice * (1 + asset.volatility * 2.5);
    stop = currentPrice * (1 - asset.volatility * 1.2);
  } else if (signal === 'SELL') {
    target = currentPrice * (1 - asset.volatility * 2.5);
    stop = currentPrice * (1 + asset.volatility * 1.2);
  } else {
    target = currentPrice;
    stop = currentPrice;
  }

  return {
    signal,
    confidence: parseInt(confidence),
    target: target.toFixed(2),
    stop: stop.toFixed(2),
    trend,
    risk,
    currentPrice: currentPrice.toFixed(2)
  };
}
