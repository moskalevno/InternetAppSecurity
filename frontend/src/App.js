import * as React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';
import './app.css';
import Register from './components/Register';
import Login from './components/Login';
import RequestReset from './components/RequestReset';
import ResetPassword from './components/ResetPassword';
import Home from './components/Home';

const MAPBOX_TOKEN = 'your_mapbox_token_here';

function App() {
  const myStorage = window.localStorage;
  const [currentUser, setCurrentUser] = useState(myStorage.getItem("user"));
  const [showRecover, setShowRecover] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = () => {
    myStorage.removeItem("user");
    setCurrentUser(null);
  };

  return (
    <div className='App'>
      <Routes>
        <Route path="/" element={<Home currentUser={currentUser} handleLogout={handleLogout} myStorage={myStorage} setCurrentUser={setCurrentUser} setShowRecover={setShowRecover} setShowLogin={setShowLogin} showLogin={showLogin} showRecover={showRecover} />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} myStorage={myStorage} setShowRecover={setShowRecover} setShowLogin={setShowLogin} />} />
        <Route path="/requestReset" element={<RequestReset />} />
      </Routes>  
    </div>
  );
}

export default App;
