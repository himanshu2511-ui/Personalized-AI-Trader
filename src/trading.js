export class Portfolio {
  constructor(initialBalance = 100000) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.positions = {}; // { 'BTC-USD': { type: 'BUY', entryPrice: 60000, size: 1, ... } }
    this.history = []; // Array of closed trades
  }

  getAvailableBalance() {
    return this.balance;
  }

  getCurrentValue(currentPrices) {
    let positionValue = 0;
    for (const [assetId, pos] of Object.entries(this.positions)) {
      if (!currentPrices[assetId]) continue;
      const currentPrice = currentPrices[assetId];
      if (pos.type === 'BUY') {
        const value = pos.size * currentPrice;
        positionValue += value;
      } else if (pos.type === 'SELL') {
        // Shorting
        const profit = (pos.entryPrice - currentPrice) * pos.size;
        positionValue += (pos.entryPrice * pos.size) + profit;
      }
    }
    return this.balance + positionValue;
  }

  executeTrade(asset, type, price, size) {
    const cost = price * size;
    // Basic validation
    if (size <= 0) return { error: 'Size must be greater than 0' };
    
    // Check if position already exists for this asset
    if (this.positions[asset.id]) {
      return { error: 'Position already exists. Close it first.' };
    }

    if (type === 'BUY' && cost > this.balance) {
      return { error: 'Insufficient funds' };
    }
    if (type === 'SELL' && cost > this.balance) {
       // Assuming margin requires equivalent cash
       return { error: 'Insufficient margin for short selling' };
    }

    // Deduct cost
    this.balance -= cost;
    
    // Create Position
    this.positions[asset.id] = {
      assetId: asset.id,
      symbol: asset.symbol,
      type,
      entryPrice: price,
      size,
      time: Date.now()
    };

    return { success: true, position: this.positions[asset.id] };
  }

  closePosition(assetId, currentPrice) {
    const pos = this.positions[assetId];
    if (!pos) return { error: 'No open position found for asset' };

    let pnl = 0;
    let returnAmount = 0;

    if (pos.type === 'BUY') {
      pnl = (currentPrice - pos.entryPrice) * pos.size;
      returnAmount = (pos.entryPrice * pos.size) + pnl;
    } else if (pos.type === 'SELL') {
      pnl = (pos.entryPrice - currentPrice) * pos.size;
      returnAmount = (pos.entryPrice * pos.size) + pnl;
    }

    this.balance += returnAmount;

    const tradeRecord = {
      ...pos,
      exitPrice: currentPrice,
      exitTime: Date.now(),
      pnl,
      pnlPercent: (pnl / (pos.entryPrice * pos.size)) * 100
    };

    this.history.push(tradeRecord);
    delete this.positions[assetId];

    return { success: true, trade: tradeRecord };
  }

  getAnalytics() {
    const totalTrades = this.history.length;
    let wins = 0;
    let totalPnl = 0;
    
    this.history.forEach(trade => {
      if (trade.pnl > 0) wins++;
      totalPnl += trade.pnl;
    });

    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : '0.00';
    return {
      totalTrades,
      winRate,
      totalPnl: totalPnl.toFixed(2),
      wins,
      losses: totalTrades - wins,
      roi: (((this.balance + totalPnl) - this.initialBalance) / this.initialBalance * 100).toFixed(2)
    };
  }
}
