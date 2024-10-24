const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserPositions, saveUserPositions } = require('../services/positionService');
const { sendPositionOpenEmail, sendPositionClosedEmail, sendPositionTPEmail, sendPositionSLEmail } = require('../utils/email');
const { fetchCurrentMarketPrices } = require('../utils/market');
const router = express.Router();

router.post('/getPositions', authenticateToken, async (req, res) => {
    const username = req.user.username;
    try {
        const positions = await getUserPositions(username);
        if (!positions) {
            return res.status(404).send('User not found');
        }
        res.json(positions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/openFuturesPosition', authenticateToken, async (req, res) => {
    const { futuresAssetType, positionType, orderType, amount, leverage, limitPrice } = req.body;
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

        const currentMarketPrice = currentMarketPrices.find(item => item.assetType === futuresAssetType).price;
        const positionId = Date.now();
        const position = {
            id: positionId,
            assetType: futuresAssetType,
            positionType,
            orderType,
            amount,
            leverage,
            entryPrice: currentMarketPrice,
            limitPrice,
        };

        positions.futuresPositions.push(position);
        await saveUserPositions(username, positions);
        sendPositionOpenEmail(username, position);

        res.json({ futuresPositions: positions.futuresPositions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/closeFuturesPosition', authenticateToken, async (req, res) => {
    const { positionId } = req.body;
    const username = req.user.username;
    try {
        const positions = await getUserPositions(username);
        if (!positions) {
            return res.status(404).send('User not found');
        }

        const positionIndex = positions.futuresPositions.findIndex(pos => pos.id === positionId);
        if (positionIndex === -1) {
            return res.status(404).send('Position not found');
        }

        const closedPosition = positions.futuresPositions.splice(positionIndex, 1)[0];
        const currentMarketPrices = await fetchCurrentMarketPrices();
        if (!currentMarketPrices) {
            return res.status(500).send('Error fetching market price');
        }

        const currentMarketPrice = currentMarketPrices.find(item => item.assetType === closedPosition.assetType).price;
        closedPosition.exitPrice = currentMarketPrice;
        positions.closedFuturesPositions.push(closedPosition);

        await saveUserPositions(username, positions);
        sendPositionClosedEmail(username, closedPosition, currentMarketPrice);

        res.json({ futuresPositions: positions.futuresPositions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/closeSpotPosition', authenticateToken, async (req, res) => {
    const { positionId } = req.body;
    const username = req.user.username;
    try {
        const positions = await getUserPositions(username);
        if (!positions) {
            return res.status(404).send('User not found');
        }

        const positionIndex = positions.spotPositions.findIndex(pos => pos.id === positionId);
        if (positionIndex === -1) {
            return res.status(404).send('Position not found');
        }

        const closedPosition = positions.spotPositions.splice(positionIndex, 1)[0];
        const currentMarketPrices = await fetchCurrentMarketPrices();
        if (!currentMarketPrices) {
            return res.status(500).send('Error fetching market price');
        }

        const currentMarketPrice = currentMarketPrices.find(item => item.assetType === closedPosition.assetType).price;
        closedPosition.exitPrice = currentMarketPrice;
        positions.closedSpotPositions.push(closedPosition);

        await saveUserPositions(username, positions);
        sendPositionClosedEmail(username, closedPosition, currentMarketPrice);

        res.json({ spotPositions: positions.spotPositions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/saveTPSL', authenticateToken, async (req, res) => {
    const { positionId, tp, sl } = req.body;
    const username = req.user.username;
    try {
        const positions = await getUserPositions(username);
        if (!positions) {
            return res.status(404).send('User not found');
        }

        const positionIndex = positions.futuresPositions.findIndex(pos => pos.id === positionId);
        if (positionIndex === -1) {
            return res.status(404).send('Position not found');
        }

        const oldTP = positions.futuresPositions[positionIndex].tp;
        positions.futuresPositions[positionIndex].tp = tp;
        if (oldTP != tp) sendPositionTPEmail(username, positions.futuresPositions[positionIndex]);

        const oldSL = positions.futuresPositions[positionIndex].sl;
        positions.futuresPositions[positionIndex].sl = sl;
        if (oldSL != sl) sendPositionSLEmail(username, positions.futuresPositions[positionIndex]);

        await saveUserPositions(username, positions);
        res.json({ futuresPositions: positions.futuresPositions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;