import React, { useState } from 'react';
import axios from 'axios';
import './requestReset.css'

export default function RequestReset({ setShowRecover }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/users/requestReset', { email });
      setMessage('If an account with that email exists, we sent a link to reset your password.');
    } catch (error) {
      setMessage('There was an issue submitting your request. Please try again later.');
    }
  };

  return (
    <div className="request-reset-container">
      <h2>Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
      <button onClick={() => setShowRecover(false)}>Cancel</button>
    </div>
  );
}
