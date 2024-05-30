import { Cancel, Room } from "@material-ui/icons";
import axios from "axios";
import { useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom'; 

import "./register.css";

export default function Register({setShowRegister}){
  const navigate = useNavigate();
  const [success,setSuccess] = useState(false)
  const [error,setError] = useState(false)
  const usernameRef = useRef()
  const emailRef = useRef()
  const passwordRef = useRef()
  const location = useLocation(); 
  const handleSubmit = async (e) => {
      e.preventDefault();
      const newUser = {
        username: usernameRef.current.value,
        email: emailRef.current.value,
        password: passwordRef.current.value,
      };
  
      try {
        await axios.post("/users/register", newUser);
        setError(false);
        setSuccess(true);
        console.log("true")
        navigate('/login');
      } catch (err) {
        setError(true);
      }
    };

  return (
      <div className="registerContainer">
          <div className="logo">
              <Room/>
              MapPin
          </div>
          <form onSubmit = {handleSubmit}>
              <input type="text" placeholder="username" ref={usernameRef}/>
              <input type="email" placeholder="email" ref={emailRef}/>
              <input type="password" placeholder="password" ref={passwordRef}/>
              <button className="registerButton">Register</button>
              {success &&
              <span className="success">Successfull. You can login now</span>
              }
              {error &&
              <span className="error">Something went wrong</span>
              }
          </form>
          <Cancel className="registerCancel" onClick = {() => setShowRegister(false)}/>

      </div>
  )
}