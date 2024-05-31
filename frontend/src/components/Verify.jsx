import axios from "axios";
import { useRef, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import "./verify.css";

export default function Verify() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const codeRef = useRef();
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = codeRef.current.value;

    try {
      const res = await axios.post("/users/verify", { userId, code });
      setError(false);
      setSuccess(true);
      navigate('/login');
    } catch (err) {
      setError(true);
      console.log(err);
    }
  };

  return (
    <div className="verifyContainer">
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Verification Code" ref={codeRef} />
        <button className="verifyButton">Verify</button>
        {success && <span className="success">Verification successful. You can now login.</span>}
        {error && <span className="error">Invalid verification code</span>}
      </form>
    </div>
  );
}
