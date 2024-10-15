const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const nodemailer = require("nodemailer");
const axios = require("axios");
const app = express();
const assetTypes = ["BTC", "ETH", "BNB", "NEO", "LTC", "SOL", "XRP", "DOT"];

app.use(bodyParser.json());

app.use(express.static("public"));

const usersFilePath = "./users.json";
const keysFilePath = "./keys.json";
const withdrawalRequestsFilePath = "./withdrawal_requests.json";

function loadUsers() {
  if (fs.existsSync(usersFilePath)) {
    return JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
  } else {
    return {};
  }
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function loadKeys() {
  if (fs.existsSync(keysFilePath)) {
    return JSON.parse(fs.readFileSync(keysFilePath, "utf8"));
  } else {
    return [];
  }
}

function saveKeys(keys) {
  fs.writeFileSync(keysFilePath, JSON.stringify(keys, null, 2));
}
//=============================================================================================
// Load withdrawal requests from file
function loadWithdrawalRequests() {
  if (fs.existsSync(withdrawalRequestsFilePath)) {
    return JSON.parse(fs.readFileSync(withdrawalRequestsFilePath, "utf8"));
  } else {
    return []; // Return empty array if no data file exists
  }
}
// Save withdrawal requests to file
function saveWithdrawalRequests(requests) {
  fs.writeFileSync(
    withdrawalRequestsFilePath,
    JSON.stringify(requests, null, 2)
  );
}
//============================================================================================
// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // Use the email provider of your choice
  auth: {
    user: "gagenikolov50@gmail.com", // Replace with your admin email
    pass: "ijif cbht ohua xzh", // Replace with your email password (use environment variables in production)
  },
});
// Transporter sendMail function
function transporterSendMail(mailOptions) {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}
// Send email with withdrawal request
function sendWithdrawalEmail(username, address, amount) {
  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Replace with your admin email
    to: "gagenikolov.z@gmail.com", // Replace with the recipient (admin) email
    subject: "New Withdrawal Request",
    text: `User ${username} has requested a withdrawal on the exchange. Amount: ${amount} Address: ${address}`,
  };
  transporterSendMail(mailOptions);
}
// Send email with position opening
function sendPositionOpenEmail(username, position) {
  let liquidationPrice = 0;
  if (position.positionType == "Short")
    liquidationPrice =
      (position.entryPrice * (125 + position.leverage / 100)) / 125;
  if (position.positionType == "Long")
    liquidationPrice =
      (position.entryPrice * (125 - 100 / position.leverage)) / 125;
  const mailOptions = {
    from: "gagenikolov50@gmail.com", // Replace with your admin email
    to: "gagenikolov.z@gmail.com", // Replace with the recipient (admin) email
    subject: "New Position Opened",
    text: `${position.id} user ${username} opened ${position.positionType} ${position.orderType} ${position.assetType} Amount: ${position.amount} Leverage: ${position.leverage} Entry: ${position.entryPrice} Liquidation: ${liquidationPrice}`,
  };
  transporterSendMail(mailOptions);
}
// Send email with position setting TP
function sendPositionTPEmail(username, position) {
    const mailOptions = {
        from: "gagenikolov50@gmail.com", // Replace with your admin email
        to: "gagenikolov.z@gmail.com", // Replace with the recipient (admin) email
        subject: "Position TP setted",
        text: ` ${position.id} user ${username} set sl ${position.tp}`,
    };
    transporterSendMail(mailOptions);
}
// Send email with position setting SL
function sendPositionSLEmail(username, position) {
    const mailOptions = {
        from: "gagenikolov50@gmail.com", // Replace with your admin email
        to: "gagenikolov.z@gmail.com", // Replace with the recipient (admin) email
        subject: "Position SL setted",
        text: ` ${position.id} user ${username} set sl ${position.sl}`,
    };
    transporterSendMail(mailOptions);
}
// Send email with position closing
function sendPositionClosedEmail(username, position, exitPrice) {
    const mailOptions = {
        from: "gagenikolov50@gmail.com", // Replace with your admin email
        to: "gagenikolov.z@gmail.com", // Replace with the recipient (admin) email
        subject: "Position closed",
        text: ` ${position.id} user ${username} closes position, Exit price: ${exitPrice}`,
    };
    transporterSendMail(mailOptions);
}
//===============================================================================================
// Withdrawal Request API
app.post("/api/withdrawRequest", authenticateToken, (req, res) => {
  const { address, amount } = req.body;
  const username = req.user.username; // Use the authenticated username

  // Log the withdrawal request
  let withdrawalRequests = loadWithdrawalRequests();
  withdrawalRequests.push({
    username,
    address,
    amount,
    date: new Date().toISOString(),
  });
  saveWithdrawalRequests(withdrawalRequests);

  // Send email to admin
  sendWithdrawalEmail(username, address, amount);

  res.sendStatus(200); // Respond with success
});

