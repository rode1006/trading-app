const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { partialClosePosition } = require('../services/partialClosePositionService');
const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    const { positionId, closeAmount } = req.body;
    const username = req.user.username;

    try {
        const futuresPositions = await partialClosePosition(username, positionId, closeAmount);
        res.json({ futuresPositions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;