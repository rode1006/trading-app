// Required libraries for functionality
const express = require("express"); // Web framework
const bodyParser = require("body-parser"); // Middleware for parsing request bodies
const bcrypt = require("bcryptjs"); // Library for hashing passwords
const jwt = require("jsonwebtoken"); // Library for generating JSON Web Tokens
const fs = require("fs"); // File system interactions
const nodemailer = require("nodemailer"); // Email sending library
const cors = require("cors"); // Middleware for enabling CORS (Cross-Origin Resource Sharing)
const axios = require("axios"); // Promise-based HTTP client
const app = express(); // Create an instance of express
const assetTypes = ["BTC", "ETH", "BNB", "NEO", "LTC", "SOL", "XRP", "DOT"]; // Supported asset types

// Mexc API URLs for fetching prices
const FUTURES_PRICE_API_URL = "https://contract.mexc.com/api/v1/contract/ticker"; // Futures prices
const SPOT_PRICE_API_URL = "https://www.mexc.com/open/api/v2/market/ticker"; // Spot market prices

// Initialize currency prices storage
let futuresCurrencyPrices = [];
let spotCurrencyPrices = [];

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from 'public' directory

// File paths for users, keys, and withdrawal requests data
const usersFilePath = "./users.json";
const keysFilePath = "./keys.json";
const withdrawalRequestsFilePath = "./withdrawal_requests.json";

// Load users from the JSON file
function loadUsers() {
  if (fs.existsSync(usersFilePath)) {
    return JSON.parse(fs.readFileSync(usersFilePath, "utf8")); // Parse and return user data
  } else {
    return {}; // Return an empty object if no users exist
  }
}

// Save users to the JSON file
function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2)); // Write users data as JSON
}

// Load API keys from the JSON file
function loadKeys() {
  if (fs.existsSync(keysFilePath)) {
    return JSON.parse(fs.readFileSync(keysFilePath, "utf8")); // Parse and return keys
  } else {
    return []; // Return an empty array if no keys exist
  }
}

// Save API keys to the JSON file
function saveKeys(keys) {
  fs.writeFileSync(keysFilePath, JSON.stringify(keys, null, 2)); // Write keys data as JSON
}

// Load withdrawal requests from the JSON file
function loadWithdrawalRequests() {
  if (fs.existsSync(withdrawalRequestsFilePath)) {
    return JSON.parse(fs.readFileSync(withdrawalRequestsFilePath, "utf8")); // Parse and return requests
  } else {
    return []; // Return empty array if no requests exist
  }
}

// Save withdrawal requests to the JSON file
function saveWithdrawalRequests(requests) {
  fs.writeFileSync(
    withdrawalRequestsFilePath,
    JSON.stringify(requests, null, 2) // Write requests data as JSON
  );
}

// Nodemailer configuration for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // Email service provider
  auth: {
    user: "gagenikolov50@gmail.com", // Admin email (change as necessary)
    pass: "ijif cbht ohua xzh", // Password (use environment variables in production)
  },
});

// Function to send emails via the configured transporter
function transporterSendMail(mailOptions) {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error); // Log error if it occurs
    } else {
      console.log("Email sent:", info.response); // Log sent email response
    }
  });
}

// Helper function to send withdrawal request emails
function sendWithdrawalEmail(username, address, amount) {
  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Admin email
    to: "gagenikolov.z@gmail.com", // Recipient email
    subject: "New Withdrawal Request", // Email subject
    text: `User ${username} has requested a withdrawal on the exchange. Amount: ${amount} Address: ${address}`, // Email body
  };
  transporterSendMail(mailOptions); // Send the email
}

// Helper function to send emails when a position is opened
function sendPositionOpenEmail(username, position) {
  let liquidationPrice = 0;
  // Calculate liquidation price based on position type (Long/Short)
  if (position.positionType == "Short")
    liquidationPrice =
      (position.entryPrice * (125 + position.leverage / 100)) / 125;
  if (position.positionType == "Long")
    liquidationPrice =
      (position.entryPrice * (125 - 100 / position.leverage)) / 125;

  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Admin email
    to: "gagenikolov.z@gmail.com", // Recipient email
    subject: "New Position Opened", // Email subject
    text: `${position.id} user ${username} opened ${position.positionType} ${position.orderType} ${position.assetType} Amount: ${position.amount} Leverage: ${position.leverage} Entry: ${position.entryPrice} Liquidation: ${liquidationPrice}`, // Email body
  };
  transporterSendMail(mailOptions); // Send the email
}

