const express = require('express');
const { fetchCurrentMarketPrices } = require('../utils/market');
const router = express.Router();

router.post('/getCurrentPrice', async (req, res) => {
    try {
        const price = await fetchCurrentMarketPrices();
        if (price !== null) {
            res.json({ currentPrices: price });
        } else {
            res.status(500).json({ error: 'Failed to fetch price. Please try again later.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message || 'Error fetching current price' });
    }
});

router.get('/pairs', async (req, res) => {
    try {
        const response = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');
        const pairs = response.data.symbols.filter(symbol => symbol.contractType === 'PERPETUAL');
        res.json(pairs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching trading pairs' });
    }
});

module.exports = router;