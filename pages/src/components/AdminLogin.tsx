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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div id="adminLogin">
      <h2>Admin Login</h2>
      <form
        onSubmit={handleSubmit}
        id="admin-login-form"
        name="admin-login-form"
        method="post"
        autoComplete="on"
      >
        <div className="form-group">
          <label htmlFor="admin-username">Username</label>
          <input
            type="text"
            id="admin-username"
            name="username"
            autoComplete="username"
            defaultValue="admin"
            readOnly
            aria-label="Username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="admin-password">Password</label>
          <input
            type="password"
            id="admin-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoComplete="current-password"
            aria-label="Password"
            required
          />
        </div>
        <button 
          type="submit"
          aria-label="Log in to admin panel"
        >
          Login
        </button>
      </form>
    </div>
  );
}