// Helper function for sending TP setting emails
function sendPositionTPEmail(username, position) {
  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Admin email
    to: "gagenikolov.z@gmail.com", // Recipient email
    subject: "Position TP setted", // Email subject
    text: ` ${position.id} user ${username} set tp ${position.tp}`, // Email body
  };
  transporterSendMail(mailOptions); // Send the email
}

// Helper function for sending SL setting emails
function sendPositionSLEmail(username, position) {
  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Admin email
    to: "gagenikolov.z@gmail.com", // Recipient email
    subject: "Position SL setted", // Email subject
    text: ` ${position.id} user ${username} set sl ${position.sl}`, // Email body
  };
  transporterSendMail(mailOptions); // Send the email
}

// Helper function for sending position closing emails
function sendPositionClosedEmail(username, position, exitPrice) {
  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Admin email
    to: "gagenikolov.z@gmail.com", // Recipient email
    subject: "Position closed", // Email subject
    text: ` ${position.id} user ${username} closes position, Exit price: ${exitPrice}`, // Email body
  };
  transporterSendMail(mailOptions); // Send the email
}

// Helper function for sending position partial closing emails
function sendPositionPartialClosedEmail(username, position, exitPrice) {
  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Admin email
    to: "gagenikolov.z@gmail.com", // Recipient email
    subject: "Position partially closed", // Email subject
    text: ` ${position.id} user ${username} partially closes position, Exit price: ${exitPrice}`, // Email body
  };
  transporterSendMail(mailOptions); // Send the email
}

// Function to fetch current market prices (either futures or spot)
async function fetchCurrentMarketPrices(accountType) {
  let response;

  // Fetch futures prices if accountType is 'futures'
  if (accountType == "futures") {
    try {
      response = await axios.get(FUTURES_PRICE_API_URL); // Get data from the API
      const prices = response.data.data
        .filter(
          (item) =>
            assetTypes.includes(item.symbol.split("_")[0]) && // Check if asset type is valid
            item.symbol.split("_")[1] == "USDT" // Check if currency is USDT
        )
        .map((item) => ({
          assetType: item.symbol.split("_")[0], // Extract asset type
          price: parseFloat(item.lastPrice), // Get price as float
        }));

      futuresCurrencyPrices = prices; // Store prices for futures
      return prices; // Return the prices
    } catch (error) {
      console.error("Error fetching data from Mexc API:", error); // Log error
      return futuresCurrencyPrices; // Return previously fetched prices
    }
  } 
  // Fetch spot prices if accountType is 'spot'
  else if (accountType == "spot") {
    try {
      response = await axios.get(SPOT_PRICE_API_URL); // Get data from the API
      const prices = response.data.data
        .filter(
          (item) =>
            assetTypes.includes(item.symbol.split("_")[0]) && // Check if asset type is valid
            item.symbol.split("_")[1] == "USDT" // Check if currency is USDT
        )
        .map((item) => ({
          assetType: item.symbol.split("_")[0], // Extract asset type
          price: parseFloat(item.last), // Get price as float
        }));

      spotCurrencyPrices = prices; // Store prices for spot
      return prices; // Return the prices
    } catch (error) {
      console.error("Error fetching data from Mexc API:", error); // Log error
      return spotCurrencyPrices; // Return previously fetched prices
    }
  } else {
    console.error("Error fetching data from Mexc API: bad request:", error); // Log error for invalid accountType
  }
}

// Endpoint to handle withdrawal request
app.post("/api/withdrawRequest", authenticateToken, (req, res) => {
  const { address, amount } = req.body; // Extract address and amount from request body
  const username = req.user.username; // Get authenticated username

  // Log the withdrawal request
  let withdrawalRequests = loadWithdrawalRequests(); // Load existing withdrawal requests
  withdrawalRequests.push({
    username,
    address,
    amount,
    date: new Date().toISOString(), // Add the request date
  });
  saveWithdrawalRequests(withdrawalRequests); // Save the updated requests

  // Send email notification to the admin
  sendWithdrawalEmail(username, address, amount);

  res.sendStatus(200); // Respond with success
});

