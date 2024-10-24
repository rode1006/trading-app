import React, { useState, useEffect } from "react";
import "./trading.css";

const TradingComponent = () => {
  const [activeTab, setActiveTab] = useState("futures");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [futuresAssetType, setFuturesAssetType] = useState("BTC");
  const [spotAssetType, setSpotAssetType] = useState("BTC");
  const [futuresPositions, setFuturesPositions] = useState([]);
  const [spotPositions, setSpotPositions] = useState([]);
  const [futuresBalance, setFuturesBalance] = useState(0);
  const [spotBalance, setSpotBalance] = useState(0);
  const [futuresCurrentPrice, setFuturesCurrentPrice] = useState(0);
  const [spotCurrentPrice, setSpotCurrentPrice] = useState(0);
  const [futuresOpenOrders, setFuturesOpenOrders] = useState([]);
  const [futuresClosedPositions, setFuturesClosedPositions] = useState([]);
  const [spotOpenOrders, setSpotOpenOrders] = useState([]);
  const [spotClosedPositions, setSpotClosedPositions] = useState([]);
  const [transferUSDTType, setTransferUSDTType] = useState("fromFutures");
  const [transferUSDTAmount, setTransferUSDTAmount] = useState("");
  const [closingPosition, setClosingPosition] = useState(null);
  const [partialClosingPercent, setPartialClosingPercent] = useState(100);
  const [futuresUSDTBalance, setFuturesUSDTBalance] = useState(0);
  const [spotUSDTBalance, setSpotUSDTBalance] = useState(0);
  const [futuresMarketOrder, setFuturesMarketOrder] = useState({
    amount: "",
    leverage: "",
  });
  const [futuresLimitOrder, setFuturesLimitOrder] = useState({
    amount: "",
    leverage: "",
    limitPrice: "",
  });
  const [spotMarketOrder, setSpotMarketOrder] = useState({ amount: "" });
  const [spotLimitOrder, setSpotLimitOrder] = useState({
    amount: "",
    limitPrice: "",
  });
  const [selectedAsset, setSelectedAsset] = useState("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState("ERC-20");
  const [depositAddress, setDepositAddress] = useState("");
  const [currentPrices, setCurrentPrices] = useState({});
  const [balance, setBalance] = useState({ futures: 0, spot: 0 });
  const assetTypes = ["BTC", "ETH", "BNB", "NEO", "LTC", "SOL", "XRP", "DOT"];
  const networkOptions = ["ERC-20", "BSC", "Base", "Arbitrum One"];
  const [showPartialCloseModal, setShowPartialCloseModal] = useState(false);
  const [partialClosePercent, setPartialClosePercent] = useState(100);
  const [closedFuturesPositions, setClosedFuturesPositions] = useState([]);
  const [closedSpotPositions, setClosedSpotPositions] = useState([]);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferType, setTransferType] = useState("fromFutures");
  const [qrCode, setQrCode] = useState("");

  const fetchBalances = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/balance/getBalance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setFuturesUSDTBalance(data.futuresUSDTBalance || 0);
      setSpotUSDTBalance(data.spotUSDTBalance || 0);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  // Function to place market orders in Futures
  const placeFuturesMarketOrder = async (positionType) => {
    const { amount, leverage } = futuresMarketOrder;
    if (!amount || !leverage) {
      alert("Please enter valid amount and leverage for the market order");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:5000/api/position/openFuturesPosition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            futuresAssetType,
            positionType,
            orderType: "market",
            amount: parseFloat(amount),
            leverage: parseInt(leverage),
          }),
        }
      );
      if (response.ok) {
        alert(`Order of ${positionType} placed successfully in market`);
        fetchBalances(); // Update balances
        setFuturesMarketOrder({ amount: "", leverage: "" });
      } else {
        alert("Error placing market order");
      }
    } catch (error) {
      console.error("Error placing market order:", error);
    }
  };

  // Function to place limit orders in Futures
  const placeFuturesLimitOrder = async (positionType) => {
    const { amount, leverage, limitPrice } = futuresLimitOrder;
    if (!amount || !leverage || !limitPrice) {
      alert("Please enter valid amount, leverage, and limit price");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:5000/api/position/openFuturesPosition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            futuresAssetType,
            positionType,
            orderType: "limit",
            amount: parseFloat(amount),
            leverage: parseInt(leverage),
            limitPrice: parseFloat(limitPrice),
          }),
        }
      );
      if (response.ok) {
        alert(`Limit order of ${positionType} placed successfully`);
        fetchBalances();
        setFuturesLimitOrder({ amount: "", leverage: "", limitPrice: "" });
      } else {
        alert("Error placing limit order");
      }
    } catch (error) {
      console.error("Error placing limit order:", error);
    }
  };

  // Function to place market orders in Spot
  const placeSpotMarketOrder = async (positionType) => {
    const { amount } = spotMarketOrder;
    if (!amount) {
      alert("Please enter a valid amount for the spot market order");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:5000/api/openSpotPosition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            spotAssetType,
            positionType,
            orderType: "market",
            amount: parseFloat(amount),
          }),
        }
      );
      if (response.ok) {
        alert(`Order of ${positionType} placed successfully in Spot market`);
        fetchBalances();
        setSpotMarketOrder({ amount: "" });
      } else {
        alert("Error placing market order in Spot");
      }
    } catch (error) {
      console.error("Error placing market order in Spot:", error);
    }
  };

  // Function to place limit orders in Spot
  const placeSpotLimitOrder = async (positionType) => {
    const { amount, limitPrice } = spotLimitOrder;
    if (!amount || !limitPrice) {
      alert("Please enter valid amount and limit price for the Spot order");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:5000/api/openSpotPosition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            spotAssetType,
            positionType,
            orderType: "limit",
            amount: parseFloat(amount),
            limitPrice: parseFloat(limitPrice),
          }),
        }
      );
      if (response.ok) {
        alert(`Limit order of ${positionType} placed successfully in Spot`);
        fetchBalances();
        setSpotLimitOrder({ amount: "", limitPrice: "" });
      } else {
        alert("Error placing limit order in Spot");
      }
    } catch (error) {
      console.error("Error placing limit order in Spot:", error);
    }
  };

  useEffect(() => {
    document.getElementById("defaultOpen").click();
  }, []);

  const toggleTransferModal = () => {
    setShowTransferModal(!showTransferModal);
  };

  const toggleDepositModal = () => {
    setShowDepositModal(!showDepositModal);
  };

  // Load initial data
  useEffect(() => {
    fetchUserData();
    fetchMarketData();
  }, []);

  const fetchUserData = async () => {
    // Simulated API call to obtain user data
    try {
      const response = await fetch(
        "http://localhost:5000/api/balance/getBalance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setFuturesBalance(data.futuresUSDTBalance);
      setSpotBalance(data.spotUSDTBalance);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchMarketData = async () => {
    // Simulated API call to obtain market price
    try {
      const response = await fetch(
        "http://localhost:5000/api/market/getCurrentPrice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      const currentPrice =
        data.currentPrices.find((item) => item.assetType === futuresAssetType)
          ?.price || 0;
      setFuturesCurrentPrice(currentPrice);

      const spotPrice =
        data.currentPrices.find((item) => item.assetType === spotAssetType)
          ?.price || 0;
      setSpotCurrentPrice(spotPrice);
    } catch (error) {
      console.error("Error fetching market price:", error);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Functions to handle trading operations
  const handleFuturesTrading = (positionType, orderType) => {
    // Implementation of futures trading logic
    alert(`Futures Trading: ${positionType} (${orderType})`);
  };

  const handleSpotTrading = (positionType, orderType) => {
    // Implementation of spot trading logic
    alert(`Spot Trading: ${positionType} (${orderType})`);
  };

  // Function to obtain positions and orders from backend
  const fetchPositionsAndOrders = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/position/getPositions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();

      // Update state with positions and orders
      setFuturesPositions(data.futuresPositions || []);
      setFuturesOpenOrders(data.futuresOpenOrders || []);
      setFuturesClosedPositions(data.closedFuturesPositions || []);
      setSpotPositions(data.spotPositions || []);
      setSpotOpenOrders(data.spotOpenOrders || []);
      setSpotClosedPositions(data.closedSpotPositions || []);
    } catch (error) {
      console.error("Error fetching positions and orders:", error);
    }
  };

  useEffect(() => {
    fetchPositionsAndOrders();
  }, []);

  // Function to close a futures position
  const closeFuturesPosition = async (positionId, reason) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/position/closeFuturesPosition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ positionId, reason }),
        }
      );
      if (response.ok) {
        alert("Successfully closed futures position");
        fetchPositionsAndOrders(); // Update positions after closing
      } else {
        alert("Error closing the futures position");
      }
    } catch (error) {
      console.error("Error closing the futures position:", error);
    }
  };

  // Function to close a spot position
  const closeSpotPosition = async (positionId) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/position/closeSpotPosition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ positionId }),
        }
      );
      if (response.ok) {
        alert("Successfully closed spot position");
        fetchPositionsAndOrders(); // Update positions after closing
      } else {
        alert("Error closing the spot position");
      }
    } catch (error) {
      console.error("Error closing the spot position:", error);
    }
  };

  // Function to get positions from backend
  const fetchPositions = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/position/getPositions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setFuturesPositions(data.futuresPositions || []);
      setSpotPositions(data.spotPositions || []);
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // Function to save Take Profit and Stop Loss
  const saveTPSL = async (positionId, tp, sl) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/position/saveTPSL",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ positionId, tp, sl }),
        }
      );
      if (response.ok) {
        alert("Take Profit and Stop Loss updated");
        fetchPositions(); // Update positions after saving
      } else {
        alert("Error updating TP/SL");
      }
    } catch (error) {
      console.error("Error updating TP/SL:", error);
    }
  };

  // Function to transfer USDT between Futures and Spot
  const transferUSDT = async () => {
    if (isNaN(transferUSDTAmount) || transferUSDTAmount <= 0) {
      alert("Please enter a valid amount for the transfer");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/balance/updateBalance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            type: transferUSDTType,
            amount: parseFloat(transferUSDTAmount),
          }),
        }
      );
      if (response.ok) {
        alert("USDT transfer successful");
        fetchPositions(); // Update data after the transfer
        setTransferUSDTAmount("");
      } else {
        alert("Error conducting transfer");
      }
    } catch (error) {
      console.error("Error conducting transfer:", error);
    }
  };

  // Function to partially close a position
  const partialClose = async () => {
    if (
      isNaN(partialClosingPercent) ||
      partialClosingPercent <= 0 ||
      partialClosingPercent > 100
    ) {
      alert("Please enter a valid percentage for the partial close");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/partialClosePosition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            positionId: closingPosition.id,
            percent: partialClosingPercent,
          }),
        }
      );
      if (response.ok) {
        alert(`Partially closed position at ${partialClosingPercent}%`);
        fetchPositions();
        setPartialClosingPercent(100);
        setClosingPosition(null);
      } else {
        alert("Error partially closing the position");
      }
    } catch (error) {
      console.error("Error partially closing the position:", error);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/balance/getBalance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setDepositAddress(data.address);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchCurrentPrices = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/market/getCurrentPrice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setCurrentPrices(data.currentPrices);
    } catch (error) {
      console.error("Error fetching current prices:", error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleTransferClick = () => {
    setShowTransferModal(true);
  };

  const handleDepositClick = () => {
    setShowDepositModal(true);
  };

  const handleTransfer = () => {
    if (transferAmount === "" || isNaN(transferAmount)) {
      alert("Please enter a valid transfer amount");
      return;
    }
    // Logic for transferring USDT between Futures and Spot accounts
    alert(`Transferred ${transferAmount} USDT from ${transferType}`);
    setShowTransferModal(false);
  };

  const generateQRCode = (address) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      address
    )}&size=150x150`;
    setQrCode(qrCodeUrl);
  };

  const closeModals = () => {
    setShowTransferModal(false);
    setShowDepositModal(false);
    setShowPartialCloseModal(false);
  };

  const handlePartialClose = () => {
    // Logic to handle the partial closing of positions
    alert(`Closing ${partialClosePercent}% of the position`);
    setShowPartialCloseModal(false);
  };

  const handlePlaceOrder = (orderType, positionType) => {
    // Logic to handle the order (Futures or Spot)
    alert(`Placed a ${positionType} ${orderType} order`);
  };

  const handleAssetChange = (asset) => {
    setSelectedAsset(asset);
  };

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
  };

  const copyAddress = () => {
    navigator.clipboard
      .writeText(depositAddress)
      .then(() => {
        alert("Address copied to clipboard");
      })
      .catch((err) => {
        alert("Failed to copy address");
      });
  };

  const logout = async () => {
    await fetch("/logout", { method: "POST" });
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="container">
      <div className="main-content">
        <div className="container">
          {/* Tab navigation */}
          <div className="tab-navigation">
            <button
              className={`tablinks ${activeTab === "futures" ? "active" : ""}`}
              onClick={() => handleTabClick("futures")}
            >
              Futures Trading
            </button>
            <button
              className={`tablinks ${activeTab === "spot" ? "active" : ""}`}
              onClick={() => handleTabClick("spot")}
            >
              Spot Trading
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "futures" && (
            <div className="trading-panel">
              <h3>Futures Trading Panel</h3>
              <div>
                <span>Asset Type:</span>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                >
                  {assetTypes.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
                <span>Current Price:</span>
                <span>{currentPrices[selectedAsset] || "Loading..."}</span>
              </div>

              {/* Statistics */}
              <div className="statistics">
                <span>Est. Futures Balance: {balance.futures} USDT</span>
                <span>
                  Est. Futures Value:{" "}
                  {(
                    balance.futures +
                    futuresPositions.reduce((sum, pos) => sum + pos.amount, 0)
                  ).toFixed(2)}{" "}
                  USDT
                </span>
              </div>

              {/* Open Positions */}
              <h3>Open Positions</h3>
              <div className="positions-list">
                {futuresPositions.length ? (
                  futuresPositions.map((position, index) => (
                    <div key={index} className="position-item">
                      <span>
                        {position.assetType} - {position.amount} USDT
                      </span>
                      <button onClick={() => setShowPartialCloseModal(true)}>
                        Partial Close
                      </button>
                    </div>
                  ))
                ) : (
                  <div>No open positions</div>
                )}
              </div>

              {/* Closed Positions */}
              <h3>Closed Positions</h3>
              <div className="positions-list">
                {closedFuturesPositions.length ? (
                  closedFuturesPositions.map((position, index) => (
                    <div key={index} className="position-item closed">
                      <span>
                        {position.assetType} - Closed at {position.exitPrice}{" "}
                        USDT
                      </span>
                    </div>
                  ))
                ) : (
                  <div>No closed positions</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "spot" && (
            <div className="trading-panel">
              <h3>Spot Trading Panel</h3>
              <div>
                <span>Asset Type:</span>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                >
                  {assetTypes.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
                <span>Current Price:</span>
                <span>{currentPrices[selectedAsset] || "Loading..."}</span>
              </div>

              {/* Statistics */}
              <div className="statistics">
                <span>Est. Spot Balance: {balance.spot} USDT</span>
                <span>
                  Est. Spot Value:{" "}
                  {(
                    balance.spot +
                    spotPositions.reduce((sum, pos) => sum + pos.amount, 0)
                  ).toFixed(2)}{" "}
                  USDT
                </span>
              </div>

              {/* Open Positions */}
              <h3>Open Positions</h3>
              <div className="positions-list">
                {spotPositions.length ? (
                  spotPositions.map((position, index) => (
                    <div key={index} className="position-item">
                      <span>
                        {position.assetType} - {position.amount} USDT
                      </span>
                    </div>
                  ))
                ) : (
                  <div>No open positions</div>
                )}
              </div>

              {/* Closed Positions */}
              <h3>Closed Positions</h3>
              <div className="positions-list">
                {closedSpotPositions.length ? (
                  closedSpotPositions.map((position, index) => (
                    <div key={index} className="position-item closed">
                      <span>
                        {position.assetType} - Closed at {position.exitPrice}{" "}
                        USDT
                      </span>
                    </div>
                  ))
                ) : (
                  <div>No closed positions</div>
                )}
              </div>
            </div>
          )}

          {/* Modals for transfer and deposit */}
          {showTransferModal && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={closeModals}>
                  ×
                </span>
                <h2>USDT Transfer</h2>
                <div>
                  <label>Mode:</label>
                  <select
                    value={transferType}
                    onChange={(e) => setTransferType(e.target.value)}
                  >
                    <option value="fromFutures">Futures - Spot</option>
                    <option value="fromSpot">Spot - Futures</option>
                  </select>
                </div>
                <div>
                  <label>Amount:</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                  <span>(USDT)</span>
                </div>
                <button onClick={handleTransfer}>Transfer</button>
              </div>
            </div>
          )}

          {showDepositModal && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={closeModals}>
                  ×
                </span>
                <h2>Deposit</h2>
                <div>
                  <img src={qrCode} alt="QR Code" />
                  <p>Deposit Address: {depositAddress}</p>
                </div>
              </div>
            </div>
          )}

          {showPartialCloseModal && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={closeModals}>
                  ×
                </span>
                <h2>Partial Close</h2>
                <div>
                  <label>Percent:</label>
                  <input
                    type="number"
                    value={partialClosePercent}
                    onChange={(e) => setPartialClosePercent(e.target.value)}
                  />
                  <span>%</span>
                </div>
                <button onClick={handlePartialClose}>Confirm</button>
              </div>
            </div>
          )}
        </div>
        {/* Navigation */}
        <div className="navigation">
          <div className="nav-left">
            <div className="tab">
              <button
                className={`tablinks ${
                  activeTab === "futures" ? "active" : ""
                }`}
                onClick={(e) => handleTabChange(e, "futures")}
                id="defaultOpen"
              >
                Futures Trading
              </button>
              <button
                className={`tablinks ${activeTab === "spot" ? "active" : ""}`}
                onClick={(e) => handleTabChange(e, "spot")}
              >
                Spot Trading
              </button>
            </div>
          </div>
          <div className="nav-right">
            <button className="deposit-btn" onClick={toggleTransferModal}>
              <i className="fas fa-arrow-right-arrow-left" /> Transfer
            </button>
            <button className="deposit-btn" onClick={toggleDepositModal}>
              <i className="fas fa-wallet" /> Deposit
            </button>

            {/* Buttons for Transfer and Deposit */}
      <div className="nav-buttons">
        <button className="deposit-btn" onClick={handleTransferClick}>
          <i className="fas fa-arrow-right-arrow-left"></i> Transfer
        </button>
        <button className="deposit-btn" onClick={handleDepositClick}>
          <i className="fas fa-wallet"></i> Deposit
        </button>
      </div>

      

      {/* Logout Button */}
      <button className="logout-btn" onClick={logout}>
        Logout
      </button>
      
          </div>
        </div>

      {/* Trading Content */}
      {activeTab === "futures" && (
        <div id="futures" className="tabcontent">
          <h3>Futures Trading</h3>
          <div className="statistics">
            <p>Est. Balance (USDT): {futuresBalance.toFixed(2)}</p>
            <p>Current Price: {futuresCurrentPrice.toFixed(2)} USDT</p>
          </div>
          <div className="order-panel">
            <div>
              <label>Asset Type:</label>
              <select
                value={futuresAssetType}
                onChange={(e) => setFuturesAssetType(e.target.value)}
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="BNB">BNB</option>
                {/* Add more options as needed */}
              </select>
            </div>

            {/* <div>
              <label>Bet Amount:</label>
              <input type="number" id="bet-amount" min="1" max="100" />
              <label>Leverage:</label>
              <input type="number" id="bet-leverage" min="1" max="300" />
              <button onClick={() => handleFuturesTrading("long", "market")}>
                Long
              </button>
              <button onClick={() => handleFuturesTrading("short", "market")}>
                Short
              </button>
            </div> */}
            {/* Futures market and limit order section */}
      <div className="futures-order-section">
        <h3>Futures Orders</h3>
        <div className="market-order">
          <h4>Market Order</h4>
          <input
            type="number"
            placeholder="Amount (USDT)"
            value={futuresMarketOrder.amount}
            onChange={(e) =>
              setFuturesMarketOrder({
                ...futuresMarketOrder,
                amount: e.target.value,
              })
            }
          />
          <input
            type="number"
            placeholder="Leverage"
            value={futuresMarketOrder.leverage}
            onChange={(e) =>
              setFuturesMarketOrder({
                ...futuresMarketOrder,
                leverage: e.target.value,
              })
            }
          />
          <button onClick={() => placeFuturesMarketOrder("long")}>
            Buy (Long)
          </button>
          <button onClick={() => placeFuturesMarketOrder("short")}>
            Sell (Short)
          </button>
        </div>

        <div className="limit-order">
          <h4>Limit Order</h4>
          <input
            type="number"
            placeholder="Amount (USDT)"
            value={futuresLimitOrder.amount}
            onChange={(e) =>
              setFuturesLimitOrder({
                ...futuresLimitOrder,
                amount: e.target.value,
              })
            }
          />
          <input
            type="number"
            placeholder="Leverage"
            value={futuresLimitOrder.leverage}
            onChange={(e) =>
              setFuturesLimitOrder({
                ...futuresLimitOrder,
                leverage: e.target.value,
              })
            }
          />
          <input
            type="number"
            placeholder="Limit Price (USDT)"
            value={futuresLimitOrder.limitPrice}
            onChange={(e) =>
              setFuturesLimitOrder({
                ...futuresLimitOrder,
                limitPrice: e.target.value,
              })
            }
          />
          <button onClick={() => placeFuturesLimitOrder("long")}>
            Buy (Long)
          </button>
          <button onClick={() => placeFuturesLimitOrder("short")}>
            Sell (Short)
          </button>
        </div>
      </div>

          </div>

          {/* Open Futures Positions Section */}
      <div className="positions-section">
        <h3>Open Futures Positions</h3>
        <div className="positions-list">
          {futuresPositions.map((position) => (
            <div key={position.id} className="position-item">
              <p>
                {position.positionType} - {position.assetType} - Amount:{" "}
                {position.amount} USDT
              </p>
              <button onClick={() => closeFuturesPosition(position.id, 0)}>
                Close Position
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Futures Section */}
      <div className="futures-section">
        <h3>Futures Positions</h3>
        {futuresPositions.map((position) => (
          <div key={position.id} className="position-item">
            <p>
              {position.positionType} - {position.assetType} - Amount:{" "}
              {position.amount} USDT
            </p>
            <div className="tpsl-section">
              <label>TP:</label>
              <input
                type="number"
                value={position.tp}
                onChange={(e) => (position.tp = e.target.value)}
              />
              <label>SL:</label>
              <input
                type="number"
                value={position.sl}
                onChange={(e) => (position.sl = e.target.value)}
              />
              <button
                onClick={() => saveTPSL(position.id, position.tp, position.sl)}
              >
                Save TP/SL
              </button>
            </div>
            <button onClick={() => setClosingPosition(position)}>
              Partial Close
            </button>
          </div>
        ))}
      </div>

      {/* Open Futures Orders Section */}
      <div className="orders-section">
        <h3>Open Futures Orders</h3>
        <div className="orders-list">
          {futuresOpenOrders.map((order) => (
            <div key={order.id} className="order-item">
              <p>
                {order.orderType} - {order.assetType} - Amount: {order.amount}{" "}
                USDT
              </p>
              <button onClick={() => closeFuturesPosition(order.id, 0)}>
                Close Order
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Closed Futures Positions Section */}
      <div className="closed-positions-section">
        <h3>Closed Futures Positions</h3>
        <div className="closed-positions-list">
          {futuresClosedPositions.map((position) => (
            <div key={position.id} className="closed-position-item">
              <p>
                {position.positionType} - {position.assetType} - Realized:{" "}
                {position.realizedPL} USDT
              </p>
            </div>
          ))}
        </div>
      </div>

        </div>
      )}

      {activeTab === "spot" && (
        <div id="spot" className="tabcontent">
          <h3>Spot Trading</h3>
          <div className="statistics">
            <p>Est. Balance (USDT): {spotBalance.toFixed(2)}</p>
            <p>Current Price: {spotCurrentPrice.toFixed(2)} USDT</p>
          </div>
          <div className="order-panel">
            <div>
              <label>Asset Type:</label>
              <select
                value={spotAssetType}
                onChange={(e) => setSpotAssetType(e.target.value)}
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="BNB">BNB</option>
                {/* Add more options as needed */}
              </select>
            </div>

            {/* <div>
              <label>Amount:</label>
              <input type="number" id="spot-market-amount" min="1" max="100" />
              <button onClick={() => handleSpotTrading("buy", "market")}>
                Buy
              </button>
              <button onClick={() => handleSpotTrading("sell", "market")}>
                Sell
              </button>
            </div> */}

            {/* Spot market and limit order section */}
      <div className="spot-order-section">
        <h3>Spot Orders</h3>
        <div className="market-order">
          <h4>Market Order</h4>
          <input
            type="number"
            placeholder="Amount"
            value={spotMarketOrder.amount}
            onChange={(e) =>
              setSpotMarketOrder({ ...spotMarketOrder, amount: e.target.value })
            }
          />
          <button onClick={() => placeSpotMarketOrder("buy")}>Buy</button>
          <button onClick={() => placeSpotMarketOrder("sell")}>Sell</button>
        </div>

        <div className="limit-order">
          <h4>Limit Order</h4>
          <input
            type="number"
            placeholder="Amount"
            value={spotLimitOrder.amount}
            onChange={(e) =>
              setSpotLimitOrder({ ...spotLimitOrder, amount: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Limit Price (USDT)"
            value={spotLimitOrder.limitPrice}
            onChange={(e) =>
              setSpotLimitOrder({
                ...spotLimitOrder,
                limitPrice: e.target.value,
              })
            }
          />
          <button onClick={() => placeSpotLimitOrder("buy")}>Buy</button>
          <button onClick={() => placeSpotLimitOrder("sell")}>Sell</button>
        </div>
      </div>

          </div>

          {/* Open Spot Positions Section */}
      <div className="positions-section">
        <h3>Open Spot Positions</h3>
        <div className="positions-list">
          {spotPositions.map((position) => (
            <div key={position.id} className="position-item">
              <p>
                {position.positionType} - {position.assetType} - Amount:{" "}
                {position.amount}
              </p>
              <button onClick={() => closeSpotPosition(position.id)}>
                Close Position
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Open Spot Orders Section */}
      <div className="orders-section">
        <h3>Open Spot Orders</h3>
        <div className="orders-list">
          {spotOpenOrders.map((order) => (
            <div key={order.id} className="order-item">
              <p>
                {order.orderType} - {order.assetType} - Amount: {order.amount}
              </p>
              <button onClick={() => closeSpotPosition(order.id)}>
                Close Order
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Closed Spot Positions Section */}
      <div className="closed-positions-section">
        <h3>Closed Spot Positions</h3>
        <div className="closed-positions-list">
          {spotClosedPositions.map((position) => (
            <div key={position.id} className="closed-position-item">
              <p>
                {position.positionType} - {position.assetType} - Realized:{" "}
                {position.realizedPL}
              </p>
            </div>
          ))}
        </div>
      </div>
      
        </div>
      )}
        
      </div>

    {/* Transfer Modal */}
    {/* {showTransferModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModals}>
              ×
            </span>
            <h2>USDT Transfer</h2>
            <div>
              <label>Mode:</label>
              <select name="transferType">
                <option value="fromFutures">Futures -&gt; Spot</option>
                <option value="fromSpot">Spot -&gt; Futures</option>
              </select>
            </div>
            <div>
              <label>Amount:</label>
              <input type="number" min="1" max="100" />
              <span>(USDT)</span>
            </div>
            <button onClick={closeModals}>Transfer</button>
          </div>
        </div>
      )} */}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModals}>
              ×
            </span>
            <h2>Deposit Crypto</h2>
            <div className="custom-dropdown">
              <label>Choose Asset</label>
              <div
                className="custom-dropdown-selected"
                onClick={() => handleAssetChange(selectedAsset)}
              >
                {selectedAsset}
              </div>
              {/* Dropdown menu options */}
            </div>

            <div className="custom-dropdown">
              <label>Choose Network</label>
              <div
                className="custom-dropdown-selected"
                onClick={() => handleNetworkChange(selectedNetwork)}
              >
                {selectedNetwork}
              </div>
              {/* Dropdown menu options */}
            </div>

            <div>
              <label>Deposit Address</label>
              <div>{depositAddress}</div>
              <button onClick={copyAddress}>Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={toggleTransferModal}>
                ×
              </span>
              <h2>USDT Transfer</h2>
              <div>
                <label>Mode:</label>
                <select name="transferType" id="transfer-USDT-type">
                  <option value="fromFutures">Futures - Spot</option>
                  <option value="fromSpot">Spot - Futures</option>
                </select>
              </div>
              <div>
                <label>Amount:</label>
                <input type="number" id="transfer-USDT-amount" />
              </div>
              <button onClick={toggleTransferModal}>Transfer</button>


              {/* USDT Transfer Section */}
      <div className="transfer-section">
        <h3>USDT Transfer</h3>
        <select
          value={transferUSDTType}
          onChange={(e) => setTransferUSDTType(e.target.value)}
        >
          <option value="fromFutures">From Futures to Spot</option>
          <option value="fromSpot">From Spot to Futures</option>
        </select>
        <input
          type="number"
          value={transferUSDTAmount}
          onChange={(e) => setTransferUSDTAmount(e.target.value)}
          placeholder="USDT Amount"
        />
        <button onClick={transferUSDT}>Transfer</button>
      </div>
      
            </div>

          </div>
        )}

        {/* Deposit Modal */}
        {/* {showDepositModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={toggleDepositModal}>
                ×
              </span>
              <h2>Deposit Crypto</h2> */}
              {/* Add logic and content for the deposit modal here */}
            {/* </div>
          </div>
        )} */}

      {/* Partial Close Modal */}
      {closingPosition && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setClosingPosition(null)}>
              ×
            </span>
            <h2>Partial Close</h2>
            <input
              type="number"
              value={partialClosingPercent}
              onChange={(e) => setPartialClosingPercent(e.target.value)}
              min="1"
              max="100"
            />
            <button onClick={partialClose}>Confirm Partial Close</button>
          </div>
        </div>
      )}

      {/* Statistics and balances section */}
      {/* <div className="statistics-section">
        <h3>Statistics</h3>
        <p>Futures Balance: {futuresUSDTBalance} USDT</p>
        <p>Spot Balance: {spotUSDTBalance} USDT</p>
      </div> */}

      {/* <div className="tab">
        <button
          className={`tablinks ${activeTab === "futures" ? "active" : ""}`}
          onClick={() => handleTabChange("futures")}
        >
          Futures Trading
        </button>
        <button
          className={`tablinks ${activeTab === "spot" ? "active" : ""}`}
          onClick={() => handleTabChange("spot")}
        >
          Spot Trading
        </button>
      </div> */}


      

      

      

      

      

      
      {/* Tab navigation */}
      {/* <div className="tab-navigation">
        <button
          className={`tablinks ${activeTab === "futures" ? "active" : ""}`}
          onClick={() => handleTabClick("futures")}
        >
          Futures Trading
        </button>
        <button
          className={`tablinks ${activeTab === "spot" ? "active" : ""}`}
          onClick={() => handleTabClick("spot")}
        >
          Spot Trading
        </button>
      </div> */}

      {/* Tab content */}
      {/* {activeTab === "futures" && (
        <div className="trading-panel">
          <h3>Futures Trading Panel</h3> */}
          {/* Specific content for Futures tab */}
        {/* </div>
      )} */}

      {/* {activeTab === "spot" && (
        <div className="trading-panel">
          <h3>Spot Trading Panel</h3> */}
          {/* Specific content for Spot tab */}
        {/* </div>
      )} */}

      
    </div>
  );
};

export default TradingComponent;