// User Registration
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  let keys = loadKeys();

  if (users[username]) {
    return res.status(400).send("User already exists"); // User already registered
  }

  const hashedPassword = bcrypt.hashSync(password, 8); // Hash the password

  // Check if there are available keys
  if (keys.length === 0) {
    return res.status(500).send("No available keys"); // No available keys
  }

  // Randomly select a key
  const randomIndex = Math.floor(Math.random() * keys.length);
  const selectedKey = keys.splice(randomIndex, 1)[0]; // Remove selected key from list

  users[username] = {
    password: hashedPassword,
    totalValue: 0,
    futuresValue: 0,
    futuresUSDTBalance: 0,
    spotValue: 0,
    spotUSDTBalance: 0,
    privateKey: selectedKey.privateKey,
    address: selectedKey.address,
  }; // Save user with initial balance

  saveUsers(users);
  saveKeys(keys); // Save the updated keys list

  // Redirect to login page
  res.json({ redirectTo: "/login.html" });
});

// User Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users[username];

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).send("Invalid credentials"); // Invalid login attempt
  }
  const token = jwt.sign({ username }, "your_jwt_secret", { expiresIn: "1h" }); // Create a token
  // Respond with token and redirect URL
  res.json({ token, redirectTo: "/trading.html" });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Start the server
app.listen(3000, () =>
  console.log("Server running on port 3000 http://localhost:3000/")
);

// Get User Data (Balance, Username, Address, and Private Key)
app.post("/api/getBalance", authenticateToken, (req, res) => {
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];

  if (!user) return res.status(404).send("User not found");

  res.json({
    username,
    futuresUSDTBalance: user.futuresUSDTBalance,
    spotUSDTBalance: user.spotUSDTBalance,
    address: user.address,
    // privateKey: user.privateKey
  });
});

async function fetchCurrentMarketPrices() {
  try {
    const promises = assetTypes.map(async (assetType) => {
      const response = await axios.get(
        "https://api.binance.com/api/v3/ticker/price",
        {
          params: { symbol: assetType + "USDT" },
        }
      );
      return { assetType, price: parseFloat(response.data.price) };
    });

    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Error fetching prices from Binance:", error);
    return null;
  }
}

app.post("/api/openFuturesPosition", authenticateToken, async (req, res) => {
  const { futuresAssetType, positionType, orderType, amount, leverage, limitPrice } =
    req.body;
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];
  let orderLimit = 0;

  if (orderType == "limit") orderLimit=1;
  if (orderType == "limit" && user.futuresPositions) {
    if (
      user.futuresPositions.filter((position) => position.orderLimit == 1).length == 5
    ) {
      return res.status(404).send("Limit Orders limited to 5");
    }
  }

  if (!user) return res.status(404).send("User not found");

  if (user.futuresUSDTBalance < amount) {
    return res.status(400).send("Insufficient balance");
  }

  const currentMarketPrices = await fetchCurrentMarketPrices();

  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price");
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == futuresAssetType
  )[0].price;
  // if(orderType=='market')user.futuresUSDTBalance -= amount; // Deduct the amount from user's balance
  user.futuresUSDTBalance -= amount; // Deduct the amount from user's balance

  const positionId = Date.now(); // Unique ID for the position (can be replaced with a more robust method)
  let tp = 0;
  let sl = 0;
  if (positionType == "Long") {
    tp = 100000000;
    sl = 0;
  }
  if (positionType == "Short") {
    tp = 0;
    sl = 100000000;
  }
  const position = {
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
    entryPrice: currentMarketPrice,
  };

  // Initialize positions array if not exists
  if (!user.futuresPositions) {
    user.futuresPositions = [];
  }

  user.futuresPositions.push(position);
  saveUsers(users);
  sendPositionOpenEmail(username, position);

  res.json({ futuresPositions: user.futuresPositions, newfuturesUSDTBalance: user.futuresUSDTBalance });
});

