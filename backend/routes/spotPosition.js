const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { openSpotPosition } = require('../services/spotPositionService');
const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    const { spotAssetType, amount, orderType, limitPrice } = req.body;
    const username = req.user.username;

    try {
        const spotPositions = await openSpotPosition(username, spotAssetType, amount, orderType, limitPrice);
        res.json({ spotPositions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;