// LoginComponent.tsx
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const LoginComponent: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform validation if needed

    if( username === "auser" && password === "5``3%}EiP89Q")
    {
        login({ username, password });
    }
    
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginComponent;
