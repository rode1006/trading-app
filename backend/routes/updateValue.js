const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { updateValue } = require('../services/updateValueService');
const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    const { field, value } = req.body;
    const username = req.user.username;

    try {
        const updatedUser = await updateValue(username, field, value);
        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;