// User Registration Endpoint
app.post("/register", (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body
  const users = loadUsers(); // Load existing users
  let keys = loadKeys(); // Load available keys

  if (users[username]) {
    return res.status(400).send("User already exists"); // User already registered
  }

  const hashedPassword = bcrypt.hashSync(password, 8); // Hash the password

  // Check for available API keys
  if (keys.length === 0) {
    return res.status(500).send("No available keys"); // No available keys for registration
  }

  // Randomly select an API key for the user
  const randomIndex = Math.floor(Math.random() * keys.length);
  const selectedKey = keys.splice(randomIndex, 1)[0]; // Remove selected key from list

  // Save the new user data
  users[username] = {
    password: hashedPassword,
    totalValue: 0,
    totalUSDTBalance: 0,
    futuresValue: 0,
    futuresUSDTBalance: 0,
    spotValue: 0,
    spotUSDTBalance: 0,
    privateKey: selectedKey.privateKey,
    address: selectedKey.address,
  }; // Save user with initial balance and keys

  saveUsers(users); // Persist users data
  saveKeys(keys); // Persist updated keys list

  // Respond with a redirect to the login page
  res.json({ redirectTo: "/login.html" });
});

// User Login Endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body; // Extract username and password
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get user by username

  // Validate credentials
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).send("Invalid credentials"); // Invalid login attempt
  }

  const token = jwt.sign({ username }, "your_jwt_secret", { expiresIn: "1h" }); // Create a JWT token
  // Respond with token and redirect URL for successful login
  res.json({ token, redirectTo: "/trading.html" });
});

// Middleware for authenticating JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]; // Get auth header
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from header

  if (token == null) return res.sendStatus(401); // Unauthorized if no token

  // Verify the token
  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden if token verification fails
    req.user = user; // Attach user info to request object
    next(); // Proceed to next middleware
  });
}

// Start server and listen on port 3000
app.listen(3000, () =>
  console.log("Server running on port 3000 http://localhost:3000/")
);

// Get User Data Endpoint (Balance, Username, Address, and Private Key)
app.post("/api/getBalance", authenticateToken, (req, res) => {
  const username = req.user.username; // Get username from request
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // Return error if no user found

  // Send user balance and address information
  res.json({
    username,
    futuresUSDTBalance: user.futuresUSDTBalance,
    spotUSDTBalance: user.spotUSDTBalance,
    address: user.address,
    // privateKey: user.privateKey // Uncomment if privateKey needs to be sent
  });
});

// Open Futures Position Endpoint
app.post("/api/openFuturesPosition", authenticateToken, async (req, res) => {
  const {
    futuresAssetType,
    positionType,
    orderType,
    amount,
    leverage,
    limitPrice,
  } = req.body; // Extract request parameters
  const username = req.user.username; // Get authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user
  let orderLimit = 0; // Initialize order limit

  // Set order limit based on order type
  if (orderType == "limit") orderLimit = 1;
  
  // Check limit orders count if order is a limit type
  if (orderType == "limit" && user.futuresPositions) {
    if (
      user.futuresPositions.filter((position) => position.orderLimit == 1) 
        .length == 5 // Limit orders capped at 5
    ) {
      return res.status(404).send("Limit Orders limited to 5");
    }
  }

  if (!user) return res.status(404).send("User not found"); // User not found

  // Check user balance for sufficient funds
  if (user.futuresUSDTBalance < amount) {
    return res.status(400).send("Insufficient balance"); // Insufficient funds
  }

  const currentMarketPrices = await fetchCurrentMarketPrices("futures"); // Fetch current market prices

  // Verify if fetching market prices returned successfully
  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price"); // Internal server error
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == futuresAssetType
  )[0].price; // Get current market price for the asset type
  
  user.futuresUSDTBalance -= amount; // Deduct the amount from user's balance

  const positionId = Date.now(); // Unique ID for the position
  let tp = 0; // Initialize take profit
  let sl = 0; // Initialize stop loss

  // Set take profit and stop loss based on position type
  if (positionType == "Long") {
    tp = 100000000;
    sl = 0;
  }
  if (positionType == "Short") {
    tp = 0;
    sl = 100000000;
  }

  const position = { // Create a new position object
    id: positionId,
    assetType: futuresAssetType,
    positionType,
    orderType,
    orderLimit,
    amount,
    leverage,
    tp,
    sl,
    limitPrice,
    entryPrice: currentMarketPrice, // Log entry price
  };

  // Initialize positions array if it doesn't exist
  if (!user.futuresPositions) {
    user.futuresPositions = [];
  }

  user.futuresPositions.push(position); // Add the new position to user's positions
  saveUsers(users); // Persist users data
  sendPositionOpenEmail(username, position); // Notify admin of position opening

  // Respond with current positions and updated balance
  res.json({
    futuresPositions: user.futuresPositions,
    newfuturesUSDTBalance: user.futuresUSDTBalance,
  });
});

