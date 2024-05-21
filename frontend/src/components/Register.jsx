import { Cancel, Room } from "@material-ui/icons";
import axios from "axios";
//import twilio from "twilio"

import { useRef, useState } from "react";
import "./register.css";




export default function Register({setShowRegister}){
    const [success,setSuccess] = useState(false)
    const [error,setError] = useState(false)
    const [phoneNumber,setPhoneNumber] = useState('')
    const [message,setMessage] = useState('')
    const [sending,setSending] = useState(false)
    const [verificationCode, setVerificationCode] = useState('');
    const [stage, setStage] = useState('sendCode'); // 'sendCode' или 'verifyCode'

    const usernameRef = useRef()
    const emailRef = useRef()
    const passwordRef = useRef()
    const phoneRef = useRef()

    const sendSMS = async () => {
      setSending(true);
      try {
        const response = await axios.post("/verify/send-code", {
          phoneNumber: phoneRef.current.value,
        });
        console.log(response.data);
        setStage('verifyCode'); // Переходим к стадии ввода кода
      } catch (error) {
        console.error('Ошибка отправки SMS:', error);
        setError(error.response.data.error);
      } finally {
        setSending(false);
      }
    };
  
    const handleVerification = async () => {
      setSending(true);
      try {
        const response = await axios.post("/verify/verify-code", {
          phoneNumber: phoneRef.current.value,
          code: verificationCode,
        });
        console.log(response.data);
        if (response.data.message === 'Verification successful') {
          setSuccess(true);
        } else {
          setError('Verification failed');
        }
      } catch (error) {
        console.error('Ошибка верификации кода:', error);
        setError(error.response.data.error);
      } finally {
        setSending(false);
      }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const newUser = {
          username: usernameRef.current.value,
          email: emailRef.current.value,
          password: passwordRef.current.value,
          phone: phoneRef.current.value
        };
    
        try {
          await axios.post("/users/register", newUser);
          setError(false);
          setSuccess(true);
          console.log("true")
          sendSMS()
        } catch (err) {
          setError(true);
        }
      };

    return (
      <div className="registerContainer">
    <div className="logo">
      <Room />
      MapPin
    </div>
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="username" ref={usernameRef} />
      <input type="email" placeholder="email" ref={emailRef} />
      <input type="password" placeholder="password" ref={passwordRef} />
      <input type="phone" placeholder="phone" ref={phoneRef} />

      {stage === 'sendCode' ? (
        <button type="button" className="registerButton" onClick={sendSMS} disabled={sending}>
          Send Verification Code
        </button>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button type="button" className="registerButton" onClick={handleVerification} disabled={sending}>
            Verify Code
          </button>
        </div>
      )}

      <button type="submit" className="registerButton">
        Register
      </button>
      
      {success && <span className="success">Successful. You can login now!</span>}
      {error && <span className="error">Something went wrong: {error}</span>}
    </form>
    <Cancel className="registerCancel" onClick={() => setShowRegister(false)} />
  </div>
        // <div className="registerContainer">
        //     <div className="logo">
        //         <Room/>
        //         MapPin
        //     </div>
        //     <form onSubmit = {handleSubmit}>
        //         <input type="text" placeholder="username" ref={usernameRef}/>
        //         <input type="email" placeholder="email" ref={emailRef}/>
        //         <input type="password" placeholder="password" ref={passwordRef}/>
        //         <input type="phone" placeholder="phone" ref={phoneRef}/>

        //         <button className="registerButton">Register</button>
        //         {success &&
        //         <span className="success">Successfull. You can login now</span>
        //         }
        //         {error &&
        //         <span className="error">Something went wrong</span>
        //         }
        //     </form>
        //     <Cancel className="registerCancel" onClick = {() => setShowRegister(false)}/>

        // </div>
    )
}