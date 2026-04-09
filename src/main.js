import { createIcons, icons } from 'lucide';
import { MOCK_ASSETS, generateHistoricalData, generateNextTick } from './data.js';
import { initChart, updateChartData, updateChartTick, addSMASeries, clearSmaSeries } from './chart.js';
import { getAIRecommendation, calculateSMA } from './ai.js';
import { Portfolio } from './trading.js';

// Init Lucide Icons
createIcons({ icons });

// State
let activeAsset = MOCK_ASSETS[0];
let currentChartData = [];
let portfolio = new Portfolio(100000);
let simulationInterval = null;

// DOM Elements
const assetListEl = document.getElementById('asset-list');
const chartMountEl = document.getElementById('chart-mount');
const currentAssetTitle = document.getElementById('current-asset-title');

const aiSignalEl = document.getElementById('ai-signal');
const aiConfidenceFill = document.getElementById('ai-confidence-fill');
const aiConfidenceText = document.getElementById('ai-confidence-text');
const aiTargetEl = document.getElementById('ai-target');
const aiStopEl = document.getElementById('ai-stop');
const aiTrendEl = document.getElementById('ai-trend');
const aiRiskEl = document.getElementById('ai-risk');

const tradeBalanceEl = document.getElementById('trade-balance');
const tradeSizeInput = document.getElementById('trade-size');
const btnBuy = document.getElementById('btn-buy');
const btnSell = document.getElementById('btn-sell');
const btnClose = document.getElementById('btn-close-position');

const navPortfolioValue = document.getElementById('nav-portfolio-value');
const navWinRate = document.getElementById('nav-win-rate');

const tradeHistoryBody = document.getElementById('trade-history-body');


// Application Initialization
function init() {
  renderAssetList();
  initChart(chartMountEl);
  selectAsset(MOCK_ASSETS[0]);
  updatePortfolioUI();
  updateHistoryUI();
}

// Side Bar Assets
function renderAssetList() {
  assetListEl.innerHTML = '';
  MOCK_ASSETS.forEach(asset => {
    const li = document.createElement('li');
    li.className = `asset-item ${activeAsset.id === asset.id ? 'active' : ''}`;
    li.innerHTML = `
      <span class="asset-symbol">${asset.symbol}</span>
      <span class="asset-price" id="price-${asset.id}">--</span>
    `;
    li.addEventListener('click', () => {
      selectAsset(asset);
      renderAssetList(); // update active class
    });
    assetListEl.appendChild(li);
  });
}

function updateSidebarPrice(assetId, price) {
  const priceEl = document.getElementById(`price-${assetId}`);
  if (priceEl) priceEl.innerText = `$${price.toFixed(2)}`;
}

// Asset Selection
function selectAsset(asset) {
  if (simulationInterval) clearInterval(simulationInterval);
  activeAsset = asset;
  currentAssetTitle.innerText = `${asset.symbol} Interactive Analysis`;
  
  // Generate historical
  currentChartData = generateHistoricalData(asset, 150);
  
  // Clear old series
  clearSmaSeries();
  
  // Plot
  updateChartData(currentChartData);
  
  // Add SMA indicators
  const sma20 = calculateSMA(currentChartData, 20);
  addSMASeries(sma20, '#00f0ff', 'SMA 20');
  
  // Analyze
  updateAIAnalysis();
  
  // Start simulation loop
  simulationInterval = setInterval(simulateMarketTick, 1000); // 1 tick per second
  
  // Update Trade panel
  updateTradePanel();
  
  // Update side bar initial price
  updateSidebarPrice(asset.id, currentChartData[currentChartData.length - 1].close);
}

// Market Tick Loop
function simulateMarketTick() {
  const lastTick = currentChartData[currentChartData.length - 1];
  const newTick = generateNextTick(activeAsset, lastTick);
  
  currentChartData.push(newTick);
  
  // To avoid memory leak in a long simulation, keep array reasonable
  if (currentChartData.length > 300) {
    currentChartData.shift(); 
  }

  updateChartTick(newTick);
  updateSidebarPrice(activeAsset.id, newTick.close);
  updateAIAnalysis();
  updatePortfolioUI(); // Update running PNL visually
}

// AI Panel Update
function updateAIAnalysis() {
  const analysis = getAIRecommendation(currentChartData, activeAsset);
  if (!analysis) return;

  aiSignalEl.innerText = analysis.signal;
  aiSignalEl.className = `signal-value text-${analysis.signal.toLowerCase()}`;
  
  aiConfidenceFill.style.width = `${analysis.confidence}%`;
  aiConfidenceText.innerText = `${analysis.confidence}% Confidence`;
  
  aiTargetEl.innerText = `$${analysis.target}`;
  aiStopEl.innerText = `$${analysis.stop}`;
  aiTrendEl.innerText = analysis.trend;
  aiTrendEl.style.color = analysis.trend === 'Bullish' ? '#00ff88' : (analysis.trend === 'Bearish' ? '#ff3366' : '#8b9bb4');
  
  aiRiskEl.innerText = analysis.risk;
}