// Open Spot Position Endpoint
app.post("/api/openSpotPosition", authenticateToken, async (req, res) => {
  const { spotAssetType, positionType, orderType, amount, limitPrice } =
    req.body; // Extract request parameters
  const username = req.user.username; // Get authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user
  let orderLimit = 0; // Initialize order limit

  // Check order type and order limit constraints
  if (orderType == "limit") orderLimit = 1;
  if (orderType == "limit" && user.spotPositions) {
    if (
      user.spotPositions.filter((position) => position.orderLimit == 1).length == 5 // Limit orders capped at 5
    ) {
      return res.status(404).send("Limit Orders limited to 5");
    }
  }

  if (!user) return res.status(404).send("User not found"); // User not found

  const currentMarketPrices = await fetchCurrentMarketPrices("spot"); // Fetch current market prices

  // Verify if fetching market prices returned successfully
  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price"); // Internal server error
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == spotAssetType
  )[0].price; // Get current market price for the asset type

  // Update user balances based on position type (buy/sell)
  if (positionType == "buy") {
    if (user.spotUSDTBalance < amount * currentMarketPrice) {
      return res.status(400).send("Insufficient balance"); // Insufficient funds
    }
    user.spotUSDTBalance -= amount * currentMarketPrice; // Deduct the amount from user's balance
  }

  if (positionType == "sell") {
    user.spotUSDTBalance += amount * currentMarketPrice; // Add to balance
  }

  const positionId = Date.now(); // Unique ID for the position

  const position = { // Create a new position object
    id: positionId,
    assetType: spotAssetType,
    positionType,
    orderType,
    orderLimit,
    amount,
    limitPrice,
    entryPrice: currentMarketPrice, // Log entry price
  };

  // Initialize positions array if it doesn't exist
  if (!user.spotPositions) {
    user.spotPositions = [];
  }

  if (!user.closedSpotPositions) {
    user.closedSpotPositions = []; // Initialize closed positions array if doesn't exist
  }

  // Handle newly opened (buy) or closed (sell) positions
  if (position.positionType == 'buy') {
    user.spotPositions.push(position); // Add the new position to user's positions
    sendPositionOpenEmail(username, position); // Notify admin of position opening
  }

  if (position.positionType == 'sell') {
    user.closedSpotPositions.push(position); // Add to closed positions
    sendPositionClosedEmail(username, position, currentMarketPrice); // Notify admin of position closing
  }
  
  saveUsers(users); // Persist users data

  // Respond with current positions and updated balance
  res.json({
    spotPositions: user.spotPositions,
    newspotUSDTBalance: user.spotUSDTBalance,
  });
});

// Get User Positions Endpoint
app.post("/api/getPositions", authenticateToken, (req, res) => {
  const username = req.user.username; // Get the authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // User not found

  // Respond with user's current positions
  res.json({
    futuresPositions: user.futuresPositions,
    closedFuturesPositions: user.closedFuturesPositions,
    spotPositions: user.spotPositions,
    closedSpotPositions: user.closedSpotPositions,
  });
});

// Current Price Endpoint
app.post("/api/getCurrentPrice", async (req, res) => {
  const accountType = req.body.accountType; // Extract account type from request body
  try {
    const price = await fetchCurrentMarketPrices(accountType); // Fetch current prices
    if (price !== null) {
      res.json({ currentPrices: price }); // Respond with current prices
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch price. Please try again later." }); // Error fetching prices
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error fetching current price" }); // General error response
  }
});

// Save Take Profit and Stop Loss Endpoint
app.post("/api/saveTPSL", authenticateToken, async (req, res) => {
  const { positionId, tp, sl } = req.body; // Extract position ID, TP, and SL from request body
  const username = req.user.username; // Get authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // User not found

  // Find the position to update
  const positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) return res.status(404).send("Position not found"); // Position not found

  const oldTP = user.futuresPositions[positionIndex].tp; // Store old take profit value
  user.futuresPositions[positionIndex].tp = tp; // Set new take profit value
  if (oldTP != tp)
    sendPositionTPEmail(username, user.futuresPositions[positionIndex]); // Notify admin if TP changed

  const oldSL = user.futuresPositions[positionIndex].sl; // Store old stop loss value
  user.futuresPositions[positionIndex].sl = sl; // Set new stop loss value
  if (oldSL != sl)
    sendPositionSLEmail(username, user.futuresPositions[positionIndex]); // Notify admin if SL changed

  saveUsers(users); // Persist users data
  res.json({ futuresPositions: user.futuresPositions }); // Respond with updated positions
});

