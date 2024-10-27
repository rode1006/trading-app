import React, { useEffect, useState } from 'react';

const FuturesPage = () => {
  const [userData, setUserData] = useState({
    username: '',
    balance: 0,
    address: '',
  });

  const [positions, setPositions] = useState([]);
  const [availableAmount, setAvailableAmount] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [errorMessages, setErrorMessages] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(fetchUserData, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/getBalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });
      const data = await response.json();
      setUserData({
        username: data.username,
        balance: data.balance,
        address: data.address
      });
      setAvailableAmount(data.balance);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/getPositions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setPositions(data.positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const withdraw = async () => {
    const address = document.getElementById('addressInput').value;
    const amount = document.getElementById('amountInput').value;
    const username = userData.username;

    // Validation can go here

    try {
      const response = await fetch('/api/withdrawRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ address, amount, username })
      });
      if (response.ok) {
        alert('Withdrawal request sent successfully!');
      } else {
        alert('Failed to send the withdrawal request.');
      }
    } catch (error) {
      console.error('Error sending withdrawal request:', error);
      alert('An error occurred.');
    }
  };

  return (
    <div className="container">
      {/* Navigation and Buttons */}
      <header>
        {/* Navigation and buttons here */}
        <h1>Welcome, {userData.username}</h1>
        <p>Your balance: ${userData.balance}</p>
        {/* Add any buttons/modals here for deposit/withdraw */}
      </header>

      {/* User Balance and Bet Section */}
      <div className="open-position">
        <div>Available Balance: ${availableAmount.toFixed(2)}</div>
        <input
          type="number"
          id="bet-amount"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          placeholder="Enter bet amount"
          min="1"
          max="100"
        />
        <button onClick={() => {/* Call long/short bet function here */}}>Long</button>
        <button onClick={() => {/* Call long/short bet function here */}}>Short</button>
        <div id="positions">
          {positions.map(position => (
            <div key={position.id}>
              {/* Display position details */}
              <p>{position.positionType} - Amount: ${position.amount}</p>
              <button onClick={() => {/* Call close position function here */}}>Close Position</button>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Section */}
      <div>
        <input type="text" id="addressInput" placeholder="Withdraw Address" />
        <input type="number" id="amountInput" placeholder="Amount" />
        <button onClick={withdraw}>Withdraw</button>
      </div>
    </div>
  );
};

export default FuturesPage;