app.post("/api/openSpotPosition", authenticateToken, async (req, res) => {
    const { spotAssetType, positionType, orderType, amount, limitPrice } =
      req.body;
    const username = req.user.username;
    const users = loadUsers();
    const user = users[username];
    let orderLimit = 0;
  
    if (orderType == "limit") orderLimit=1;
    if (orderType == "limit" && user.spotPositions) {
      if (
        user.spotPositions.filter((position) => position.orderLimit == 1).length == 5
      ) {
        return res.status(404).send("Limit Orders limited to 5");
      }
    }
  
    if (!user) return res.status(404).send("User not found");
    
    const currentMarketPrices = await fetchCurrentMarketPrices();
  
    if (currentMarketPrices === null) {
      return res.status(500).send("Error fetching market price");
    }
  
    const currentMarketPrice = currentMarketPrices.filter(
      (item) => item.assetType == spotAssetType
    )[0].price;
    
    if(positionType=='buy'){
        if (user.spotUSDTBalance < amount * currentMarketPrice) {
            console.log('---------------');
            console.log(user.spotUSDTBalance);
            console.log(amount);
            console.log(currentMarketPrice);
            return res.status(400).send("Insufficient balance");
        }
        user.spotUSDTBalance -= amount * currentMarketPrice;
    }

    if(positionType=='sell'){
        user.spotUSDTBalance += amount * currentMarketPrice;
    }
      
    const positionId = Date.now(); // Unique ID for the position (can be replaced with a more robust method)
    
    const position = {
      id: positionId,
      assetType: spotAssetType,
      positionType,
      orderType,
      orderLimit,
      amount,
      limitPrice,
      entryPrice: currentMarketPrice,
    };
  
    // Initialize positions array if not exists
    if (!user.spotPositions) {
      user.spotPositions = [];
    }
  
    user.spotPositions.push(position);
    saveUsers(users);
    sendPositionOpenEmail(username, position);
  
    res.json({ spotPositions: user.spotPositions, newspotUSDTBalance: user.spotUSDTBalance });
});
  
app.post("/api/getPositions", authenticateToken, (req, res) => {
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];

  if (!user) return res.status(404).send("User not found");

  res.json({
    futuresPositions: user.futuresPositions,
    closedFuturesPositions: user.closedFuturesPositions,
    spotPositions: user.spotPositions,
  });
});

app.post("/api/getCurrentPrice", async (req, res) => {
  try {
    const price = await fetchCurrentMarketPrices();
    if (price !== null) {
      res.json({ currentPrices: price });
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch price. Please try again later." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error fetching current price" });
  }
});

app.post("/api/saveTPSL", authenticateToken, async (req, res) => {
  const { positionId, tp, sl } = req.body;
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];

  if (!user) return res.status(404).send("User not found");

  // Find the position to close
  const positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) return res.status(404).send("Position not found");

  const oldTP = user.futuresPositions[positionIndex].tp;
  user.futuresPositions[positionIndex].tp = tp;
  if(oldTP != tp)sendPositionTPEmail(username, user.futuresPositions[positionIndex]);

  const oldSL = user.futuresPositions[positionIndex].sl;
  user.futuresPositions[positionIndex].sl = sl;
  if(oldSL != sl)sendPositionTPEmail(username, user.futuresPositions[positionIndex]);
  
  saveUsers(users);
  res.json({ futuresPositions: user.futuresPositions });
});

