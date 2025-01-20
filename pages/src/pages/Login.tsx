import React, { useState } from 'react';

export function Login() {
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (password === 'francesisthebest') {
      // Store auth state in Chrome storage
      await chrome.storage.local.set({ isAuthenticated: true });
      // Close the tab after successful login
      window.close();
    } else {
      alert('Invalid password');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem'
    }}>
      <h1>ChronicleSync Login</h1>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '300px'
      }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          style={{ padding: '0.5rem' }}
        />
        <button 
          onClick={handleLogin}
          style={{ padding: '0.5rem' }}
        >
          Login
        </button>
      </div>
    </div>
  );
}