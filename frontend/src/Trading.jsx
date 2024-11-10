import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import "./trading.css";
import TradingViewWidget from "./TradingViewWidget";
const TradingApp = () => {
  const navigate = useNavigate();

  const assetTypes = [
    "BTC",
    "ETH",
    "BNB",
    "NEO",
    "LTC",
    "SOL",
    "XRP",
    "DOT",
    "PEOPLE",
  ];

  const [futuresAssetType, setFuturesAssetType] = useState("BTC");
  const [spotAssetType, setSpotAssetType] = useState("BTC");
  const [closingPosition, setClosingPosition] = useState({});
  const [selectedSpotChartSymbol, setSelectedSpotChartSymbol] =
    useState("MEXC:BTCUSDT");
  const [selectedFuturesChartSymbol, setSelectedFuturesChartSymbol] =
    useState("MEXC:BTCUSDT");

  let selectedNetwork = "ERC-20";
  let futuresUSDTBalance = 0;
  let spotBalances = [];
  let futuresPositionsCount = 0;
  let futuresClosedPositionsCount = 0;
  let spotPositionsCount = 0;
  let spotClosedPositionsCount = 0;
  let futuresCurrentPrices = [];
  let totalValue = 0;
  let spotUSDTBalance = 0;
  let spotCurrentPrices = [];
  let availableAmount = 0;
  let tradingEnable = true;
  let dropdownEnable = true;

  const options = [
    { imgSrc: "img/USDT.png", label: "USDT", balance: "0.00" },
    { imgSrc: "img/USDC.png", label: "USDC", balance: "0.00" },
    { imgSrc: "img/BNB.png", label: "BNB", balance: "0.00" },
  ];
  const networks = [
    { imgSrc: "img/ETH3.png", label: "ERC-20" },
    { imgSrc: "img/bsc.png", label: "BSC" },
    { imgSrc: "img/base.png", label: "Base" },
    { imgSrc: "img/arb.png", label: "Arbitrum One" },
  ];

  useEffect(() => {
    checkToken();
    if (localStorage.getItem("token") == null) {
      return;
    }
    loadUserData();
    hideSpot();
    return () => {
    };
  }, []);

  useEffect(() => {
    async function fetchFuturesCurrentPrices() {
      // tradingEnable = true;

      const futuresPriceResponse = await axios.post(
        "/api/market/getCurrentPrice",
        { accountType: "futures" },
        { headers: { "Content-Type": "application/json" } }
      );

      const futuresPriceData = await futuresPriceResponse.data;

      if (!futuresPriceData.ok) {
        throw new Error("Failed to fetch futures prices");
      }

      futuresCurrentPrices = futuresPriceData.currentPrices;

      let priceText = "<div class='money-bar'>";
      priceText += futuresPriceData.currentPrices
        .map(
          (price) =>
            `<div class='money-div'>
            <span class='money-type'>${price.assetType}:</span>
             <span class='money-value'>${new Intl.NumberFormat("en-US").format(
               price.price
             )}</span>&nbsp;&nbsp;
             <span class=${
               price.percent >= 0 ? "percent-plus" : "percent-minus"
             }>${(price.percent * 100).toFixed(2)}%&nbsp;</span>
             </div>`
        )
        .join("");

      priceText += "</div>";
      document.getElementById("futures-now-price").innerHTML = priceText;

      // console.log('future-price', futuresAssetType);
      let tmp = "";
      assetTypes.forEach((asset, index) => {
        if (asset != futuresAssetType) {
          tmp += `<div class="dropdown-option" id = "dropdown-option-${index}">
                      <span class="crypto-icon-small"><img src="icon/${asset}.png"></span>
                      <span class="money-type">${asset}_USDT:&nbsp; </span>
                      <span class="money-value">${Intl.NumberFormat(
                        "en-US"
                      ).format(
                        futuresCurrentPrices.find(
                          (item) => item.assetType === asset
                        ).price
                      )}</span>&nbsp;&nbsp;
                      <span class=${
                        futuresCurrentPrices.find(
                          (item) => item.assetType === asset
                        ).percent >= 0
                          ? "percent-plus"
                          : "percent-minus"
                      }>${(
            futuresCurrentPrices.find((item) => item.assetType === asset)
              .percent * 100
          ).toFixed(2)}% </span>
                      </div>`;
        }
      });

      document.getElementById("futures-dropdownOptions").innerHTML = tmp;
      document.getElementById(
        "futures-dropdownSelected"
      ).innerHTML = `<span class="crypto-icon-small"><img src="icon/${futuresAssetType}.png" style="width:48px;height:48px;"></span>
                      <span class="money-type">${futuresAssetType}_USDT:&nbsp;&nbsp;</span>
                      <span class="money-value">${Intl.NumberFormat(
                        "en-US"
                      ).format(
                        futuresCurrentPrices.find(
                          (item) => item.assetType === futuresAssetType
                        ).price
                      )}</span>&nbsp;&nbsp;
                      <span class=${
                        futuresCurrentPrices.find(
                          (item) => item.assetType === futuresAssetType
                        ).percent >= 0
                          ? "percent-plus"
                          : "percent-minus"
                      }>${(
        futuresCurrentPrices.find((item) => item.assetType === futuresAssetType)
          .percent * 100
      ).toFixed(2)}% </span>`;

      assetTypes.forEach((asset, index) => {
        if (asset != futuresAssetType) {
          document
            .getElementById("dropdown-option-" + index)
            .addEventListener("click", function () {
              futuresSelectOption(asset);
            });
        }
      });
    }

    async function fetchSpotCurrentPrices() {
      const spotPriceResponse = await axios.post(
        "/api/market/getCurrentPrice",
        {
          accountType: "spot",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const spotPriceData = await spotPriceResponse.data;
      if (!spotPriceData.ok) {
        throw new Error("Failed to fetch spot prices");
      }

      if (spotPriceData.currentPrices.length)
        spotCurrentPrices = spotPriceData.currentPrices;

      let priceText = "<div class='money-bar'>";
      priceText += spotPriceData.currentPrices
        .map(
          (price) =>
            `<div class='money-div'>
            <span class='money-type'>${price.assetType}:</span>
             <span class='money-value'>${new Intl.NumberFormat("en-US").format(
               price.price
             )}</span>&nbsp;&nbsp;
             <span class=${
               price.percent >= 0 ? "percent-plus" : "percent-minus"
             }>${(price.percent * 100).toFixed(2)}%&nbsp;</span>
             </div>`
        )
        .join("");

      priceText += "</div>";

      document.getElementById("spot-now-price").innerHTML = priceText;

      let tmp = "";
      assetTypes.forEach((asset, index) => {
        if (asset != spotAssetType) {
          tmp += `<div class="dropdown-option" id = "dropdown-option-spot-${index}">
                        <span class="crypto-icon-small"><img src="icon/${asset}.png"></span>
                        <span class="money-type">${asset}_USDT:&nbsp; </span>
                        <span class="money-value">${Intl.NumberFormat(
                          "en-US"
                        ).format(
                          spotCurrentPrices.find(
                            (item) => item.assetType === asset
                          ).price
                        )}</span>&nbsp;&nbsp;
                        <span class=${
                          spotCurrentPrices.find(
                            (item) => item.assetType === asset
                          ).percent >= 0
                            ? "percent-plus"
                            : "percent-minus"
                        }>${(
            spotCurrentPrices.find((item) => item.assetType === asset).percent *
            100
          ).toFixed(2)}% </span>
                        </div>`;
        }
      });

      document.getElementById("spot-dropdownOptions").innerHTML = tmp;
      document.getElementById(
        "spot-dropdownSelected"
      ).innerHTML = `<span class="crypto-icon-small"><img src="icon/${spotAssetType}.png" style="width:48px;height:48px;"></span>
                      <span class="money-type">${spotAssetType}_USDT:&nbsp; </span>
                        <span class="money-value">${Intl.NumberFormat(
                          "en-US"
                        ).format(
                          spotCurrentPrices.find(
                            (item) => item.assetType === spotAssetType
                          ).price
                        )}</span>&nbsp;&nbsp;
                        <span class=${
                          spotCurrentPrices.find(
                            (item) => item.assetType === spotAssetType
                          ).percent >= 0
                            ? "percent-plus"
                            : "percent-minus"
                        }>${(
        spotCurrentPrices.find((item) => item.assetType === spotAssetType)
          .percent * 100
      ).toFixed(2)}% </span>`;

      assetTypes.forEach((asset, index) => {
        if (asset != spotAssetType) {
          document
            .getElementById("dropdown-option-spot-" + index)
            .addEventListener("click", function () {
              spotSelectOption(asset);
            });
        }
      });
    }
    
    async function fetchUserData() {
      try {
        const balanceResponse = await axios.post(
          "/api/balance/getBalance",
          {},
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );
        const balanceData = await balanceResponse.data;
        if (!balanceData.ok) {
          throw new Error("Failed to fetch balance");
        }
        futuresUSDTBalance = balanceData.futuresUSDTBalance;
        spotUSDTBalance = balanceData.spotUSDTBalance;

        const positionsResponse = await axios.post(
          "/api/position/getPositions",
          {},
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );
        const positionsData = await positionsResponse.data;
        if (!positionsData.ok) {
          throw new Error("Failed to fetch positions");
        }
        processPositionsData(positionsData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    }

    function processPositionsData(data) {
      const futuresPositionsDiv = document.getElementById(
        "futures-open-positions"
      );
      const futuresOpenOrdersDiv = document.getElementById(
        "futures-open-orders"
      );
      const futuresClosedPositionsDiv = document.getElementById(
        "futures-closed-positions"
      );

      // const spotPositionsDiv = document.getElementById("spot-open-positions");
      const spotOpenOrdersDiv = document.getElementById("spot-open-orders");
      const spotClosedPositionsDiv = document.getElementById(
        "spot-closed-positions"
      );

      if (futuresPositionsDiv === null) return;

      let count = 0;
      let futuresUnrealizedPL = 0;
      let futuresPositionsAmount = 0;
      // futuresPositions
      if (data.futuresPositions && futuresCurrentPrices.length) {
        count =
          data.futuresPositions.length +
          data.futuresPositions.filter((position) => position.orderLimit === 1)
            .length;

        if (count !== futuresPositionsCount) {
          futuresPositionsDiv.innerHTML = ""; // Clear previous positions
          futuresOpenOrdersDiv.innerHTML = ""; // Clear previous limit orders
        }

        data.futuresPositions.forEach((position) => {
          // futuresBalances[assetTypes.indexOf(position.assetType) + 1] += position.amount;
          let currentPrice = futuresCurrentPrices.filter(
            (item) => item["assetType"] == position.assetType
          )[0].price;
          let unrealizedPL = calculateUnrealizedPL(
            position.entryPrice,
            currentPrice,
            position.amount,
            position.leverage,
            position.positionType
          );
          let positionDiv = document.createElement("div");

          if (position.orderLimit == 1) {
            let startTrading = 0;
            if (
              (position.entryPrice < position.limitPrice &&
                position.limitPrice < currentPrice) ||
              (position.entryPrice > position.limitPrice &&
                position.limitPrice > currentPrice)
            ) {
              const response = axios.post(
                "/api/trade/startTrade",
                {
                  positionId: position.id,
                },
                {
                  headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json",
                  },
                }
              );
              const data = response.data;
              if (!data.ok) {
                console.error("Error starting Trade:", data);
              }

              position.orderLimit = 0;
            } else {
              unrealizedPL = 0;
            }
          }
          if (
            unrealizedPL < 0 &&
            Math.abs(unrealizedPL) >= position.amount * 0.8
          ) {
            alert(
              "unrealizedPL: " +
                unrealizedPL +
                "position.amount: " +
                position.amount
            );
            futuresUnrealizedPL -= position.amount;
            futuresPositionsAmount += position.amount;
            closeFuturesPosition(position, 3);
            return;
          } else {
            futuresUnrealizedPL += unrealizedPL;
            // if (!position.orderLimit)
            futuresPositionsAmount += position.amount;
            if (
              (position.positionType == "Long" && currentPrice > position.tp) ||
              (position.positionType == "Short" && currentPrice < position.tp)
            ) {
              closeFuturesPosition(position, 1);
              return;
            }
            if (
              (position.positionType == "Long" && currentPrice < position.sl) ||
              (position.positionType == "Short" && currentPrice > position.sl)
            ) {
              closeFuturesPosition(position, 2);
              return;
            } else {
              if (count !== futuresPositionsCount) {
                positionDiv.textContent = `
                                        ${1 - position.orderLimit}-${
                  position.orderType
                }-${position.positionType}- ${position.assetType}- 
                                        Amount: $${position.amount},
                                        Leverage: ${position.leverage}X, 
                                        Entry: $${position.entryPrice},
                                    `;
                if (position.orderType == "limit")
                  positionDiv.textContent += ` Limit Price: $${position.limitPrice},`;

                let liquidationPrice = 0;
                if (position.positionType == "Short")
                  liquidationPrice =
                    (position.entryPrice * (125 + position.leverage / 100)) /
                    125;
                if (position.positionType == "Long")
                  liquidationPrice =
                    (position.entryPrice * (125 - 100 / position.leverage)) /
                    125;

                positionDiv.textContent += ` Liquidation: $${liquidationPrice.toFixed(
                  2
                )},`;

                const unPLLabel = document.createElement("label");
                unPLLabel.textContent = `Unrealized P/L: $${unrealizedPL.toFixed(
                  2
                )},`;
                unPLLabel.id = "un" + position.id;
                positionDiv.appendChild(unPLLabel);

                const tpLabel = document.createElement("label");
                tpLabel.textContent = "TP: ";
                positionDiv.appendChild(tpLabel);

                const tpInput = document.createElement("input");
                tpInput.type = "number";
                tpInput.id = "tp" + position.id;
                tpInput.style.width = "80px";
                if (position.tp > 0 && position.tp < 10000000)
                  tpInput.value = position.tp;
                positionDiv.appendChild(tpInput);

                const slLabel = document.createElement("label");
                slLabel.textContent = "SL: ";
                positionDiv.appendChild(slLabel);

                const slInput = document.createElement("input");
                slInput.type = "number";
                slInput.id = "sl" + position.id;
                slInput.style.width = "80px";
                if (position.sl > 0 && position.sl < 10000000)
                  slInput.value = position.sl;
                positionDiv.appendChild(slInput);

                const saveButton = document.createElement("button");
                saveButton.textContent = "Save";
                saveButton.addEventListener("click", function () {
                  saveTPSL(position);
                });
                saveButton.onClick = () => saveTPSL(position);
                positionDiv.appendChild(saveButton);
                positionDiv.append(" ");

                // Create close button
                const closeButton = document.createElement("button");
                closeButton.textContent = "Close";
                closeButton.addEventListener("click", function () {
                  setClosingPosition(position);
                  document.getElementById(
                    "partial-closing-modal"
                  ).style.display = "block";
                });
                positionDiv.appendChild(closeButton); // Add close button to position div

                if (position.orderType == "market") {
                  if (position.positionType == "Long")
                    positionDiv.style.backgroundColor = "#232323";
                  if (position.positionType == "Short")
                    positionDiv.style.backgroundColor = "#464646";
                }
                if (position.orderType == "limit") {
                  if (position.orderLimit == 0) {
                    if (position.positionType == "Long")
                      positionDiv.style.backgroundColor = "#853467";
                    if (position.positionType == "Short")
                      positionDiv.style.backgroundColor = "#925743";
                  } else {
                    if (position.positionType == "Long")
                      positionDiv.style.backgroundColor = "#295843";
                    if (position.positionType == "Short")
                      positionDiv.style.backgroundColor = "#694456";
                  }
                }

                if (position.orderLimit) {
                  futuresOpenOrdersDiv.appendChild(positionDiv);
                } else {
                  futuresPositionsDiv.appendChild(positionDiv);
                }
              } else {
                document.getElementById("un" + position.id).textContent =
                  "Unrealized P/L: " + unrealizedPL.toFixed(2) + ",";
              }
            }
          }
        });
        futuresPositionsCount = count;
        // setFuturesPositionsCount(count)
      }
      if (data.closedFuturesPositions) {
        count = data.closedFuturesPositions.length;
        if (count !== futuresClosedPositionsCount)
          futuresClosedPositionsDiv.innerHTML = ""; // Clear previous closed positions

        data.closedFuturesPositions.forEach((position) => {
          let positionDiv = document.createElement("div");

          if (count !== futuresClosedPositionsCount) {
            positionDiv.textContent = `
                                    ${1 - position.orderLimit}-${
              position.orderType
            }-${position.positionType}-${position.assetType}- 
                                    Amount: $${position.amount},
                                    Leverage: ${position.leverage}X, 
                                    Entry: $${position.entryPrice},
                                    Exit: $${position.exitPrice},
                                `;
            if (position.orderType == "limit")
              positionDiv.textContent += ` Limit Price: $${position.limitPrice},`;

            let liquidationPrice = 0;
            if (position.positionType == "Short")
              liquidationPrice =
                (position.entryPrice * (125 + position.leverage / 100)) / 125;
            if (position.positionType == "Long")
              liquidationPrice =
                (position.entryPrice * (125 - 100 / position.leverage)) / 125;

            positionDiv.textContent += ` Liquidation: $${liquidationPrice.toFixed(
              2
            )},`;

            if (position.tp != 0 && position.tp != 100000000) {
              positionDiv.textContent += ` TP: $${position.tp.toFixed(2)},`;
            }

            if (position.sl != 0 && position.sl != 100000000) {
              positionDiv.textContent += ` SL: $${position.sl.toFixed(2)},`;
            }

            positionDiv.textContent += ` realized P/L: $${position.realizedPL.toFixed(
              2
            )},`;

            let closedReason = "";
            switch (position.closedReason) {
              case 0:
                closedReason = "by User";
                break;
              case 1:
                closedReason = "by TP";
                break;
              case 2:
                closedReason = "by SL";
                break;
              case 3:
                closedReason = "by Liquidaion";
                break;
              case 4:
                closedReason = "partially";
                break;
            }

            positionDiv.textContent += ` closed ${closedReason},`;

            if (position.orderType == "market") {
              if (position.positionType == "Long")
                positionDiv.style.backgroundColor = "#232323";
              if (position.positionType == "Short")
                positionDiv.style.backgroundColor = "#464646";
            }
            if (position.orderType == "limit") {
              if (position.orderLimit == 0) {
                if (position.positionType == "Long")
                  positionDiv.style.backgroundColor = "#853467";
                if (position.positionType == "Short")
                  positionDiv.style.backgroundColor = "#925743";
              } else {
                if (position.positionType == "Long")
                  positionDiv.style.backgroundColor = "#295843";
                if (position.positionType == "Short")
                  positionDiv.style.backgroundColor = "#694456";
              }
            }

            futuresClosedPositionsDiv.appendChild(positionDiv);
          }
        });
        futuresClosedPositionsCount = count;
        // setFuturesClosedPositionsCount(count)
      }
      
      spotBalances = [];
      spotBalances.push(spotUSDTBalance);
      assetTypes.forEach((asset) => {
        spotBalances.push(0);
      });

      if (data.spotPositions && spotCurrentPrices.length) {
        count =
          data.spotPositions.length +
          data.spotPositions.filter((position) => position.orderLimit == 1)
            .length;
        if (count !== spotPositionsCount) {
          // spotPositionsDiv.innerHTML = ""; // Clear previous positions
          spotClosedPositionsDiv.innerHTML = ""; // Clear previous positions
          spotOpenOrdersDiv.innerHTML = ""; // Clear previous limit orders
        }
        // data.spotPositions.forEach((position) => {
        //   spotBalances[assetTypes.indexOf(position.assetType) + 1] = 0;
        // });
        data.spotPositions.forEach((position) => {
          if (position.positionType == "buy") {
            spotBalances[assetTypes.indexOf(position.assetType) + 1] +=
              parseFloat(position.amount);
          }
          if (position.positionType == "sell") {
            spotBalances[assetTypes.indexOf(position.assetType) + 1] -=
              parseFloat(position.amount);
          }

          let currentPrice = spotCurrentPrices.filter(
            (item) => item.assetType == position.assetType
          )[0].price;

          if (position.orderLimit == 1) {
            let startTrading = 0;
            if (
              (position.entryPrice < position.limitPrice &&
                position.limitPrice < currentPrice) ||
              (position.entryPrice > position.limitPrice &&
                position.limitPrice > currentPrice)
            ) {
              fetch("/api/trade/startTrade", {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + localStorage.getItem("token"),
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  positionId: position.id,
                }),
              })
                .then((response) => response.json())
                .catch((error) =>
                  console.error("Error starting spot Trading:", error)
                );
              position.orderLimit = 0;
            }
          }
          let positionDiv = document.createElement("div");

          if (count !== spotPositionsCount) {
            positionDiv.textContent = `
                                    ${1 - position.orderLimit}-${
              position.orderType
            }-${position.positionType}-  
                                    Amount: ${position.amount} (${
              position.assetType
            })-
                                    Entry Price: ${position.entryPrice}(USDT),
                                `;
            if (position.orderType == "limit")
              positionDiv.textContent += ` Limit Price: $${position.limitPrice},`;

            if (position.orderType == "market") {
              if (position.positionType == "buy")
                positionDiv.style.backgroundColor = "#232323";
              if (position.positionType == "Sell")
                positionDiv.style.backgroundColor = "#464646";
            }
            if (position.orderType == "limit") {
              if (position.orderLimit == 0) {
                if (position.positionType == "buy")
                  positionDiv.style.backgroundColor = "#853467";
                if (position.positionType == "sell")
                  positionDiv.style.backgroundColor = "#925743";
              } else {
                if (position.positionType == "buy")
                  positionDiv.style.backgroundColor = "#295843";
                if (position.positionType == "sell")
                  positionDiv.style.backgroundColor = "#694456";
              }
            }

            if (position.orderLimit) {
              const closeButton = document.createElement("button");
              closeButton.textContent = "Close";
              closeButton.onClick = () => {
                closeSpotPosition(position);
              };
              positionDiv.appendChild(closeButton); // Add close button to position div

              spotOpenOrdersDiv.appendChild(positionDiv);
            } else {
              // spotPositionsDiv.appendChild(positionDiv);
              spotClosedPositionsDiv.appendChild(positionDiv);
            }
          }
        });
        if (spotPositionsCount == count && spotBalances[spotAssetType] == 0) {
          spotClosedPositionsDiv.innerHTML = "";
        }
        spotPositionsCount = count;
        // setSpotPositionsCount(count)
      }


      if (spotCurrentPrices.length) {
        spotBalancesUpdate();

        //---------------futures statistics--------------------------------
        let statisticsBar = "";
        statisticsBar +=
          "<span class='money-type'>Est. Futures Balance (USDT):</span>";
        statisticsBar +=
          "<span class='money-value'>" +
          new Intl.NumberFormat("en-US").format(futuresUSDTBalance.toFixed(2)) +
          "</span>";
        statisticsBar += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        statisticsBar +=
          "<span class='money-type'>Est. Futures Value (USDT):</span>";
        statisticsBar +=
          "<span class='money-value'>" +
          new Intl.NumberFormat("en-US").format(
            (
              futuresUSDTBalance +
              futuresPositionsAmount +
              futuresUnrealizedPL
            ).toFixed(2)
          ) +
          "</span>";
        statisticsBar += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        statisticsBar +=
          "<span class='money-type'>Est. Futures Cost (USDT):</span>";
        statisticsBar +=
          "<span class='money-value'>" +
          Intl.NumberFormat("en-US").format(futuresPositionsAmount) +
          "</span>";
        statisticsBar += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        statisticsBar +=
          "<span class='money-type'>Est. Futures Unrealized PNL (USDT):</span>";
        statisticsBar +=
          "<span class='money-value'>" +
          Intl.NumberFormat("en-US").format(futuresUnrealizedPL.toFixed(2)) +
          "</span>";
        document.getElementById("futures-statistics").innerHTML = statisticsBar;

        //----------------spot statistics---------------------------------------
        statisticsBar = "";
        statisticsBar +=
          "<span class='money-type'>Est. Spot Balance (USDT):</span>";
        statisticsBar +=
          "<span class='money-value'>" +
          new Intl.NumberFormat("en-US").format(spotUSDTBalance.toFixed(2)) +
          "</span>";
        statisticsBar += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        statisticsBar +=
          "<span class='money-type'>Est. Spot Value (USDT):</span>";
        // console.log('spotUSDTBalance = ', spotUSDTBalance)
        let spotValue = parseFloat(spotUSDTBalance);
        // console.log(spotBalances);
        // console.log("--spot--", spotCurrentPrices, spotBalances);
        spotBalances.forEach((balance, index) => {
          if (index > 0) {
            spotValue +=
              parseFloat(balance) *
              spotCurrentPrices.filter(
                (item) => item.assetType == assetTypes[index - 1]
              )[0].price;
          }
        });
        // console.log('spotValue = ', spotValue)
        statisticsBar +=
          "<span class='money-value'>" +
          new Intl.NumberFormat("en-US").format(spotValue.toFixed(2)) +
          "</span>";

        document.getElementById("spot-statistics").innerHTML = statisticsBar;
        //---------------spot asset statistics-----------------------------------
        statisticsBar = "<span class='money-type'>Est. Balances: </span>";
        spotBalances.forEach((balance, index) => {
          if (!index) {
            statisticsBar +=
              "<span class='money-value'>" +
              new Intl.NumberFormat("en-US").format(balance.toFixed(2)) +
              "</span>";
            statisticsBar += "<span class='money-unit'> USDT</span>";
            statisticsBar += "&nbsp;&nbsp;&nbsp;&nbsp;";
          } else {
            if (assetTypes[index - 1] == spotAssetType) {
              statisticsBar +=
                "<span class='money-value'>" +
                // new Intl.NumberFormat("en-US").format(balance.toFixed(5)) +
                balance.toFixed(5) +
                "</span>";
              statisticsBar +=
                "<span class='money-unit'> " +
                assetTypes[index - 1] +
                "</span>";
              statisticsBar += "&nbsp;&nbsp;&nbsp;&nbsp;";
            }
          }
          // if (index % 10 == 9) statisticsBar += "<br>";
        });

        document.getElementById("spot-assets-statistics").innerHTML =
          statisticsBar;

        //------------------- total statistics --------------------
        statisticsBar = "";
        statisticsBar +=
          "<span class='money-type'>Est. Total Balance (USDT):</span>";
        statisticsBar +=
          "<span class='money-value'>" +
          new Intl.NumberFormat("en-US").format(
            (futuresUSDTBalance + spotUSDTBalance).toFixed(2)
          ) +
          "</span>";
        statisticsBar += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        statisticsBar +=
          "<span class='money-type'>Est. Total Value (USDT):</span>";
        // setTotalValue(spotUSDTBalance);
        totalValue = spotUSDTBalance;
        // console.log('totalValue = ', totalValue)

        spotBalances.forEach((balance, index) => {
          if (index > 0) {
            const newValue =
              parseFloat(balance) *
              spotCurrentPrices.filter(
                (item) => item.assetType == assetTypes[index - 1]
              ).price;
            // setTotalValue(prev=>prev+newValue);
            totalValue += newValue;
          }
        });
        // totalValue += (parseFloat(futuresUSDTBalance) + parseFloat(futuresPositionsAmount) + parseFloat(futuresUnrealizedPL));
        let sum =
          spotUSDTBalance +
          futuresUSDTBalance +
          futuresPositionsAmount +
          futuresUnrealizedPL;
        let res = new Intl.NumberFormat("en-US").format(sum.toFixed(2));
        statisticsBar += `<span class='money-value'>` + res + `</span>`;
        document.getElementById("total-statistics").innerHTML = statisticsBar;
        //---------------------------------------------------------
        fetch("/api/updateValue", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            futuresPositionsAmount,
            futuresUnrealizedPL,
            spotValue,
            totalValue,
          }),
        })
          .then((response) => response.json())
          .catch((error) => console.error());
      }
    }

    const intervalId1 = setInterval(fetchFuturesCurrentPrices, 1000);
    const intervalId2 = setInterval(fetchSpotCurrentPrices, 1000);
    const intervalId3 = setInterval(fetchUserData, 1000);

    return () => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
      clearInterval(intervalId3);
    };
  }, [futuresAssetType, spotAssetType]);

  useEffect(() => {
    var span1 = document.getElementsByClassName("close")[0];
    var span2 = document.getElementsByClassName("close")[1];
    if (span1 != undefined) {
      span1.onClick = function () {
        document.getElementById("partial-closing-modal").style.display = "none";
      };
    }
    if (span2 != undefined) {
      span2.onClick = function () {
        document.getElementById("transfer-USDT-modal").style.display = "none";
      };
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onClick = function (event) {
      if (event.target == document.getElementById("partial-closing-modal")) {
        document.getElementById("partial-closing-modal").style.display = "none";
      }
      if (event.target == document.getElementById("transfer-USDT-modal")) {
        document.getElementById("transfer-USDT-modal").style.display = "none";
      }
    };
  }, []);

  const checkToken = () => {
    if (localStorage.getItem("token") == null) {
      // alert("Please login!");
      navigate("/login");
    }
  };

  function addValidationEventListener() {
    // Adding the validation event listeners to input fields
  }

  function copyAddress() {
    const address = document.getElementById("address").innerText;
    navigator.clipboard
      .writeText(address)
      .then(() => {
        alert("Address copied to clipboard");
      })
      .catch((err) => {
        alert("Failed to copy address");
      });
  }

  const loadUserData = async () => {
    // Fetch user data from API

    try {
      const response = await axios.post(
        "/api/balance/getBalance",
        {},
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      const data = await response.data;
      availableAmount = parseFloat(
        data.futuresUSDTBalance + data.spotUSDTBalance
      ); // Set available balance to variable
      // setAvailableAmount(availableAmount);
      // availableAmount = availableAmount;
      document.getElementById("availableAmount").textContent =
        availableAmount.toFixed(3); // Display formatted balance
      document.getElementById("welcome-message-duplicate").textContent =
        data.username;
      document.getElementById("address").textContent = data.address;

      // Now that the balance is set, add the validation listener
      addValidationEventListener();
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  function transferUSDT() {
    const transferUSDTType =
      document.getElementById("transfer-USDT-type").value;
    const transferUSDTAmount = parseFloat(
      document.getElementById("transfer-USDT-amount").value
    );
    if (transferUSDTType == "fromFutures") {
      if (transferUSDTAmount > futuresUSDTBalance) {
        alert("Insufficient USDT in the Futures account");
        return;
      } else {
        futuresUSDTBalance -= transferUSDTAmount;
        spotUSDTBalance += transferUSDTAmount;
      }
    }
    if (transferUSDTType == "fromSpot") {
      if (transferUSDTAmount > spotUSDTBalance) {
        alert("Insufficient USDT in the Spot account");
        return;
      } else {
        // console.log(futuresUSDTBalance, spotUSDTBalance);
        futuresUSDTBalance += transferUSDTAmount;
        spotUSDTBalance -= transferUSDTAmount;
        // console.log(futuresUSDTBalance, spotUSDTBalance);
      }
    }
    document.getElementById("transfer-modal-futures-USDT").textContent =
      futuresUSDTBalance.toFixed(2);
    document.getElementById("transfer-modal-spot-USDT").textContent =
      spotUSDTBalance.toFixed(2);
    fetch("/api/balance/updateBalance", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        futuresUSDTBalance,
        spotUSDTBalance,
      }),
    })
      .then((response) => {
        alert("Operation completed successfully!");
        response.json();
      })
      .catch((error) => console.error());
  }

  function futuresSelectOption(value) {
    setFuturesAssetType(value);
    let selectedSymbol = `MEXC:${value}USDT`;
    setSelectedFuturesChartSymbol(selectedSymbol);
    futuresPositionsCount = 0;
    futuresClosedPositionsCount = 0;
    document.getElementById("futures-dropdownOptions").style.display = "none";
  } 

  function spotSelectOption(value) {
    setSpotAssetType(value);
    let selectedSymbol = `MEXC:${value}USDT`;
    setSelectedSpotChartSymbol(selectedSymbol);
    spotPositionsCount = 0;
    spotClosedPositionsCount = 0;
    document.getElementById("spot-dropdownOptions").style.display = "none";
  }

  function showFuturesAssetsList() {
    const isVisible =
      document.getElementById("futures-dropdownOptions").style
        .display === "block";
    document.getElementById("futures-dropdownOptions").style.display =
      isVisible ? "none" : "block";
  }

  function showSpotAssetsList() {
    const isVisible =
      document.getElementById("spot-dropdownOptions").style
        .display === "block";
    document.getElementById("spot-dropdownOptions").style.display =
      isVisible ? "none" : "block";
  }

  function spotBalancesUpdate() {
    const container = document.getElementById("transfer-crypto-assets");
    container.innerHTML = "";

    const separator = document.createElement("hr");
    separator.className = "separator2";
    container.appendChild(separator);

    const optionDiv = document.createElement("div");
    optionDiv.className = "custom-dropdown-option";
    optionDiv.style.fontSize = "14px";
    optionDiv.style.display = "flex";
    optionDiv.style.alignItems = "center";
    optionDiv.style.justifyContent = "space-between";
    optionDiv.style.padding = "10px";

    const innerDiv = document.createElement("div");
    innerDiv.style.display = "flex";
    innerDiv.style.alignItems = "center";

    const img = document.createElement("img");
    img.src = `icon/USDT.png`;
    img.style.width = "24px";
    img.style.height = "24px";

    const assetTypeSpan = document.createElement("span");
    assetTypeSpan.style.marginLeft = "10px";
    assetTypeSpan.textContent = "USDT ";

    innerDiv.appendChild(img);
    innerDiv.appendChild(assetTypeSpan);

    const assetAmountSpan = document.createElement("span");
    assetAmountSpan.style.fontSize = "14px";
    assetAmountSpan.style.fontWeight = "bold";
    assetAmountSpan.style.color = "#929292";
    assetAmountSpan.textContent = `${spotBalances[0].toFixed(4)}`;

    optionDiv.appendChild(innerDiv);
    optionDiv.appendChild(assetAmountSpan);

    container.appendChild(optionDiv);

    spotBalances.forEach((asset, index) => {
      if (index > 0) {
        const optionDiv = document.createElement("div");
        optionDiv.className = "custom-dropdown-option";
        optionDiv.style.fontSize = "14px";
        optionDiv.style.display = "flex";
        optionDiv.style.alignItems = "center";
        optionDiv.style.justifyContent = "space-between";
        optionDiv.style.padding = "10px";

        const innerDiv = document.createElement("div");
        innerDiv.style.display = "flex";
        innerDiv.style.alignItems = "center";

        const img = document.createElement("img");
        img.src = `icon/${assetTypes[index-1]}.png`;
        img.style.width = "24px";
        img.style.height = "24px";

        const assetTypeSpan = document.createElement("span");
        assetTypeSpan.style.marginLeft = "10px";
        assetTypeSpan.textContent = assetTypes[index-1] + "  ";

        innerDiv.appendChild(img);
        innerDiv.appendChild(assetTypeSpan);

        const assetAmountSpan = document.createElement("span");
        assetAmountSpan.style.fontSize = "14px";
        assetAmountSpan.style.fontWeight = "bold";
        assetAmountSpan.style.color = "#929292";
        assetAmountSpan.textContent = `${asset.toFixed(6)}`;

        optionDiv.appendChild(innerDiv);
        optionDiv.appendChild(assetAmountSpan);

        container.appendChild(optionDiv);
      }
    });

    document
    .querySelectorAll(".custom-dropdown")
    .forEach((dropdown) => {
      const selected = dropdown.querySelector(
        ".custom-dropdown-selected"
      );
      const options = dropdown.querySelector(
        ".custom-dropdown-options"
      );

      selected.addEventListener("click", () => {
        dropdown.classList.toggle("open");
      });

      options
        .querySelectorAll(".custom-dropdown-option")
        .forEach((option) => {
          option.addEventListener("click", () => {
            selected.querySelector(
              ".custom-dropdown-selected-text"
            ).textContent = option.textContent;
            dropdown.classList.remove("open");
          });
        });

      // Close dropdown when clicking outside
      window.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) {
          dropdown.classList.remove("open");
        }
      });
    });
  }

  function hideSpot() {
    document.getElementById("spot").style.display = "none";
    document.getElementById("defaultOpen").classList.add("active");
  }

  function calculateUnrealizedPL(
    entryPrice,
    currentPrice,
    amount,
    leverage,
    positionType
  ) {
    let profitLoss = 0;
    const priceDifference = (currentPrice - entryPrice) / entryPrice; // Percentage change

    if (positionType === "Long") {
      profitLoss = amount * priceDifference; // Long: profit when price goes up
    } else if (positionType === "Short") {
      profitLoss = amount * -priceDifference; // Short: profit when price goes down
    }

    return profitLoss * leverage;
  }

  function saveTPSL(position) {
    let tp = parseFloat(document.getElementById("tp" + position.id).value);
    if (isNaN(tp) || tp == 0) {
      if (position.positionType == "Long") {
        tp = 100000000;
      } else {
        tp = 0;
      }
    }
    let sl = parseFloat(document.getElementById("sl" + position.id).value);
    if (isNaN(sl) || sl == 0) {
      if (position.positionType == "Long") {
        sl = 0;
      } else {
        sl = 100000000;
      }
    }
    fetch("/api/position/saveTPSL", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        positionId: position.id,
        tp,
        sl,
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.error("Error saving TP & SL:", error));
  }

  function closeSpotPosition(position) {
    if (!position.orderLimit) return;
    fetch("/api/position/closeSpotPosition", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        positionId: position.id, // Assuming each position has a unique ID
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // updateBalanceDisplay();
        // fetchUserData(); // Refresh user data
        alert("Limit order of spot trading was closed by user");
      })
      .catch((error) => {
        console.error("Error closing position:", error);
        alert("Error closing position. Please try again.");
      });
  }

  function partialClose() {
    let percent = parseFloat(
      document.getElementById("particalClosingPercent").value
    );
    if (percent == 0) {
      alert("Please select a valid percent");
    }
    if (percent == 100) {
      closeFuturesPosition(closingPosition, 0);
    } else {
      fetch("/api/partialClosePosition", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positionId: closingPosition.id, // Assuming each position has a unique ID
          percent,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          // Update futuresUSDTBalance after closing position
          futuresUSDTBalance += data.profitLoss; // Assuming the server returns the profit/loss
          // updateBalanceDisplay();
          // fetchUserData(); // Refresh user data
          alert("Position partially closed by " + percent + "%.");
          futuresPositionsCount = 0;
          futuresClosedPositionsCount = 0;
        })
        .catch((error) => {
          console.error("Error closing position:", error);
          alert("Error closing position. Please try again.");
        });
    }
    document.getElementById("partial-closing-modal").style.display = "none";
  }
  // Close position function
  function closeFuturesPosition(position, reason) {
    fetch("/api/position/closeFuturesPosition", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        positionId: position.id, // Assuming each position has a unique ID
        reason,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Update futuresUSDTBalance after closing position
        futuresUSDTBalance += data.profitLoss; // Assuming the server returns the profit/loss
        // updateBalanceDisplay();
        // fetchUserData(); // Refresh user data
        switch (reason) {
          case 0:
            alert("Position closed manully by user.");
            break;
          case 1:
            alert("Position closed automatically by TP.");
            break;
          case 2:
            alert("Position closed automatically by SL.");
            break;
          case 3:
            alert(
              "Position closed because you lost all money because of liquidation."
            );
            break;
        }
      })
      .catch((error) => {
        console.error("Error closing position:", error);
        alert("Error closing position. Please try again.");
      });
  }

  function selectTrading(evt, divId) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(divId).style.display = "block";
    evt.currentTarget.className += " active";
  }

  async function futuresTrading(positionType, orderType) {
    if(!tradingEnable)return;
    tradingEnable = false;

    let betAmount = 0;
    let leverage = 0;
    let limitPrice = 0;
    if (orderType == "market") {
      betAmount = parseFloat(document.getElementById("bet-amount").value);
      leverage = parseFloat(document.getElementById("bet-leverage").value);
    }
    if (orderType == "limit") {
      betAmount = parseFloat(document.getElementById("limit-amount").value);
      leverage = parseFloat(document.getElementById("limit-leverage").value);
      limitPrice = parseFloat(document.getElementById("limit-price").value);
      if (isNaN(limitPrice)) {
        alert("Please enter a valid Limit Price");
        tradingEnable = true;
        return;
      }
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      alert("Please enter a valid bet amount.");
      tradingEnable = true;
      return;
    }
    if (isNaN(leverage) || leverage < 1 || leverage > 300) {
      alert("Please enter a valid bet amount.");
      tradingEnable = true;
      return;
    }

    fetch("/api/position/openFuturesPosition", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        futuresAssetType,
        positionType: positionType === "long" ? "Long" : "Short",
        orderType: orderType,
        amount: betAmount,
        leverage: leverage,
        limitPrice: limitPrice,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          tradingEnable = true;
          throw new Error("Network response was not ok");
        }
        tradingEnable = true;
        return response.json();
      })
      .then((data) => {
        //fetchUserData();
        tradingEnable = true;
        alert(`Placed a ${positionType} bet of $${betAmount}`);
      })
      .catch((error) => {
        tradingEnable = true;
        console.error("Error placing bet:", error);
        alert("Error placing bet. Please try again.");
      });
  }

  function generateQRCode() {
    const qrCodeImg = document.getElementById("qr-code");
    const address = document.getElementById("address").innerText;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      address
    )}&size=150x150`;
    qrCodeImg.src = qrCodeUrl;
    qrCodeImg.style.display = "block"; // Show the QR code image
  }

  function spotTrading(positionType, orderType) {
    if(!tradingEnable)return;
    tradingEnable = false;

    let amount = 0;
    let limitPrice = 0;
    if (orderType == "market") {
      amount = parseFloat(document.getElementById("spot-market-amount").value);
    }
    if (orderType == "limit") {
      amount = parseFloat(document.getElementById("spot-limit-amount").value);
      limitPrice = parseFloat(
        document.getElementById("spot-limit-price").value
      );
      if (isNaN(limitPrice)) {
        alert("Please enter a valid Limit Price");
        tradingEnable = true;
        return;
      }
    }

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      tradingEnable = true;
      return;
    }

    if (positionType == "buy") {
      if (
        spotUSDTBalance <
        amount *
          spotCurrentPrices.filter((item) => item.assetType == spotAssetType)[0].price
      ) {
        console.log(spotUSDTBalance, amount, spotCurrentPrices);
        alert("Insufficient USDT");
        tradingEnable = true;
        return;
      }
    }

    if (positionType == "sell") {
      if (amount > spotBalances[assetTypes.indexOf(spotAssetType) + 1]) {
        alert("Insufficient " + spotAssetType + amount + "/" +spotBalances[assetTypes.indexOf(spotAssetType) + 1]  + "/" +  (assetTypes.indexOf(spotAssetType) + 1) + ":" + spotBalances.length);
        tradingEnable = true;
        return;
      }
    }

    fetch("/api/openSpotPosition", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spotAssetType,
        positionType,
        orderType,
        amount,
        limitPrice,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          tradingEnable = true;
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        alert(`${positionType} ${amount} ${spotAssetType}`);
        tradingEnable = true;
      })
      .catch((error) => {
        tradingEnable = true;
        console.error("Error placing bet:", error);
        alert("Error placing bet. Please try again.");
      });
  }

  function validateForm() {
    const amountInput = document.getElementById("amountInput");
    const addressInput = document.getElementById("addressInput");
    const amountValue = amountInput.value.trim();
    const isValidAmount =
      !amountValue.startsWith("0") &&
      !isNaN(parseFloat(amountValue)) &&
      parseFloat(amountValue) >= 10 &&
      parseFloat(amountValue) <= availableAmount;
    const withdrawButton = document.getElementById("withdrawButton");
    // Check if there are any error messages or if inputs are invalid
    if (addressInput.value.length === 42 && isValidAmount) {
      withdrawButton.disabled = false;
    } else {
      withdrawButton.disabled = true;
    }
  }

  return (
    <div className="container">
      <div className="main-content">
        {/* <!-- Navigation --> */}
        <div
          style={{
            padding: "0 20px",
            justifyContent: "space-between",
            width: "100%",
            display: "flex",
            height: "64px",
            backgroundColor: "#383839",
            position: "absolute",
            zIndex: 100,
            alignSelf: "center",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* <!--left--> */}
          <div
            className="nav-left"
            style={{ flexDirection: "row", display: "flex" }}
          >
            <div className="tab">
              <button
                className="tablinks"
                onClick={(event) => selectTrading(event, "futures")}
                id="defaultOpen"
              >
                Futures Trading
              </button>
              <button
                className="tablinks"
                onClick={(event) => selectTrading(event, "spot")}
              >
                Spot Trading
              </button>
            </div>
          </div>

          {/* <!--right--> */}
          <div
            className="nav-right"
            style={{ flexDirection: "row", display: "flex" }}
          >
            <button
              style={{ height: "60px", width: "120px", marginRight: "10px" }}
              className="deposit-btn"
              id="transfer-USDT-btn"
              onClick={() => {
                document.getElementById("transfer-USDT-modal").style.display =
                  "block";
                document.getElementById(
                  "transfer-modal-futures-USDT"
                ).textContent = futuresUSDTBalance.toFixed(2);
                document.getElementById(
                  "transfer-modal-spot-USDT"
                ).textContent = spotUSDTBalance.toFixed(2);
              }}
            >
              <i
                style={{ marginRight: "10px" }}
                className="fas fa-arrow-right-arrow-left"
              ></i>
              Transfer
            </button>

            <button
              style={{ height: "60px" }}
              className="deposit-btn"
              id="deposit-btn"
              onClick={() => {
                document
                  .getElementById("popup-modal")
                  .setAttribute("style", "display: block");
                setTimeout(generateQRCode, 500);
              }}
            >
              <i style={{ marginRight: "10px" }} className="fas fa-wallet"></i>
              Deposit
            </button>

            {/* <!-- Modal Structure --> */}
            <div id="popup-modal" className="popup-modal">
              <div className="popup-modal-content">
                <div id="user-info">
                  <div className="zaclose">
                    <img
                      src="img/close.png"
                      id="popup-close-btn"
                      className="closee"
                      onClick={() => {
                        document
                          .getElementById("popup-modal")
                          .setAttribute("style", "display: none");
                      }}
                    />
                    <h2 style={{ fontSize: "20px" }}>Transfer Crypto</h2>
                  </div>
                  <div className="deposit-header"></div>
                  <div className="toggle-buttons-custom">
                    <button
                      id="deposit-toggle-custom"
                      style={{
                        fontSize: "14px",
                        borderRadius: "10px",
                        paddingTop: "11px",
                      }}
                      className="toggle-button-custom active"
                      onClick={(event) => {
                        document
                          .getElementById("withdraw-toggle-custom")
                          .classList.remove("active");
                        document
                          .getElementById("deposit-toggle-custom")
                          .classList.add("active");
                        document
                          .getElementById("deposit-content-custom")
                          .classList.add("active");
                        document
                          .getElementById("withdraw-content-custom")
                          .classList.remove("active");
                        event.currentTarget.classList.add("active");
                      }}
                    >
                      Deposit
                    </button>

                    <button
                      id="withdraw-toggle-custom"
                      style={{
                        fontSize: "14px",
                        borderRadius: "10px",
                        paddingTop: "11px",
                      }}
                      className="toggle-button-custom"
                      onClick={(event) => {
                        document
                          .getElementById("deposit-toggle-custom")
                          .classList.remove("active");
                        document
                          .getElementById("withdraw-toggle-custom")
                          .classList.add("active");
                        document
                          .getElementById("withdraw-content-custom")
                          .classList.add("active");
                        document
                          .getElementById("deposit-content-custom")
                          .classList.remove("active");
                        event.currentTarget.classList.add("active");
                      }}
                    >
                      Withdraw
                    </button>
                  </div>
                  {/* <!-- DEPOSIT --> */}
                  <div
                    id="deposit-content-custom"
                    className="content-section-custom active"
                  >
                    <div id="network-selectors">
                      {/* <!--Asset Dropdown--> */}
                      <div
                        className="custom-dropdown"
                        style={{ flex: 1, fontWeight: 550, fontSize: "15px" }}
                      >
                        <label className="choose">Choose Asset</label>
                        <div
                          className="custom-dropdown-selected"
                          style={{
                            marginBottom: "5px",
                            marginTop: "5px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#26235a",
                            padding: "10px",
                            borderRadius: "8px",
                          }}
                          id="network-selector2"
                          onClick={() => {
                            document
                              .querySelectorAll(".custom-dropdown")
                              .forEach((dropdown) => {
                                const selected = dropdown.querySelector(
                                  ".custom-dropdown-selected"
                                );
                                const options = dropdown.querySelector(
                                  ".custom-dropdown-options"
                                );

                                selected.addEventListener("click", () => {
                                  dropdown.classList.toggle("open");
                                });

                                options
                                  .querySelectorAll(".custom-dropdown-option")
                                  .forEach((option) => {
                                    option.addEventListener("click", () => {
                                      selected.querySelector(
                                        ".custom-dropdown-selected-text"
                                      ).textContent = option.textContent;
                                      dropdown.classList.remove("open");
                                    });
                                  });

                                // Close dropdown when clicking outside
                                window.addEventListener("click", (event) => {
                                  if (!dropdown.contains(event.target)) {
                                    dropdown.classList.remove("open");
                                  }
                                });
                              });
                          }}
                        >
                          <span className="custom-dropdown-selected-text">
                            USDT
                          </span>
                          <span className="custom-dropdown-arrow">
                            <img width="14px" src="img/arrow-right.png" />
                          </span>
                        </div>
                        <div className="custom-dropdown-options">
                          <hr className="separator2" />
                          <div className="custom-dropdown-option">
                            <img
                              src="img/ETH.png"
                              style={{
                                width: "24px",
                                marginLeft: "10px",
                              }}
                            />
                            <span style={{ marginLeft: "10px" }}>ETH</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/brett.png"
                              style={{
                                width: "25px",
                                height: "25px",
                                marginLeft: "10px",
                              }}
                            />
                            <span style={{ marginLeft: "10px" }}>BRETT</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/people.png"
                              style={{ width: "22px", marginLeft: "10px" }}
                            />
                            <span style={{ marginLeft: "10px" }}>PEOPLE</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/USDT.png"
                              style={{ width: "22px", marginLeft: "10px" }}
                            />
                            <span style={{ marginLeft: "10px" }}>USDT</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/USDC.png"
                              style={{ width: "22px", marginLeft: "10px" }}
                            />
                            <span style={{ marginLeft: "10px" }}>USDC</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/BNB.png"
                              style={{ width: "22px", marginLeft: "10px" }}
                            />
                            <span style={{ marginLeft: "10px" }}>BNB</span>
                          </div>
                        </div>
                      </div>
                      {/* <!--Network Dropdown--> */}
                      <div
                        className="custom-dropdown"
                        style={{ flex: 1, fontWeight: 550, fontSize: "15px" }}
                      >
                        <label className="choose">Choose Network</label>
                        <div
                          className="custom-dropdown-selected"
                          style={{
                            marginBottom: "5px",
                            marginTop: "5px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#26235a",
                            padding: "10px",
                            borderRadius: "8px",
                          }}
                          id="network-selector2"
                          onClick={() => {
                            document
                              .querySelectorAll(".custom-dropdown")
                              .forEach((dropdown) => {
                                const selected = dropdown.querySelector(
                                  ".custom-dropdown-selected"
                                );
                                const options = dropdown.querySelector(
                                  ".custom-dropdown-options"
                                );

                                selected.addEventListener("click", () => {
                                  dropdown.classList.toggle("open");
                                });

                                options
                                  .querySelectorAll(".custom-dropdown-option")
                                  .forEach((option) => {
                                    option.addEventListener("click", () => {
                                      selected.querySelector(
                                        ".custom-dropdown-selected-text"
                                      ).textContent = option.textContent;
                                      dropdown.classList.remove("open");
                                    });
                                  });

                                // Close dropdown when clicking outside
                                window.addEventListener("click", (event) => {
                                  if (!dropdown.contains(event.target)) {
                                    dropdown.classList.remove("open");
                                  }
                                });
                              });
                          }}
                        >
                          <span className="custom-dropdown-selected-text">
                            ERC-20
                          </span>
                          <span className="custom-dropdown-arrow">
                            <img width="14px" src="img/arrow-right.png" />
                          </span>
                        </div>
                        <div className="custom-dropdown-options">
                          <hr className="separator2" />
                          <div className="custom-dropdown-option">
                            <img
                              src="img/ETH3.png"
                              style={{
                                width: "15px",
                                height: "24px",
                                marginLeft: "15px",
                              }}
                            />
                            <span style={{ marginLeft: "10px" }}>ERC-20</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/bsc.png"
                              style={{
                                width: "25px",
                                height: "25px",
                                marginLeft: "10px",
                              }}
                            />
                            <span style={{ marginLeft: "10px" }}>BSC</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/base.png"
                              style={{ width: "22px", marginLeft: "10px" }}
                            />
                            <span style={{ marginLeft: "10px" }}>Base</span>
                          </div>
                          <div className="custom-dropdown-option">
                            <img
                              src="img/arb.png"
                              style={{ width: "22px", marginLeft: "10px" }}
                            />
                            <span style={{ marginLeft: "10px" }}>
                              Arbitrum One
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="qr-add" style={{ marginBottom: "15px" }}>
                      {/* <!-- QR Code Image --> */}
                      <div id="qr-code-container">
                        <img id="qr-code" style={{ display: "none" }} />
                      </div>
                      <div id="address-container">
                        <div style={{ overflow: "hidden" }}>
                          <label className="choose">Deposit Address</label>
                          <div id="address"></div>
                        </div>
                        <img
                          src="img/copy.png"
                          style={{ width: "21px", marginTop: "15px" }}
                          id="copy-icon"
                          onClick={copyAddress}
                        />
                      </div>
                    </div>
                    <div
                      id="warningContainer"
                      className="warning-container-darkblue"
                    >
                      <p className="warning-text">
                        <img src="img/warning2.png" className="warning-icon" />
                        Minimum Deposit: $1.5 ∼ 1.5 USDT
                      </p>
                    </div>
                  </div>

                  {/* <!-- WITHDRAW --> */}
                  <div
                    id="withdraw-content-custom"
                    className="content-section-custom"
                    style={{ fontWeight: "bold" }}
                  >
                    <div id="network-selectors">
                      {/* <!--Asset Dropdown--> */}
                      <div className="custom-dropdown" style={{ flex: 1 }}>
                        <label className="choose">Choose Asset</label>
                        <div
                          className="custom-dropdown-selected"
                          style={{
                            margin: "5px 0",
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#26235a",
                            padding: "10px",
                            borderRadius: "8px",
                          }}
                          id="network-selector1"
                          onClick={() => {
                            document
                              .querySelectorAll(".custom-dropdown")
                              .forEach((dropdown) => {
                                const selected = dropdown.querySelector(
                                  ".custom-dropdown-selected"
                                );
                                const options = dropdown.querySelector(
                                  ".custom-dropdown-options"
                                );

                                selected.addEventListener("click", () => {
                                  dropdown.classList.toggle("open");
                                });

                                options
                                  .querySelectorAll(".custom-dropdown-option")
                                  .forEach((option) => {
                                    option.addEventListener("click", () => {
                                      selected.querySelector(
                                        ".custom-dropdown-selected-text"
                                      ).textContent = option.textContent;
                                      dropdown.classList.remove("open");
                                    });
                                  });

                                // Close dropdown when clicking outside
                                window.addEventListener("click", (event) => {
                                  if (!dropdown.contains(event.target)) {
                                    dropdown.classList.remove("open");
                                  }
                                });
                              });
                          }}
                        >
                          <span
                            className="custom-dropdown-selected-text"
                            style={{ fontSize: "15px" }}
                          >
                            USDT
                          </span>
                          <span className="custom-dropdown-arrow">
                            <img width="14px" src="img/arrow-right.png" />
                          </span>
                        </div>
                        <div
                          className="custom-dropdown-options"
                          id="transfer-crypto-assets"
                        >
                          <hr className="separator2" />
                          <div
                            className="custom-dropdown-option"
                            style={{
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px",
                            }}
                          >
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <img
                                src="img/ETH.png"
                                style={{ width: "24px", height: "24px" }}
                              />
                              <span style={{ marginLeft: "10px" }}>ETH</span>
                            </div>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#929292",
                              }}
                            >
                              0.00
                            </span>
                          </div>
                          <div
                            className="custom-dropdown-option"
                            style={{
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px",
                            }}
                          >
                            <div
                              style={{ display: "flex", alignitems: "center" }}
                            >
                              <img
                                src="img/brett.png"
                                style={{ width: "24px", height: "24px" }}
                              />
                              <span style={{ marginLeft: "10px" }}>BRETT</span>
                            </div>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                display: "flex",
                                color: "#afafaf",
                              }}
                            >
                              0.00
                            </span>
                          </div>
                          <div
                            className="custom-dropdown-option"
                            style={{
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px",
                            }}
                          >
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <img
                                src="img/people.png"
                                alt="People Icon"
                                style={{ width: "24px", height: "24px" }}
                              />
                              <span style={{ marginLeft: "10px" }}>PEOPLE</span>
                            </div>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                display: "flex",
                                color: "#afafaf",
                              }}
                            >
                              0.00
                            </span>
                          </div>

                          {options.map((option, index) => (
                            <div
                              key={index}
                              className="custom-dropdown-option"
                              style={{
                                fontSize: "14px",
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <img
                                  src={option.imgSrc}
                                  alt={`${option.label} icon`}
                                  style={{ width: "24px", height: "24px" }}
                                />
                                <span style={{ marginLeft: "10px" }}>
                                  {option.label}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  display: "flex",
                                  alignItems: "center",
                                  color: "#afafaf",
                                }}
                              >
                                {option.balance}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* <!--Network Dropdown--> */}
                      <div
                        className="custom-dropdown"
                        style={{ flex: 1, fontSize: "15px" }}
                      >
                        <label className="choose">Choose Network</label>
                        <div
                          className="custom-dropdown-selected"
                          style={{
                            margin: "5px 0",
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#26235a",
                            padding: "10px",
                            borderRadius: "8px",
                          }}
                          onClick={() => {
                            document
                              .querySelectorAll(".custom-dropdown")
                              .forEach((dropdown) => {
                                const selected = dropdown.querySelector(
                                  ".custom-dropdown-selected"
                                );
                                const options = dropdown.querySelector(
                                  ".custom-dropdown-options"
                                );

                                selected.addEventListener("click", () => {
                                  dropdown.classList.toggle("open");
                                });

                                options
                                  .querySelectorAll(".custom-dropdown-option")
                                  .forEach((option) => {
                                    option.addEventListener("click", () => {
                                      selected.querySelector(
                                        ".custom-dropdown-selected-text"
                                      ).textContent = option.textContent;
                                      dropdown.classList.remove("open");
                                    });
                                  });

                                // Close dropdown when clicking outside
                                window.addEventListener("click", (event) => {
                                  if (!dropdown.contains(event.target)) {
                                    dropdown.classList.remove("open");
                                  }
                                });
                              });
                          }}
                          id="network-selector2"
                        >
                          <span className="custom-dropdown-selected-text">
                            {selectedNetwork}
                          </span>
                          <span className="custom-dropdown-arrow">
                            <img
                              width="14px"
                              src="img/arrow-right.png"
                              alt="Arrow icon"
                            />
                          </span>
                        </div>
                        {
                          <div className="custom-dropdown-options">
                            <hr className="separator2" />
                            {networks.map((network, index) => (
                              <div
                                key={index}
                                className="custom-dropdown-option"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "5px 0",
                                }}
                              >
                                <img
                                  src={network.imgSrc}
                                  alt={`${network.label} icon`}
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    marginLeft: "10px",
                                  }}
                                />
                                <span style={{ marginLeft: "10px" }}>
                                  {network.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        }
                      </div>
                    </div>

                    <span
                      id="welcome-message"
                      style={{ pointerEvents: "none", color: "transparent" }}
                    >
                      Login
                    </span>
                    <div className="amount-sectionz">
                      <div className="razss">
                        <label style={{ margin: 0 }} className="choose">
                          Withdraw Address
                        </label>
                        <div
                          id="error-message2"
                          className="error-message2"
                        ></div>
                      </div>
                      <div className="input-wrapperz">
                        <input
                          type="text"
                          id="addressInput"
                          className="inputz"
                          style={{
                            height: "20px",
                            fontSize: "13px",
                            fontWeight: "bold",
                          }}
                          placeholder="0xc4.."
                          onChange={(event) => {
                            if (event.target.value !== 42) {
                              document.getElementById(
                                "error-message2"
                              ).textContent = "Invalid address";
                            } else {
                              const errorMessage2 =
                                document.getElementById("error-message2");
                              errorMessage2.textContent = "";
                            }
                            validateForm();
                          }}
                        />
                      </div>
                    </div>
                    <div className="amount-sectionz">
                      <div className="razss">
                        <label style={{ margin: 0 }} className="choose">
                          Amount
                        </label>
                        <div id="error-message" className="error-message"></div>
                      </div>

                      <div className="input-wrapperz">
                        <input
                          id="amountInput"
                          style={{
                            height: "20px",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                          placeholder="10"
                          className="inputz"
                          type="number"
                          onChange={(event) => {
                            const amountValue = event.target.value;
                            const inputAmount = parseFloat(amountValue); // Parse user input to float
                            const errorMessage =
                              document.getElementById("error-message");
                            // Clear any previous error message
                            errorMessage.textContent = "";

                            if (amountValue.startsWith("0")) {
                              errorMessage.textContent =
                                "Minimum withdrawal amount is 10";
                            } else if (isNaN(inputAmount)) {
                              return; // Skip validation if input is not a number
                            } else if (inputAmount < 10) {
                              errorMessage.textContent =
                                "Minimum withdrawal amount is 10";
                            } else if (inputAmount > availableAmount) {
                              errorMessage.textContent = "Insufficient amount";
                            }

                            validateForm();
                          }}
                        />
                      </div>
                    </div>

                    <div className="availablez">
                      Available
                      <span
                        style={{ fontWeight: "bold" }}
                        id="availableAmount"
                        className="available-valuez"
                      >
                        0.000
                      </span>
                    </div>
                    <div className="memo-sectionz">
                      <label className="choose">MEMO (Optional)</label>
                      <input
                        type="text"
                        style={{ fontSize: "12px", color: "#dcd9ff" }}
                        className="inputz"
                      />
                    </div>
                    <div className="network-feez">
                      <span style={{ color: "#dcd9ff", fontSize: "14px" }}>
                        Network Fee
                      </span>
                      <span style={{ fontSize: "14px" }} className="fee-valuez">
                        &lt; 0.01 USDT
                      </span>
                    </div>
                    <button
                      className="withdraw-button33"
                      id="withdrawButton"
                      onClick={async () => {
                        const address =
                          document.getElementById("addressInput").value;
                        const amount =
                          document.getElementById("amountInput").value;
                        const username =
                          document.getElementById(
                            "welcome-message"
                          ).textContent;

                        try {
                          const response = await axios.post(
                            "/api/withdrawal/withdrawRequest",
                            { address, amount, username },
                            {
                              headers: {
                                Authorization:
                                  "Bearer " + localStorage.getItem("token"),
                              },
                            }
                          );
                          const data = response.data;
                          if (data.ok) {
                            alert("Withdrawal request sent successfully!");
                          } else {
                            alert("Failed to send the withdrawal request.");
                          }
                        } catch (error) {
                          console.error(
                            "Error sending withdrawal request:",
                            error
                          );
                          alert("An error occurred.");
                        }
                      }}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <a
              id="user-icon2"
              style={{
                cursor: "pointer",
                borderRadius: "20px",
                padding: "0 10px",
                height: "45px",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={() => {
                document.getElementById("main-menu2").style.display = "block";
              }}
              onMouseLeave={() => {
                setTimeout(function () {
                  if (
                    !document.getElementById("main-menu2").matches(":hover")
                  ) {
                    document.getElementById("main-menu2").style.display =
                      "none";
                  }
                }, 100);
              }}
            >
              <span>Wallets</span>
            </a>

            <div
              id="icon2"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {/* <!-- Main dropdown content --> */}
              <div
                id="main-menu2"
                className="dropdown-content2"
                style={{
                  marginRight: "20px",
                  width: "250px",
                  padding: "20px",
                  borderRadius: "10px",
                  zIndex: 10,
                  boxShadow: "0 4px 8px rgba(0.3, 0.3, 0.3, 0.3)",
                }}
                onMouseLeave={(event) => {
                  event.target.setAttribute("style", "display = none");
                }}
                onMouseEnter={(event) => {
                  event.target.setAttribute("style", "display = block");
                }}
              >
                {/* <!-- Center the profile picture and welcome message --> */}
                <div className="balance-info">
                  <span className="balance-text">
                    <img style={{ width: "20px" }} src="img/USDT.png" />
                  </span>
                </div>
                <hr
                  className="separator3"
                  style={{
                    width: "70%",
                    margin: "18px auto",
                    border: 0,
                    height: "1.8px",
                    background: "linear-gradient(to right, #ff8c00, #ff0080)",
                    boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
                  }}
                />
                {/* <!-- Main menu items --> */}
                <a
                  href="#"
                  id="activity-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src="img/activity.png"
                    alt="Activity Icon" // Adding alt for accessibility
                    style={{
                      width: "22px",
                      height: "22px",
                      marginRight: "20px",
                      marginLeft: "5px",
                    }}
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>Spot</p>
                </a>

                <a
                  href="#"
                  id="privacy-security-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src="img/lock.png"
                    alt="Lock Icon" // Adding alt for accessibility
                    style={{
                      width: "20px",
                      height: "20px",
                      marginRight: "20px",
                      marginLeft: "4px",
                    }}
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>Futures</p>
                </a>

                <a
                  href="#"
                  id="support-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src="img/contact.png"
                    alt="Contact Icon" // Adding alt for accessibility
                    style={{
                      width: "20px",
                      height: "20px",
                      marginRight: "20px",
                      marginLeft: "4px",
                    }}
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>Copy Trade</p>
                </a>
              </div>
            </div>
            <a
              id="user-icon"
              style={{
                cursor: "pointer",
                borderRadius: "20px",
                padding: "0 10px",
                height: "45px",
                fontWeight: "bold",
                backgroundImage:
                  "linear-gradient(rgb(29, 28, 73), rgb(50, 49, 121))",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={() => {
                document.getElementById("main-menu").style.display = "block";
              }}
              onMouseLeave={() => {
                setTimeout(function () {
                  if (!document.getElementById("main-menu").matches(":hover")) {
                    document.getElementById("main-menu").style.display = "none";
                  }
                }, 100);
              }}
            >
              <img
                className="pfp"
                src="img/pfp.png"
                style={{ pointerEvents: "none" }}
              />
              <div
                className="icon"
                style={{
                  width: "25px",
                  height: "20px",
                  margin: "4px 20px 0 10px",
                  pointerEvents: "none",
                }}
              >
                <span
                  id="welcome-message-duplicate"
                  style={{ pointerEvents: "none", color: "#dcdcdc" }}
                >
                  Login
                </span>
              </div>
              <img
                src="img/arrow-down.png"
                style={{
                  width: "16px",
                  height: "16px",
                  marginLeft: "10px",
                  pointerEvents: "none",
                }}
              />
            </a>
            <div
              id="icon3"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {/* <!-- Main dropdown content --> */}
              <div
                id="main-menu"
                className="dropdown-content"
                style={{
                  marginRight: "20px",
                  width: "250px",
                  padding: "20px",
                  borderRadius: "10px",
                  zIndex: 10,
                  boxShadow: "0 4px 8px rgba(0.3, 0.3, 0.3, 0.3)",
                }}
                onMouseLeave={() => {
                  document.getElementById("main-menu").style.display = "none";
                }}
                onMouseEnter={() => {
                  this.style.display = "block";
                }}
              >
                {/* <!-- Center the profile picture and welcome message --> */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <img
                    src="img/pfp.png"
                    className="pfp-large"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                    }}
                  />
                </div>

                <hr
                  className="separator3"
                  style={{
                    width: "70%",
                    margin: "18px auto",
                    border: "0",
                    height: "1.8px",
                    background: "linear-gradient(to right, #ff8c00, #ff0080)",
                    boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
                  }}
                />

                {/* Main menu items */}
                <a
                  href="#"
                  id="activity-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src="img/activity.png"
                    style={{
                      width: "22px",
                      height: "22px",
                      marginRight: "20px",
                      marginLeft: "5px",
                    }}
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>Activity</p>
                </a>

                <a
                  href="#"
                  id="privacy-security-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src="img/lock.png"
                    style={{
                      width: "20px",
                      height: "20px",
                      marginRight: "20px",
                      marginLeft: "4px",
                    }}
                    alt="Privacy and Security Icon"
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>
                    Privacy & security
                  </p>
                </a>

                <a
                  href="#"
                  id="support-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src="img/contact.png"
                    style={{
                      width: "20px",
                      height: "20px",
                      marginRight: "20px",
                      marginLeft: "4px",
                    }}
                    alt="Contact Icon"
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>Contact</p>
                </a>

                <a
                  id="headerlogout-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                  onClick={async (event) => {
                    localStorage.removeItem("token");
                    navigate("/login");
                  }}
                >
                  <img
                    src="img/logout.png"
                    style={{
                      width: "25px",
                      height: "25px",
                      marginRight: "20px",
                    }}
                    alt="Logout Icon"
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>Login / Logout</p>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div id="total-statistics" style={{ marginTop: "80px" }}></div>
        <div id="futures" className="tabcontent trading-panel">
          <div id="futures-statistics"></div>
          <div id="futures-now-price" style={{ margin: "10px" }}></div>
          <h3 style={{ margin: "15px" }}>MEXC Futures Asset Price Chart</h3>
          <div className="chart-container">
            <TradingViewWidget
              symbol={selectedFuturesChartSymbol}
              key={selectedFuturesChartSymbol}
              id="futures-tradingview-widget"
            ></TradingViewWidget>
          </div>

          <div className="order-panel">
            <div className="order-header">
              <div className="asset-label">Select an Asset Type:</div>
              <div className="custom-dropdown">
                <div
                  className="custom-dropdown-selected"
                  id="futures-dropdownSelected"
                  onClick={() => {showFuturesAssetsList();}}
                ></div>
                <div
                  className="custom-dropdown-options"
                  id="futures-dropdownOptions"
                ></div>
              </div>
            </div>

            <div>
              <label style={{ color: "rgb(255, 0, 0)", fontSize: "24px" }}>
                Market Order:{" "}
              </label>
              &nbsp;&nbsp;
              <label>Bet Amount:</label>
              <input
                type="number"
                id="bet-amount"
                min="1"
                max="100"
                style={{ width: "80px", fontSize: "20px" }}
              />
              <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
              <label>Leverage:</label>
              <input
                type="number"
                id="bet-leverage"
                min="1"
                max="300"
                defaultValue="1"
                style={{ width: "50px", fontSize: "20px" }}
              />
              &nbsp;&nbsp;
              <button
                id="long-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => tradingEnable && futuresTrading("long", "market")}
              >
                Long
              </button>
              &nbsp;&nbsp;
              <button
                id="short-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => tradingEnable && futuresTrading("short", "market")}
              >
                Short
              </button>
              &nbsp;&nbsp;
            </div>
            <div>
              <label style={{ color: "rgb(255, 0, 0)", fontSize: "24px" }}>
                Limit Order:{" "}
              </label>
              &nbsp;&nbsp;
              <label>Bet Amount:</label>
              <input
                type="number"
                id="limit-amount"
                min="1"
                max="100"
                style={{ width: "80px", fontSize: "20px" }}
              />
              <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
              <label>Leverage:</label>
              <input
                type="number"
                id="limit-leverage"
                min="1"
                max="300"
                defaultValue="1"
                style={{ width: "50px", fontSize: "20px" }}
              />
              &nbsp;&nbsp;
              <label>Limit Price:</label>
              <input
                type="number"
                id="limit-price"
                style={{ width: "100px", fontSize: "20px" }}
              />
              <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
              <button
                id="limit-long-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => {
                  futuresTrading("long", "limit");
                }}
              >
                Long
              </button>
              &nbsp;&nbsp;
              <button
                id="limit-short-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => {
                  futuresTrading("short", "limit");
                }}
              >
                Short
              </button>
              &nbsp;&nbsp;
            </div>
          </div>
          <h3 style={{ color: "#ff8c00" }}>Open Positions</h3>
          <div id="futures-open-positions"></div>
          <h3 style={{ color: "#ff8c00" }}>Open Orders</h3>
          <div id="futures-open-orders"></div>
          <h3 style={{ color: "#ff8c00" }}>Closed Positions</h3>
          <div id="futures-closed-positions"></div>
        </div>

        <div id="spot" className="tabcontent trading-panel">
          <div id="spot-statistics"></div>
          <div id="spot-now-price" style={{ margin: "10px" }}></div>
          <h3 style={{ margin: "15px" }}>MEXC Spot Asset Price Chart</h3>

          <div className="chart-container">
            <TradingViewWidget
              symbol={selectedSpotChartSymbol}
              key={selectedSpotChartSymbol}
              id="tradingview-widget"
            ></TradingViewWidget>
          </div>

          <div className="order-panel">
            <div className="order-header">
              <div className="asset-label">Select an Asset Type:</div>
              <div className="custom-dropdown">
                <div
                  className="custom-dropdown-selected"
                  id="spot-dropdownSelected"
                  onClick={() => {showSpotAssetsList();}}
                ></div>
                <div
                  className="custom-dropdown-options"
                  id="spot-dropdownOptions"
                ></div>
              </div>
              <div style={{ margin: "15px" }} id="spot-assets-statistics"></div>
            </div>

            <div>
              <label style={{ color: "rgb(255, 0, 0)", fontSize: "24px" }}>
                Market:{" "}
              </label>
              &nbsp;&nbsp;
              <label>Amount:</label>
              <input
                type="number"
                id="spot-market-amount"
                min="1"
                max="100"
                style={{ width: "80px", fontSize: "20px" }}
              />
              <span className="money-unit" id="spot-market-unit"></span>
              &nbsp;&nbsp;
              <button
                id="market-buy-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => spotTrading("buy", "market")}
              >
                Buy
              </button>
              &nbsp;&nbsp;
              <button
                id="market-sell-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => spotTrading("sell", "market")}
              >
                Sell
              </button>
            </div>
            <div>
              <label style={{ color: "rgb(255, 0, 0)", fontSize: "24px" }}>
                Limit:{" "}
              </label>
              &nbsp;&nbsp;
              <label>Amount:</label>
              <input
                type="number"
                id="spot-limit-amount"
                min="1"
                max="100"
                style={{ width: "80px", fontSize: "20px" }}
              />
              <span className="money-unit" id="spot-limit-unit"></span>
              &nbsp;&nbsp;
              <label>Price:</label>
              <input
                type="number"
                id="spot-limit-price"
                min="1"
                max="100"
                style={{ width: "80px", fontSize: "20px" }}
              />
              <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
              <button
                id="limit-buy-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => spotTrading("buy", "limit")}
              >
                Buy
              </button>
              &nbsp;&nbsp;
              <button
                id="limit-sell-button"
                className="playbutttton"
                style={{ marginTop: "15px" }}
                onClick={() => spotTrading("sell", "limit")}
              >
                Sell
              </button>
            </div>
          </div>
          {/* <h3 style={{ color: '#ff8c00' }}>Open Positions</h3>
          <div id="spot-open-positions"></div> */}
          <h3 style={{ color: "#ff8c00" }}>Open Orders</h3>
          <div id="spot-open-orders"></div>
          <h3 style={{ color: "#ff8c00" }}>Closed Positions</h3>
          <div id="spot-closed-positions"></div>
        </div>
      </div>

      <div id="partial-closing-modal" className="modal">
        {/* <!-- Modal content --> */}
        <div className="modal-content">
          <span className="close">&times;</span>
          <h2 style={{ color: "#16171a" }}>Partial Closing</h2>
          <br />
          <p style={{ color: "#16171a", fontSize: "20px" }}>
            <input
              id="particalClosingPercent"
              type="number"
              min="1"
              max="100"
              defaultValue="100"
            />
            %&nbsp;&nbsp;
            <button onClick={() => partialClose()}>Confirm</button>
          </p>
        </div>
      </div>

      <div id="transfer-USDT-modal" className="modal">
        {/* <!-- Modal content --> */}
        <div className="modal-content-transfer">
          <span
            className="close"
            onClick={() => {
              document.getElementById("transfer-USDT-modal").style.display =
                "none";
            }}
          >
            &times;
          </span>
          <h2>USDT Transfer</h2>
          <br />
          <p>
            <span className="money-type">Est. Futures Balance(USDT)</span>
            <span
              className="money-value"
              id="transfer-modal-futures-USDT"
            ></span>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className="money-type">Est. Spot Balance(USDT)</span>
            <span className="money-value" id="transfer-modal-spot-USDT"></span>
          </p>
          <br />
          <p style={{ fontSize: "20px" }}>
            <span>Mode:</span>
            <select name="transferType" id="transfer-USDT-type">
              <option value="fromFutures" selected>
                Futures - Spot
              </option>
              <option value="fromSpot" selected>
                Spot - Futures
              </option>
            </select>
            <span>Amount:</span>
            <input
              type="number"
              min="1"
              max="100"
              id="transfer-USDT-amount"
              style={{ fontSize: "20px", margin: "10px" }}
            />
            <span className="money-unit">(USDT)</span>
            <button id="transfer-USDT-btn" onClick={() => transferUSDT()}>
              Transfer
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradingApp;