app.post("/api/startTrade", authenticateToken, async (req, res) => {
  const { positionId } = req.body;
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];
  let futures = 0;

  if (!user) return res.status(404).send("User not found");

  // Find the position to close
  let positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1){
    positionIndex = user.spotPositions.findIndex(
        (pos) => pos.id === positionId
    );
    if(positionIndex === -1)return res.status(404).send("Position not found");
    user.spotPositions[positionIndex].orderLimit = 0;
  }else{
    user.futuresPositions[positionIndex].orderLimit = 0;
  } 

  // user.futuresUSDTBalance -= user.futuresPositions[positionIndex].amount;
  saveUsers(users);
  res.json({ 
    futuresPositions: user.futuresPositions,
    spotPositions: user.spotPositions
   });
});

app.post("/api/closeFuturesPosition", authenticateToken, async (req, res) => {
  const { positionId, reason } = req.body;
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];

  if (!user) return res.status(404).send("User not found");

  // Find the position to close
  const positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) return res.status(404).send("Position not found");

  const closedPosition = user.futuresPositions.splice(positionIndex, 1)[0];

  // Fetch the current market price
  const currentMarketPrices = await fetchCurrentMarketPrices();
  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price");
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == closedPosition.assetType
  )[0].price;

  // Calculate realized profit or loss
  const priceDiff =
    (currentMarketPrice - closedPosition.entryPrice) *
    (closedPosition.positionType === "Long" ? 1 : -1);
  let profitLoss =
    closedPosition.amount *
    closedPosition.leverage *
    (priceDiff / closedPosition.entryPrice);

  if (closedPosition.orderLimit) profitLoss = 0;

  // Update balance
  if (reason == 3) profitLoss = -closedPosition.amount; // liquidation
  // if(!closedPosition.orderLimit)user.futuresUSDTBalance += closedPosition.amount + profitLoss; // Add the amount and profit/loss
  user.futuresUSDTBalance += closedPosition.amount + profitLoss; // Add the amount and profit/loss

  // Log the closed position with realized P/L
  if (!user.closedFuturesPositions) {
    user.closedFuturesPositions = [];
  }
  user.closedFuturesPositions.push({
    ...closedPosition,
    exitPrice: currentMarketPrice,
    realizedPL: profitLoss,
    closedReason: reason,
  });

  sendPositionClosedEmail(username, closedPosition, currentMarketPrice);

  saveUsers(users);
  res.json({ futuresPositions: user.futuresPositions, newFuturesUSDTBalance: user.futuresUSDTBalance, profitLoss });
});

// app.post("/api/closeSpotPosition", authenticateToken, async (req, res) => {
//     const { positionId } = req.body;
//     const username = req.user.username;
//     const users = loadUsers();
//     const user = users[username];
  
//     if (!user) return res.status(404).send("User not found");
  
//     // Find the position to close
//     const positionIndex = user.spotPositions.findIndex(
//       (pos) => pos.id === positionId
//     );
//     if (positionIndex === -1) return res.status(404).send("Position not found");
  
//     const closedPosition = user.spotPositions.splice(positionIndex, 1)[0];
  
//     // Fetch the current market price
//     const currentMarketPrices = await fetchCurrentMarketPrices();
//     if (currentMarketPrices === null) {
//       return res.status(500).send("Error fetching market price");
//     }
  
//     const currentMarketPrice = currentMarketPrices.filter(
//       (item) => item.assetType == closedPosition.assetType
//     )[0].price;
  
//     // Calculate realized profit or loss
//     const priceDiff =
//       (currentMarketPrice - closedPosition.entryPrice) *
//       (closedPosition.positionType === "Long" ? 1 : -1);
//     let profitLoss =
//       closedPosition.amount *
//       closedPosition.leverage *
//       (priceDiff / closedPosition.entryPrice);
  
//     if (closedPosition.orderLimit) profitLoss = 0;
  
