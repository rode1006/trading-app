const User = require('../models/User');

async function getUserBalance(username) {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            username,
            futuresUSDTBalance: user.futuresUSDTBalance,
            spotUSDTBalance: user.spotUSDTBalance,
            address: user.address,
        };
    } catch (err) {
        console.error(err.message);
        return null;
    }
}

async function updateUserBalance(username, futuresUSDTBalance, spotUSDTBalance) {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        user.futuresUSDTBalance = futuresUSDTBalance;
        user.spotUSDTBalance = spotUSDTBalance;
        user.totalUSDTBalance = futuresUSDTBalance + spotUSDTBalance;
        await user.save();
    } catch (err) {
        console.error(err.message);
    }
}

module.exports = { getUserBalance, updateUserBalance };