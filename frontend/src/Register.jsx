import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css'; // New CSS file for Register styles

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('auth/register', { username, password });
      const data = await response.data;
      if (data.ok) {
        navigate(data.redirectTo);
      } else {
        setMessage('Registration failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error registering:', error);
      setMessage('An error occurred while registering.');
    }
  };

  return (
    <div className="register-container">
      <h1 className='login-header'>Register</h1>
      <form onSubmit={handleRegister} className='login-form'>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
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
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button type="submit" className="register-button">Register</button>
      </form>
      <p className='login-form-p'>Already have an account? <a onClick={() => navigate('/login')} className="register-link">Login here</a></p>
      {message && <p id="message" className="error-message">{message}</p>}
    </div>
  );
};

export default Register;