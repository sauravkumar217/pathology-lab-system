import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  console.log('AdminLogin rendered');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get('http://localhost:3001/admins', {
        params: { username, password }
      });
      if (response.data.length > 0) {
        navigate('/patient-test-management');
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Error logging in. Please check if the server is running.');
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleLogin}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;