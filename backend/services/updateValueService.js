const User = require('../models/User');

async function updateValue(username, field, value) {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        user[field] = value;
        await user.save();
        return user;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
}

module.exports = { updateValue };