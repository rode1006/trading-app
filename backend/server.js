const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const withdrawalRoutes = require('./routes/withdrawal');
const positionRoutes = require('./routes/position');
const tradeRoutes = require('./routes/trade');
const balanceRoutes = require('./routes/balance');
const marketRoutes = require('./routes/market');
const candlesRoutes = require('./routes/candles');
const updateValueRoutes = require('./routes/updateValue');
const spotPositionRoutes = require('./routes/spotPosition');
const partialClosePositionRoutes = require('./routes/partialClosePosition');
const path = require('path');

const app = express();
connectDB();

app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, '../frontend/build')));

// Serve static assets like icons and images directly from frontend/build
app.use('/icon', express.static(path.join(__dirname, '../frontend/build/icon')));
app.use('/img', express.static(path.join(__dirname, '../frontend/build/img')));

// Route for React app's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.use('/auth', authRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/position', positionRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/candles', candlesRoutes);
app.use('/api/updateValue', updateValueRoutes);
app.use('/api/openSpotPosition', spotPositionRoutes);
app.use('/api/partialClosePosition', partialClosePositionRoutes);

app.listen(3000, () => console.log('Server running on port 3000 http://localhost:3000/'));