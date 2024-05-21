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

        
        </>
        ))}

      </Map>
    </div>
    );
  
}
export default Home