//     // Update balance
//     if (reason == 3) profitLoss = -closedPosition.amount; // liquidation
//     // if(!closedPosition.orderLimit)user.futuresUSDTBalance += closedPosition.amount + profitLoss; // Add the amount and profit/loss
//     user.spotUSDTBalance += closedPosition.amount + profitLoss; // Add the amount and profit/loss
  
//     // Log the closed position with realized P/L
//     if (!user.closedSpotPositions) {
//       user.closedSpotPositions = [];
//     }
//     user.closedSpotPositions.push({
//       ...closedPosition,
//       exitPrice: currentMarketPrice,
//       realizedPL: profitLoss,
//     });
  
//     sendPositionClosedEmail(username, closedPosition, currentMarketPrice);
  
//     saveUsers(users);
//     res.json({ spotPositions: user.spotPositions, newSpotUSDTBalance: user.spotUSDTBalance, profitLoss });
// });
 
app.post("/api/partialClosePosition", authenticateToken, async (req, res) => {
  const { positionId, percent } = req.body;
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];
  const reason = 4; // partial closing.

  if (!user) return res.status(404).send("User not found");

  // Find the position to close
  const positionIndex = user.futuresPositions.findIndex(
    (pos) => pos.id === positionId
  );
  if (positionIndex === -1) return res.status(404).send("Position not found");

  // const closedPosition = user.futuresPositions.splice(positionIndex, 1)[0];
  closedPosition = user.futuresPositions[positionIndex];

  // Fetch the current market price
  const currentMarketPrices = await fetchCurrentMarketPrices();
  if (currentMarketPrices === null) {
    return res.status(500).send("Error fetching market price");
  }

  const currentMarketPrice = currentMarketPrices.filter(
    (item) => item.assetType == closedPosition.assetType
  )[0].price;

  // Calculate realized profit or loss
  const priceDiff =
    (currentMarketPrice - closedPosition.entryPrice) *
    (closedPosition.positionType === "Long" ? 1 : -1);
  let profitLoss =
    ((closedPosition.amount * percent) / 100) *
    closedPosition.leverage *
    (priceDiff / closedPosition.entryPrice);

  if (closedPosition.orderLimit) profitLoss = 0;

  // Update balance
  user.futuresUSDTBalance += (closedPosition.amount * percent) / 100 + profitLoss; // Add the amount and profit/loss
  closedPosition.amount *= percent / 100;

  // Log the closed position with realized P/L
  if (!user.closedFuturesPositions) {
    user.closedFuturesPositions = [];
  }
  user.closedFuturesPositions.push({
    ...closedPosition,
    exitPrice: currentMarketPrice,
    realizedPL: profitLoss,
    closedReason: reason,
  });

  user.futuresPositions[positionIndex].amount *= 100 / percent;
  user.futuresPositions[positionIndex].amount *= 1 - percent / 100;

  saveUsers(users);
  res.json({ futuresPositions: user.futuresPositions, newfuturesUSDTBalance: user.futuresUSDTBalance, profitLoss });
});

// app.post("/api/getClosedPositions", authenticateToken, (req, res) => {
//   const username = req.user.username;
//   const users = loadUsers();
//   const user = users[username];

//   if (!user) return res.status(404).send("User not found");

//   res.json({ closedFuturesPositions: user.closedFuturesPositions });
// });

app.post("/api/updateValue", authenticateToken, (req, res) => {
  const username = req.user.username;
  const users = loadUsers();
  const user = users[username];

  if (!user) return res.status(404).send("User not found");

  user.futuresValue = user.futuresUSDTBalance + parseFloat(req.body.futuresPositionsAmount)+ parseFloat(req.body.futuresUnrealizedPL);
  user.spotValue = user.spotUSDTBalance + parseFloat(req.body.spotPositionsAmount)+ parseFloat(req.body.spotUnrealizedPL);
  user.totalValue = user.futuresValue + user.spotValue;
  saveUsers(users);
  res.json({
    futuresUSDTBalance: user.futuresUSDTBalance,
    futuresValue: user.futuresValue,
  });
});
