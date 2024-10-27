import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // New CSS file for Login styles

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Handle any side effects related to messages if necessary
  }, [message]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const response = await axios.post('auth/login', { username, password }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.data;
      if (data.ok) {
        localStorage.setItem('token', data.token);
        navigate(data.redirectTo);
      } else {
        setMessage(data); // Update the message state with error
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h1 className='login-header'>Login</h1>
      <form onSubmit={handleSubmit} id="login-form" className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
      <p className='login-form-p'>Don't have an account? <a onClick={() => navigate('/register')} className="register-link">Register</a></p>
      {message && <p id="message" className="error-message">{message}</p>}
    </div>
  );
};

export default Login;