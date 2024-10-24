const User = require('../models/User');

async function loadUsers() {
    try {
        const users = await User.find();
        return users;
    } catch (err) {
        console.error(err.message);
        return [];
    }
}

async function saveUser(user) {
    try {
        await user.save();
    } catch (err) {
        console.error(err.message);
    }
}

module.exports = { loadUsers, saveUser };