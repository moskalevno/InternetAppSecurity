import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom'; 
import './resetPassword.css'

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token"); // Получаем токен из строки запроса
  console.log(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    try {
      const response = await axios.post(`/users/resetPassword?token=${token}`, {  // Запрос к серверу на сброс пароля с новым паролем и токеном
        password
      });
      setMessage('Your password has been successfully reset.');
      console.log("SUCCESS");
      navigate('/');
    } 
    catch (error) {
      setMessage('There was an error resetting your password. Please try again.');
    }
  };

  return (
    <div className="reset-password-container">
      <h1>Reset Password</h1>
      <h2>Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        {console.log("FFFFFFFFFFFFFFFF")}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your new password"
        />
        <input
          type="password"
          value={confirmPassword}
          className="reset-password-input"
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Confirm your new password"
        />
        <button className="reset-password-button" type="submit">Reset Password</button>
      </form>
      {message && <p className="reset-password-message">{message}</p>}
    </div>
  );
}