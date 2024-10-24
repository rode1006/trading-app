const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserPositions, saveUserPositions } = require('../services/positionService');
const { fetchCurrentMarketPrices } = require('../utils/market');
const router = express.Router();

router.post('/startTrade', authenticateToken, async (req, res) => {
    const { assetType, positionType, amount } = req.body;
    const username = req.user.username;
    try {
        const positions = await getUserPositions(username);
        if (!positions) {
            return res.status(404).send('User not found');
        }

        const currentMarketPrices = await fetchCurrentMarketPrices();
        if (!currentMarketPrices) {
            return res.status(500).send('Error fetching market price');
        }

        const currentMarketPrice = currentMarketPrices.find(item => item.assetType === assetType).price;
        const positionId = Date.now();
        const position = {
            id: positionId,
            assetType,
            positionType,
            amount,
            entryPrice: currentMarketPrice,
        };

        positions.spotPositions.push(position);
        await saveUserPositions(username, positions);

        res.json({ spotPositions: positions.spotPositions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;