// Start Trade Endpoint
app.post("/api/startTrade", authenticateToken, async (req, res) => {
  const { positionId } = req.body; // Extract position ID from request body
  const username = req.user.username; // Get authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // User not found

  // Find the position to start trading
  let positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) {
    positionIndex = user.spotPositions.findIndex(
      (pos) => pos.id === positionId
    );
    if (positionIndex === -1) return res.status(404).send("Position not found"); // Position not found
    user.spotPositions[positionIndex].orderLimit = 0; // Clear order limit for spot positions
  } else {
    user.futuresPositions[positionIndex].orderLimit = 0; // Clear order limit for futures positions
  }

  saveUsers(users); // Persist users data
  res.json({
    futuresPositions: user.futuresPositions,
    spotPositions: user.spotPositions,
  });
});

// Close Futures Position Endpoint
app.post("/api/closeFuturesPosition", authenticateToken, async (req, res) => {
  const { positionId, reason } = req.body; // Extract position ID and reason from request body
  const username = req.user.username; // Get authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // User not found

  // Find the position to close
  const positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) return res.status(404).send("Position not found"); // Position not found

  const closedPosition = user.futuresPositions.splice(positionIndex, 1)[0]; // Remove and store the closed position

  // Fetch the current market price
  const currentMarketPrices = await fetchCurrentMarketPrices("futures");
  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price"); // Internal server error
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == closedPosition.assetType
  )[0].price; // Get the current market price for the asset type

  // Calculate realized profit or loss based on closing position
  const priceDiff =
    (currentMarketPrice - closedPosition.entryPrice) *
    (closedPosition.positionType === "Long" ? 1 : -1);
  let profitLoss =
    closedPosition.amount *
    closedPosition.leverage *
    (priceDiff / closedPosition.entryPrice);

  // Set profit/loss to zero if the position was a limit order
  if (closedPosition.orderLimit) profitLoss = 0;

  // Adjust profit/loss based on reason for closure
  if (reason == 3) profitLoss = -closedPosition.amount; // liquidated
  user.futuresUSDTBalance += closedPosition.amount + profitLoss; // Update user's balance based on closure

  // Log the closed position with realized P/L
  if (!user.closedFuturesPositions) {
    user.closedFuturesPositions = []; // Initialize array if not exists
  }
  user.closedFuturesPositions.push({
    ...closedPosition,
    exitPrice: currentMarketPrice, // Log exit price
    realizedPL: profitLoss, // Log realized profit/loss
    closedReason: reason, // Log closure reason
  });

  sendPositionClosedEmail(username, closedPosition, currentMarketPrice); // Notify admin of position closure

  saveUsers(users); // Persist users data
  res.json({
    futuresPositions: user.futuresPositions,
    newFuturesUSDTBalance: user.futuresUSDTBalance,
    profitLoss, // Respond with realized profit/loss
  });
});

// Close Spot Position Endpoint
app.post("/api/closeSpotPosition", authenticateToken, async (req, res) => {
  const { positionId } = req.body; // Extract position ID from request body
  const username = req.user.username; // Get authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // User not found

  // Find the position to close
  const positionIndex = user.spotPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) return res.status(404).send("Position not found"); // Position not found

  const closedPosition = user.spotPositions.splice(positionIndex, 1)[0]; // Remove and store the closed position

  // Ensure positions can't be closed if they weren't limit orders
  if (!closedPosition.orderLimit)
    return res
      .status(400)
      .send("Open position can't be closed in spot trading"); // Cannot close open positions if order is not limit

  // Fetch the current market price
  const currentMarketPrices = await fetchCurrentMarketPrices("spot");
  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price"); // Internal server error
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == closedPosition.assetType
  )[0].price; // Get the current market price for the asset type

  // Update user balance based on position type (buy/sell)
  if (closedPosition.positionType == "buy") {
    user.spotUSDTBalance += closedPosition.amount * closedPosition.entryPrice; // For buy, return amount to the balance
  }
  if (closedPosition.positionType == "sell") {
    user.spotUSDTBalance -= closedPosition.amount * closedPosition.entryPrice; // For sell, subtract sell amount from the balance
  }

  // Log the closed position
  if (!user.closedSpotPositions) {
    user.closedSpotPositions = []; // Initialize array if not exists
  }
  user.closedSpotPositions.push({
    ...closedPosition,
    exitPrice: currentMarketPrice, // Log exit price
  });

  sendPositionClosedEmail(username, closedPosition, currentMarketPrice); // Notify admin of position closure

  saveUsers(users); // Persist users data
  // Respond with user's positions and updated balance
  res.json({
    spotPositions: user.spotPositions,
    newSpotUSDTBalance: user.spotUSDTBalance,
  });
});

