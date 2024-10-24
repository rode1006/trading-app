const axios = require('axios');
const assetTypes = ["BTC", "ETH", "BNB", "NEO", "LTC", "SOL", "XRP", "DOT"];

async function fetchCurrentMarketPrices() {
    try {
        const promises = assetTypes.map(async (assetType) => {
            const response = await axios.get(
                'https://api.binance.com/api/v3/ticker/price',
                {
                    params: { symbol: assetType + 'USDT' },
                }
            );
            return { assetType, price: parseFloat(response.data.price) };
        });

        const results = await Promise.all(promises);
        return results;
    } catch (error) {
        console.error('Error fetching prices from Binance:', error);
        return null;
    }
}

async function fetchCandles(symbol, interval) {
    try {
        const response = await axios.get(
            'https://api.binance.com/api/v3/klines',
            {
                params: { symbol, interval },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching candles from Binance:', error);
        return null;
    }
}

module.exports = { fetchCurrentMarketPrices, fetchCandles };