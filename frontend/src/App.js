import * as React from 'react';
import { BrowserRouter as Router, Route,Routes, Switch, useParams,useNavigate,Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from "react";
import * as turf from '@turf/turf';
import { lineString, bezierSpline, point, pointToLineDistance } from '@turf/turf';
import {render} from 'react-dom';
import Map, {Marker, Popup, Source, Layer} from 'react-map-gl';
import axios from 'axios'
import {Room, Star} from '@material-ui/icons';
import {format} from 'timeago.js'
import 'mapbox-gl/dist/mapbox-gl.css';
import Home from './components/Home';
import './app.css'
import Register from './components/Register';
import Login from './components/Login'
import RequestReset from './components/RequestReset';
import ResetPassword from './components/ResetPassword';


const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFrczM1NDkiLCJhIjoiY2xmc3U2bXU4MDl2ejNqb2JzeTFpazV5aiJ9.hK8UcLIKZyNtJlpBj_V06g'; // Set your mapbox token here

function App({ currentUser, handleLogout }) {

  //////////////////TESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTEST///////////TESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTEST////////////////////////////////////////////////////

  return (
    <div className='App'>
        <Routes>
  <Route path="/" element={<Home currentUser={currentUser} handleLogout={handleLogout} />} />
  
</Routes>
        
        
    </div>
    )
  
}
export default App