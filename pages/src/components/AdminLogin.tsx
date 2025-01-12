import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (password === 'francesisthebest') {
      onLogin();
    } else {
      alert('Invalid password');
    }
  };

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter admin password"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}