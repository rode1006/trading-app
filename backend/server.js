const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const withdrawalRoutes = require('./routes/withdrawal');
const positionRoutes = require('./routes/position');
const balanceRoutes = require('./routes/balance');
const marketRoutes = require('./routes/market');
const candlesRoutes = require('./routes/candles');
const updateValueRoutes = require('./routes/updateValue');
const spotPositionRoutes = require('./routes/spotPosition');
const partialClosePositionRoutes = require('./routes/partialClosePosition');
const path = require('path');
let futuresCurrencyPrices = [];
let spotCurrencyPrices = [];

const app = express();
connectDB();

app.use(bodyParser.json());
// app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'frontend/build')));

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
// });
// // Catch-all route to serve the React app for any route that doesn't match
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '/frontend/build', 'index.html'));
// });
app.use(express.static(path.join(__dirname, '../build')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});
// Catch-all route to serve the React app for any route that doesn't match
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.use('/auth', authRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/position', positionRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/candles', candlesRoutes);
app.use('/api/updateValue', updateValueRoutes);
app.use('/api/openSpotPosition', spotPositionRoutes);
app.use('/api/partialClosePosition', partialClosePositionRoutes);

app.listen(3000, () => console.log('Server running on port 3000 http://localhost:3000/'));