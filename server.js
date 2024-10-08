const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());

app.use(express.static('public'));

const usersFilePath = './users.json';
const keysFilePath = './keys.json';
const withdrawalRequestsFilePath = './withdrawal_requests.json';

function loadUsers() {
    if (fs.existsSync(usersFilePath)) {
        return JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    } else {
        return {};
    }
}

function saveUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function loadKeys() {
    if (fs.existsSync(keysFilePath)) {
        return JSON.parse(fs.readFileSync(keysFilePath, 'utf8'));
    } else {
        return [];
    }
}

function saveKeys(keys) {
    fs.writeFileSync(keysFilePath, JSON.stringify(keys, null, 2));
}

// User Registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    let keys = loadKeys();

    if (users[username]) {
        return res.status(400).send('User already exists'); // User already registered
    }

    const hashedPassword = bcrypt.hashSync(password, 8); // Hash the password

    // Check if there are available keys
    if (keys.length === 0) {
        return res.status(500).send('No available keys'); // No available keys
    }

    // Randomly select a key
    const randomIndex = Math.floor(Math.random() * keys.length);
    const selectedKey = keys.splice(randomIndex, 1)[0]; // Remove selected key from list

    users[username] = {
        password: hashedPassword,
        virtualBalance: 0,
        balance: 0, // Initial balance (change if needed)
        privateKey: selectedKey.privateKey,
        address: selectedKey.address
    }; // Save user with initial balance

    saveUsers(users);
    saveKeys(keys); // Save the updated keys list

    // Redirect to login page
    res.json({ redirectTo: '/login.html' });
});

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users[username];

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).send('Invalid credentials'); // Invalid login attempt
    }

    const token = jwt.sign({ username }, 'your_jwt_secret', { expiresIn: '1h' }); // Create a token
    // Respond with token and redirect URL
    res.json({ token, redirectTo: '/futures.html' });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Start the server
app.listen(3000, () => console.log('Server running on port 3000 http://localhost:3000/'));

// Get User Data (Balance, Username, Address, and Private Key)
app.post('/api/getBalance', authenticateToken, (req, res) => {
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];

    if (!user) return res.status(404).send('User not found');

    res.json({
        username,
        balance: user.balance,
        address: user.address,
        // privateKey: user.privateKey
    });
});


async function fetchCurrentMarketPrice() {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
            params: { symbol: 'BTCUSDT' }
        });
        return parseFloat(response.data.price);
    } catch (error) {
        console.error('Error fetching price from Binance:', error);
        return null;
    }
}

app.post('/api/openPosition', authenticateToken, async (req, res) => {
    const { positionType, orderType, amount, leverage, limitPrice } = req.body;
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];
    let orderLimit = 0;

    if(orderType=='limit'){
        orderLimit=1;
        if(user.positions.filter(position => position.orderLimit==1).length==5){
            return res.status(404).send('Limit Orders limited to 5');
        }
    }

    if (!user) return res.status(404).send('User not found');

    if (user.balance < amount) {
        return res.status(400).send('Insufficient balance');
    }

    const currentMarketPrice = await fetchCurrentMarketPrice();

    if (currentMarketPrice === null) {
        return res.status(500).send('Error fetching market price');
    }

    if(orderType=='market')user.balance -= amount; // Deduct the amount from user's balance

    const positionId = Date.now(); // Unique ID for the position (can be replaced with a more robust method)
    const position = {
        id: positionId,
        positionType,
        orderType,
        orderLimit,
        amount,
        leverage,
        tp : 100000000,
        sl : 0,
        limitPrice,
        entryPrice: currentMarketPrice
    };

    // Initialize positions array if not exists
    if (!user.positions) {
        user.positions = [];
    }

    user.positions.push(position);
    saveUsers(users);

    res.json({ positions: user.positions, newBalance: user.balance });
});


app.post('/api/getPositions', authenticateToken, (req, res) => {
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];

    if (!user) return res.status(404).send('User not found');

    res.json({ positions: user.positions });
});

app.post('/api/getCurrentPrice', async (req, res) => {
    try {
        const price = await fetchCurrentMarketPrice();
        if (price !== null) {
            res.json({ currentPrice: price });
        } else {
            res.status(500).json({ error: 'Failed to fetch price. Please try again later.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message || 'Error fetching current price' });
    }
});

app.post('/api/saveTPSL', authenticateToken, async (req, res) => {
    const { positionId, tp, sl } = req.body;
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];

    if (!user) return res.status(404).send('User not found');

    // Find the position to close
    const positionIndex = user.positions.findIndex(pos => pos.id === positionId);
    if (positionIndex === -1) return res.status(404).send('Position not found');

    user.positions[positionIndex].tp=tp;
    user.positions[positionIndex].sl=sl;
    saveUsers(users);
    res.json({ positions: user.positions });
});

app.post('/api/startTrade', authenticateToken, async (req, res) => {
    const { positionId } = req.body;
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];

    if (!user) return res.status(404).send('User not found');

    // Find the position to close
    const positionIndex = user.positions.findIndex(pos => pos.id === positionId);
    if (positionIndex === -1) return res.status(404).send('Position not found');

    user.positions[positionIndex].orderLimit=0;
    user.balance -= user.positions[positionIndex].amount;
    saveUsers(users);
    res.json({ positions: user.positions });
});

app.post('/api/closePosition', authenticateToken, async (req, res) => {
    const { positionId } = req.body;
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];

    if (!user) return res.status(404).send('User not found');

    // Find the position to close
    const positionIndex = user.positions.findIndex(pos => pos.id === positionId);
    if (positionIndex === -1) return res.status(404).send('Position not found');

    const closedPosition = user.positions.splice(positionIndex, 1)[0];

    // Fetch the current market price
    const currentMarketPrice = await fetchCurrentMarketPrice();
    if (currentMarketPrice === null) {
        return res.status(500).send('Error fetching market price');
    }

    // Calculate realized profit or loss
    const priceDiff = (currentMarketPrice - closedPosition.entryPrice) * (closedPosition.positionType === 'Long' ? 1 : -1);
    const profitLoss = closedPosition.amount * closedPosition.leverage * (priceDiff/closedPosition.entryPrice);

    // Update balance
    if(!closedPosition.orderLimit)user.balance += closedPosition.amount + profitLoss; // Add the amount and profit/loss

    // Log the closed position with realized P/L
    if (!user.closedPositions) {
        user.closedPositions = [];
    }
    user.closedPositions.push({
        ...closedPosition,
        exitPrice: currentMarketPrice,
        realizedPL: profitLoss
    });

    saveUsers(users);
    res.json({ positions: user.positions, newBalance: user.balance, profitLoss });
});

app.post('/api/getClosedPositions', authenticateToken, (req, res) => {
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];

    if (!user) return res.status(404).send('User not found');

    res.json({ closedPositions: user.closedPositions });
});

app.post("/api/updatebalance", authenticateToken, (req, res) => {
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];
    
    if (!user) return res.status(404).send('User not found');

    user.virtualBalance = user.balance + parseFloat(req.body.unrealizepl); // Using user.balance directly
    saveUsers(users);
    res.json({ 
        balance: user.balance ,
        virtualBalance: user.virtualBalance
    });
});