// Trading and Portfolio Interaction
function updatePortfolioUI() {
  // get current prices for open position estimation
  const currentPrices = { [activeAsset.id]: currentChartData[currentChartData.length - 1].close };
  
  const totalValue = portfolio.getCurrentValue(currentPrices);
  navPortfolioValue.innerText = totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  tradeBalanceEl.innerText = `$${portfolio.getAvailableBalance().toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  
  const analytics = portfolio.getAnalytics();
  navWinRate.innerText = analytics.winRate;
}

function updateTradePanel() {
  const pos = portfolio.positions[activeAsset.id];
  if (pos) {
    btnBuy.classList.add('hidden');
    btnSell.classList.add('hidden');
    btnClose.classList.remove('hidden');
    document.querySelector('.input-group').classList.add('hidden');
  } else {
    btnBuy.classList.remove('hidden');
    btnSell.classList.remove('hidden');
    btnClose.classList.add('hidden');
    document.querySelector('.input-group').classList.remove('hidden');
  }
}

function updateHistoryUI() {
  tradeHistoryBody.innerHTML = '';
  portfolio.history.slice().reverse().forEach(trade => {
    const tr = document.createElement('tr');
    const pnlClass = trade.pnl > 0 ? 'text-buy' : 'text-sell';
    tr.innerHTML = `
      <td>${trade.symbol}</td>
      <td class="${trade.type === 'BUY' ? 'text-buy' : 'text-sell'}">${trade.type}</td>
      <td>$${trade.entryPrice.toFixed(2)} -> $${trade.exitPrice.toFixed(2)}</td>
      <td>${trade.size}</td>
      <td class="${pnlClass}">$${trade.pnl.toFixed(2)} (${trade.pnlPercent.toFixed(2)}%)</td>
      <td>CLOSED</td>
    `;
    tradeHistoryBody.appendChild(tr);
  });

  // Current Open Positions (Could be appended to history box)
  for (const pos of Object.values(portfolio.positions)) {
    const currentPrice = currentChartData[currentChartData.length - 1].close; // Simplification
    let pnl = 0;
    if (pos.type === 'BUY') {
      pnl = (currentPrice - pos.entryPrice) * pos.size;
    } else {
      pnl = (pos.entryPrice - currentPrice) * pos.size;
    }
    const pnlPercent = (pnl / (pos.entryPrice * pos.size)) * 100;
    const pnlClass = pnl > 0 ? 'text-buy' : 'text-sell';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pos.symbol}</td>
      <td class="${pos.type === 'BUY' ? 'text-buy' : 'text-sell'}">${pos.type}</td>
      <td>$${pos.entryPrice.toFixed(2)} -> --</td>
      <td>${pos.size}</td>
      <td class="${pnlClass}">$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)</td>
      <td>OPEN</td>
    `;
    tr.style.background = 'rgba(0, 240, 255, 0.05)';
    tradeHistoryBody.prepend(tr); // Put open positions at top
  }
}

// Handlers
btnBuy.addEventListener('click', () => {
  const size = parseFloat(tradeSizeInput.value);
  const currentPrice = currentChartData[currentChartData.length - 1].close;
  const res = portfolio.executeTrade(activeAsset, 'BUY', currentPrice, size);
  if (res.error) {
    alert(res.error);
  } else {
    updateTradePanel();
    updatePortfolioUI();
    updateHistoryUI(); // Show open position
  }
});

btnSell.addEventListener('click', () => {
  const size = parseFloat(tradeSizeInput.value);
  const currentPrice = currentChartData[currentChartData.length - 1].close;
  const res = portfolio.executeTrade(activeAsset, 'SELL', currentPrice, size);
  if (res.error) {
    alert(res.error);
  } else {
    updateTradePanel();
    updatePortfolioUI();
    updateHistoryUI();
  }
});

btnClose.addEventListener('click', () => {
  const currentPrice = currentChartData[currentChartData.length - 1].close;
  portfolio.closePosition(activeAsset.id, currentPrice);
  updateTradePanel();
  updatePortfolioUI();
  updateHistoryUI();
});

// Periodic UI Refresh for open position PnL inside History table
setInterval(() => {
  if (Object.keys(portfolio.positions).length > 0) {
    updateHistoryUI(); // Updates the "OPEN" row with live PnL
  }
}, 1000);

// Init
init();