// Partial Close Position Endpoint
app.post("/api/partialClosePosition", authenticateToken, async (req, res) => {
  const { positionId, percent } = req.body; // Extract position ID and percentage from request body
  const username = req.user.username; // Get authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user
  const reason = 4; // Reason for partial closing

  if (!user) return res.status(404).send("User not found"); // User not found

  // Find the position to partially close
  const positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) return res.status(404).send("Position not found"); // Position not found

  const closedPosition = user.futuresPositions[positionIndex]; // Get the position to partially close

  // Fetch the current market price
  const currentMarketPrices = await fetchCurrentMarketPrices("futures");
  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price"); // Internal server error
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == closedPosition.assetType
  )[0].price; // Get the current market price for the asset type

  // Calculate realized profit or loss for the partial close
  const priceDiff =
    (currentMarketPrice - closedPosition.entryPrice) *
    (closedPosition.positionType === "Long" ? 1 : -1);
  let profitLoss =
    ((closedPosition.amount * percent) / 100) *
    closedPosition.leverage *
    (priceDiff / closedPosition.entryPrice); // Calculate profit/loss

  // Set profit/loss to zero if the position was a limit order
  if (closedPosition.orderLimit) profitLoss = 0;

  // Update user balance with the realized P/L from the partial close
  user.futuresUSDTBalance +=
    (closedPosition.amount * percent) / 100 + profitLoss; // Adjust balance
  closedPosition.amount *= percent / 100; // Reduce the amount of the closed position

  // Log closed partial position with realized P/L
  if (!user.closedFuturesPositions) {
    user.closedFuturesPositions = []; // Initialize array if not exists
  }
  user.closedFuturesPositions.push({
    ...closedPosition,
    exitPrice: currentMarketPrice, // Log exit price
    realizedPL: profitLoss, // Log realized profit/loss
    closedReason: reason, // Log closure reason
  });

  // Update remaining position amount
  user.futuresPositions[positionIndex].amount *= (100 - percent) / 100;

  sendPositionPartialClosedEmail(username, closedPosition, currentMarketPrice); // Notify admin of partial closure

  saveUsers(users); // Persist users data
  // Respond with user's positions and updated balance
  res.json({
    futuresPositions: user.futuresPositions,
    newfuturesUSDTBalance: user.futuresUSDTBalance,
    profitLoss, // Respond with realized profit/loss
  });
});

// Update User Value Endpoint
app.post("/api/updateValue", authenticateToken, (req, res) => {
  const username = req.user.username; // Get the authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // User not found

  // Update user's financial values
  user.futuresValue =
    user.futuresUSDTBalance +
    parseFloat(req.body.futuresPositionsAmount) + // Include positions amount
    parseFloat(req.body.futuresUnrealizedPL); // Include unrealized P/L
  user.spotValue = parseFloat(req.body.spotValue); // Update spot value
  user.totalValue = parseFloat(req.body.totalValue); // Update total value
  user.totalUSDTBalance = user.futuresUSDTBalance + user.spotUSDTBalance; // Calculate total USDT balance
  saveUsers(users); // Persist users data
  // Respond with updated values
  res.json({
    futuresValue: user.futuresValue,
    spotValue: user.spotValue,
  });
});

// Update User Balance Endpoint
app.post("/api/updateBalance", authenticateToken, (req, res) => {
  const username = req.user.username; // Get the authenticated username
  const users = loadUsers(); // Load existing users
  const user = users[username]; // Get the specific user

  if (!user) return res.status(404).send("User not found"); // User not found

  // Update user's balance
  user.futuresUSDTBalance = parseFloat(req.body.futuresUSDTBalance); // Update futures balance
  user.spotUSDTBalance = parseFloat(req.body.spotUSDTBalance); // Update spot balance
  user.totalUSDTBalance = user.futuresUSDTBalance + user.spotUSDTBalance; // Calculate total USDT balance
  saveUsers(users); // Persist users data
  // Respond with updated balances
  res.json({
    futuresUSDTBalance: user.futuresUSDTBalance,
    spotUSDTBalance: user.spotUSDTBalance,
  });
});