const User = require('../models/User');

async function partialClosePosition(username, positionId, closeAmount) {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }

        const positionIndex = user.futuresPositions.findIndex(pos => pos.id === positionId);
        if (positionIndex === -1) {
            throw new Error('Position not found');
        }

        const position = user.futuresPositions[positionIndex];
        if (position.amount < closeAmount) {
            throw new Error('Close amount exceeds position amount');
        }

        position.amount -= closeAmount;
        if (position.amount === 0) {
            user.futuresPositions.splice(positionIndex, 1);
        }

        await user.save();
        return user.futuresPositions;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
}

module.exports = { partialClosePosition };