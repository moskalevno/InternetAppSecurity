import { Cancel, Room } from "@material-ui/icons";
import axios from "axios";
import { useRef, useState } from "react";
import "./login.css";
import { useNavigate } from 'react-router-dom';

export default function Login({ setShowLogin, myStorage, setCurrentUser, setShowRecover }) {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const usernameRef = useRef();
  const passwordRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = {
      username: usernameRef.current.value,
      password: passwordRef.current.value,
    };

    try {
      const res = await axios.post("/users/login", user);
      if (res.data.message === 'Verification code sent to your email') {
        navigate(`/verify/${res.data.userId}`);         // на страницу верификации если требуется
      } else {
        myStorage.setItem("user", res.data.username);
        setCurrentUser(res.data.username);
        setShowLogin(false);
        setShowRecover(false); 
        setError(false);
        navigate('/');
      }
    } catch (err) {
      setError(true);
      console.log(err);
    }
  };

  const handleForgotPassword = () => {
    navigate('/requestReset'); // Перенаправляем пользователя на страницу запроса сброса пароля
  };

  return (
    <div className="loginContainer">
      <div className="logo">
        <Room />
        MapPin
      </div>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="username" ref={usernameRef} />
        <input type="password" placeholder="password" ref={passwordRef} />
        <button className="loginButton">Login</button>
        <button type="button" className="forgotPasswordButton" onClick={handleForgotPassword}>Forgot Password?</button>
        {error && <span className="error">Something went wrong</span>}
      </form>
      <Cancel className="loginCancel" onClick={() => setShowLogin(false)} />
    </div>
  );
}
