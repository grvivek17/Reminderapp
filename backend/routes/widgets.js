const express = require('express');
const router = express.Router();

// Get Weather Data
router.get('/weather', async (req, res) => {
  try {
    const lat = req.query.lat || '51.5074';
    const lng = req.query.lng || '-0.1278';
    
    // Using Open-Meteo free API
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
    
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      temperature: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed,
      weathercode: data.current_weather.weathercode,
      time: data.current_weather.time
    });
  } catch (error) {
    console.error('Weather widget error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get Nifty 50 Market Data
router.get('/market', async (req, res) => {
  try {
    // Fetch Nifty 50 data from Yahoo Finance
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^NSEI');
    
    if (!response.ok) {
      throw new Error(`Market API returned ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart.result[0];
    
    const currentPrice = result.meta.regularMarketPrice;
    const previousClose = result.meta.previousClose;
    
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    res.json({
      symbol: result.meta.symbol,
      price: currentPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      isPositive: change >= 0
    });
  } catch (error) {
    console.error('Market widget error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

module.exports = router;
