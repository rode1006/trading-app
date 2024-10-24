const axios = require('axios');

exports.getTradingPairs = async (req, res) => {
    try {
        const endpoint = 'https://api.binance.com/api/v3/ticker/price';
        const response = await axios.get(endpoint);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching trading pairs' });
    }
};

exports.getCandleData = async (req, res) => {
    const { symbol, interval } = req.query;

    if (!symbol || !interval) {
        return res.status(400).json({ error: 'Missing symbol or interval' });
    }

    try {
        const endpoint = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}`;
        const response = await axios.get(endpoint);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching candlestick data' });
    }
};