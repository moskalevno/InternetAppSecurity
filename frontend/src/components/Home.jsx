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
import '../app.css'
import Register from './Register';
import Login from './Login'
import RequestReset from './RequestReset';
import ResetPassword from './ResetPassword';



const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFrczM1NDkiLCJhIjoiY2xmc3U2bXU4MDl2ejNqb2JzeTFpazV5aiJ9.hK8UcLIKZyNtJlpBj_V06g'; // Set your mapbox token here

function Home() {
  
const [viewport, setViewport] = useState({
  latitude: 47.040182,
  longitude: 17.071727,
  zoom: 4,
});
const [newPlace,setNewPlace] = useState(null)
const [pins, setPins] = useState([]);
const [countriesBordersGeoJSON, setCountriesBordersGeoJSON] = useState(null);

  const handleAddClick = (e) => {
    const [lng, lat] = e.lngLat.toArray()
    setNewPlace ({
      lat:lat,
      lng:lng,
    })
  }


    ////////////////////////////BUTTON FOR A TO B ROUTE//////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [showPopup, setShowPopup] = React.useState(true);
  return (
    <div className='Home'>
      <Map
        initialViewState={{...viewport}}
        style={{width: "100vw", height: "100vh"}}
        //mapbox://styles/mapbox/streets-v12
        mapStyle="mapbox://styles/safak/cknndpyfq268f17p53nmpwira"
        mapboxAccessToken={MAPBOX_TOKEN}
        onViewportChange={(viewport) => setViewport(viewport)}
        onDblClick = {handleAddClick}
        transitionDuration = "200"
      >

      {pins.map(p => (
  <>
    <Marker
        latitude={p.lat}
        longitude={p.long}
        
        offsetLeft={-viewport.zoom * 5}
        offsetTop={-viewport.zoom * 10}
        anchor="bottom"
    >
        <Room style={{fontSize: (10 * viewport.zoom), color: p.username === currentUser ? "tomato" : userHasReviewedPin(p, currentUser) ? "teal" : "slateblue", cursor: "pointer"}}
        onClick = {() => handleMarkerClick(p._id, p.lat, p.long, p.countryName)}
        />
    </Marker>

    {countriesBordersGeoJSON && (
      <Source id="countries-borders" type="geojson" data={countriesBordersGeoJSON}>
        <Layer
          id="countries-borders"
          type="line"
          paint={{
            'line-color': '#75a3e9', // Цвет линии
            'line-width': 3 // Толщина линии
          }}
        />
      </Source>
    )}

    <Popup
      latitude={p.lat}
      longitude={p.long}
      closeButton={true}
      closeOnClick={false}
      onClose={() => setCurrentPlaceId(null)}
      anchor="left"
    >
    <div className='card'>
      <label>Place</label>
      <h4 className='place'>{p.title}</h4>
      <label>Review</label>
      <p className='desc'>{p.desc}</p>
      <label>Rating</label>
      <div className='stars'>
        {Array(p.rating).fill(<Star className='star'></Star>)}
      </div>
      <label>Information</label>
      <span className='username'>Created by <b>{p.username}</b> </span>
      <span className='date'>{format(p.createdAt)}</span>
      <div className="reviews">
        {p.reviews.map(review => (
          <div key={review._id} className="review">
            <label>----------------------------------<br></br> </label>
            {/* <label>Review</label>
            <p className='desc'>{p.desc}</p> */}

            <label>Review</label>
            <p className='desc'>{review.text}</p>
            <label>Information<br></br></label>
            
            <span className='username'>Created by <b>{review.username}</b> </span>
            <span className='date'><br></br>{format(review.createdAt)}</span>
            <div className='stars'>
              {Array(review.rating).fill(<Star className="star" />)}
              
            </div>
          </div>
        ))}
        <span className='avg'><b>Average Rating</b><br></br></span>
        {Array(Math.round(AvgRating(p))).fill(<Star className='star'></Star>)}

      </div>

  </div>
  </Popup>
        
        
        </>
        ))}

      </Map>
    </div>
    );
  
}
export default Home