import React, { useState } from 'react';

const RegisterComponent = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    color: '#fff',
    backgroundColor: '#28a745', // Color verde suave
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  };
  
  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
  };
  
  const inputStyle = {
    padding: '10px',
    width: '100%',
    fontSize: '14px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '15px',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
  };
  
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#e9ecef',
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        window.location.href = data.redirectTo; // Redirect to login page
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering:', error);
      setMessage('An error occurred during registration.');
    }
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleRegister} style={formStyle}>
        <h1 style={{ marginBottom: '20px', color: '#343a40' }}>Register</h1>
        <input
          type="text"
          id="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          id="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>Register</button>
        <p style={{ marginTop: '15px', color: '#6c757d' }}>Already have an account? <a href="/login" style={{ color: '#007bff' }}>Login here</a></p>
        <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>
      </form>
    </div>
  );
};



export default RegisterComponent;
