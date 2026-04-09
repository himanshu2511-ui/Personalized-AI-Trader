import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

let chart = null;
let candlestickSeries = null;
let smaLines = [];

export function initChart(containerElement) {
  chart = createChart(containerElement, {
    autoSize: true,
    layout: {
      background: { type: 'solid', color: 'transparent' },
      textColor: '#8b9bb4',
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
    },
    crosshair: {
      mode: 0,
    },
    rightPriceScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      timeVisible: true,
      secondsVisible: false,
    },
  });

  candlestickSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#00ff88',
    downColor: '#ff3366',
    borderVisible: false,
    wickUpColor: '#00ff88',
    wickDownColor: '#ff3366',
  });

  return chart;
}

export function updateChartData(data) {
  if (!candlestickSeries) return;
  candlestickSeries.setData(data);
}

export function updateChartTick(tick) {
  if (!candlestickSeries) return;
  candlestickSeries.update(tick);
}

export function addSMASeries(data, color, title) {
  if (!chart) return;
  const lineSeries = chart.addSeries(LineSeries, {
    color: color,
    lineWidth: 1,
    title: title,
    crosshairMarkerVisible: false,
  });
  lineSeries.setData(data);
  smaLines.push(lineSeries);
  return lineSeries;
}

export function clearSmaSeries() {
  smaLines.forEach(series => chart.removeSeries(series));
  smaLines = [];
}
