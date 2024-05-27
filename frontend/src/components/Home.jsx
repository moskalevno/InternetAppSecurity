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
  const myStorage = window.localStorage

  const [currentUser, setCurrentUser] = useState(myStorage.getItem("user"))

  const handleLogout = () => {
    myStorage.removeItem("user")
    setCurrentUser(null)
  }

const [editingReview, setEditingReview] = useState(null);
const [showRecover, setShowRecover] = useState(false);


const [pins, setPins] = useState([]);
const [currentPlaceId,setCurrentPlaceId] = useState(null)
const [newPlace,setNewPlace] = useState(null)
const [isCountryInputVisible, setIsCountryInputVisible] = useState(false);
const [countryInput, setCountryInput] = useState("");
const [title,setTitle] = useState(null)
const [desc,setDesc] = useState(null)
const [rating,setRating] = useState(0)
const [showRegister,setShowRegister] = useState(false)
const [showLogin,setShowLogin] = useState(false)
/////////// маршруты

/////A to B
const [pointA,setPointA] = useState(null)
const [pointB,setPointB] = useState(null)
const [isRouteMode, setIsRouteMode] = useState(false);
//////////
const [topRatedPins, setTopRatedPins] = useState([]);
const [route, setRoute] = useState(null);
const [newReviewText,setNewReviewText] = useState("")
const [newReviewRating, setNewReviewRating] = useState(0);
const [showPopup, setShowPopup] = useState(true);
///////
const [viewport, setViewport] = useState({
  latitude: 47.040182,
  longitude: 17.071727,
  zoom: 4,
});

const [countriesBordersGeoJSON, setCountriesBordersGeoJSON] = useState(null);

function AvgRating(pin){
  // Начинаем с рейтинга и отзыва основного пина
  let totalRating = pin.rating;
  let totalReviews = 1; // Потому что у нас уже есть основной отзыв

  // Добавляем рейтинги от дополнительных отзывов
  if (pin.reviews && pin.reviews.length > 0) {
    pin.reviews.forEach(review => {
      totalRating += review.rating;
      totalReviews += 1;
    });
  }
  // Возвращаем средний рейтинг
  let res = Math.floor((totalRating - totalRating % totalReviews)  / totalReviews)
  //console.log("AVG RATING",res);
  return  res//totalRating  / totalReviews;
}

useEffect(() => {
  fetch('/custom.geo.json')
    .then((response) => response.json())
    .then((data) => setCountriesBordersGeoJSON(data))
    .catch((error) => console.error('Error loading GeoJSON:', error));
}, []);


useEffect(() => {
  // Пересчитываем topRatedPins при изменении списка пинов
  recalculateTopRatedPins();
}, [pins]);
  
  // Пересчитываем маршрут при изменении topRatedPins или точек A и B
  useEffect(() => {
    if (pointA && pointB) {
      buildCustomRoute(pointA, pointB, topRatedPins);
    }
  }, [pointA, pointB, topRatedPins]);

  const getCountryBounds = async (lat, lng) => {
    const url = `https://api.mapbox.com/v4/mapbox.country-boundaries-v1/tilequery/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`;
    try {
      const response = await axios.get(url);
      const data = response.data;
      if (data && data.features && data.features.length > 0) {
        // Обработка данных о границах страны
        return data.features[0].properties;
      } else {
        throw new Error('Country boundaries not found');
      }
    } catch (error) {
      console.error('Error fetching country boundaries:', error);
      return undefined;
    }
  };


  // Функция для построения маршрута
  const buildRoute = async () => {
    console.log('Building route...');
    // Ограничим количество точек для маршрута, чтобы избежать превышения ограничений API.
    const MAX_ROUTE_POINTS = 4; // или другое значение в зависимости от ограничений Mapbox API
    const eligiblePins = topRatedPins.filter(pin => AvgRating(pin) >= 4);
    const sortedPins = [...eligiblePins].sort((a, b) => AvgRating(b) - AvgRating(a));
    //const sortedPins = [...topRatedPins].sort((a, b) => b.rating - a.rating);
    const topPins = sortedPins.slice(0, MAX_ROUTE_POINTS);
  
    // Формируем строку координат для Mapbox API из первых 10 высокооцененных точек
    const coordinates = topPins.map(pin => `${pin.long},${pin.lat}`).join(';');
    const mapboxRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
  
    try {
      const response = await axios.get(mapboxRequestUrl);
      const data = response.data;
      
      console.log(data);
      // Проверяем, что полученный ответ содержит маршруты
      if (data.routes && data.routes.length) {
        const route = data.routes[0]; // Получаем первый маршрут из ответа
        const coordinates = route.geometry.coordinates; // Получаем координаты маршрута
        console.log(coordinates);
        const line = lineString(coordinates); // Создаём линию из координат
        const smoothedLine = bezierSpline(line);
      // Установка полученного маршрута
        setRoute(smoothedLine);
        console.log('Route set:', data.routes[0]);
        console.log('Coords:', );

      } else {
        // Обработка случаев, когда маршрут не найден или ошибка в данных
        console.error('No routes found in the Mapbox response.');
        setRoute(null);
      }
    } catch (err) {
      console.error('Ошибка при запросе к Mapbox API:', err);
      setRoute(null);
    }
    
  };
  
  // Функция для построения маршрута внутри страны
  const buildRouteWithinCountry = async (countryName) => {
    const MAX_ROUTE_POINTS = 10;
    // Фильтрация пинов внутри заданной страны и с оценкой 4 и выше
    const withinCountryPins = pins.filter(pin => 
      pin.countryName === countryName && AvgRating(pin) >= 4);
  // Сортировка пинов по среднему рейтингу и взятие первых MAX_ROUTE_POINTS
  const sortedPins = withinCountryPins.sort((a, b) => 
      AvgRating(b) - AvgRating(a)).slice(0, MAX_ROUTE_POINTS);
    // Получение координат для построения маршрута
    const coordinates = sortedPins.map(pin => `${pin.long},${pin.lat}`).join(';');
    console.log("COORDS",coordinates);
    const mapboxRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
    try {
      const response = await axios.get(mapboxRequestUrl);
      console.log("RESPONSE", response);
      const data = response.data;
      if (data.routes && data.routes.length) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        console.log(coordinates);
        const line = lineString(coordinates);
        const smoothedLine = bezierSpline(line);
        setRoute(smoothedLine);
        console.log('Route set:', data.routes[0]);
      } else {
        console.error('No routes found in the Mapbox response.');
        setRoute(null);
      }
    } catch (err) {
      console.error('Error requesting Mapbox API:', err);
      setRoute(null);
    }
  };

// Функция для геокодирования названия места
const geocodeLocation = async (locationName) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    if (data.features && data.features.length > 0) {
      // Возвращаем первые найденные координаты
      return data.features[0].geometry.coordinates;
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
};


////A TO B///////////////////////
const selectPoint = (e) => {
  if (!isRouteMode) return;
  const [lng, lat] = e.lngLat.toArray();
  if (!pointA) {
    setPointA({ lat, lng });
    console.log('Point A is set: ', { lat, lng }); // Добавлено для отладки
  } else {
    setPointB({ lat, lng });
    
    console.log('Point B is set: ', { lat, lng }); // Добавлено для отладки
    // Вызов функции buildCustomRoute должен быть выполнен здесь, после установки pointB
    buildCustomRoute(pointA, { lat, lng }, topRatedPins);
    setPointA(null); // Очищаем точку A для следующего использования
    setPointB(null); // Очищаем точку B тоже
    setIsRouteMode(false); // Завершаем режим построения маршрута
  }
};

  // Функция для поиска ближайшего высокооцененного места
const findNearestTopRatedPlace = (pointA,pointB,topRatedPins) => {
  if (!Array.isArray(topRatedPins) || topRatedPins.length === 0) {
    console.error('No top rated pins provided');
    return null;
  }
  const line = turf.lineString([[pointA.lng, pointA.lat], [pointB.lng, pointB.lat]]);
  let nearestPlace = null;
  let nearestDistance = Infinity;

  topRatedPins.forEach(pin => {
  if (pin && typeof pin.rating === 'number' && AvgRating(pin) >= 4) { // Убедитесь, что место имеет рейтинг 4 и выше
    const placePoint = turf.point([pin.long, pin.lat]);
    const distance = turf.pointToLineDistance(placePoint, line);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPlace = pin;
      console.log("top",nearestPlace);
    }
  }
});
  return nearestDistance <= 10 ? nearestPlace : null
};

// Функция построения пользовательского маршрута
const buildCustomRoute = async (startPoint, endPoint, topRatedPins) => {
  let waypoints = '';
  const nearestTopRatedPlace = findNearestTopRatedPlace(startPoint, endPoint, topRatedPins);
  if (nearestTopRatedPlace) {
    waypoints = `;${nearestTopRatedPlace.long},${nearestTopRatedPlace.lat}`;
  }
  const coordinates = `${startPoint.lng},${startPoint.lat}${waypoints};${endPoint.lng},${endPoint.lat}`;
  const mapboxRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
  
  try {
    const response = await axios.get(mapboxRequestUrl);
    const data = response.data;
    if (data.routes && data.routes.length) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates;
      const line = lineString(coordinates);
      const smoothedLine = bezierSpline(line);
      setRoute(smoothedLine); // Обновление состояния маршрута
      console.log('Route set:', data.routes[0]);
    } else {
      console.error('No routes found in the mapbox response');
      setRoute(null);
    }
  } catch (err) {
    console.error('Error requesting mapbox API', err);
    setRoute(null);
  }
};
  //// A TO B////////////////////

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

<button className="button buttonRoute" onClick={buildRoute}>
              Build Top Rated Route
          </button>
            {currentUser ? (
              <button className="button logout" onClick={handleLogout}>LogOut</button>
            ) : (
              <>
                <button className="button login" onClick={() => setShowLogin(true)}>LogIn</button>
                <button className="button register" onClick={() => setShowRegister(true)}>Register</button>
              </>
)}

    {showRegister && <Register setShowRegister = {setShowRegister}/>}
        {showRecover ? 
        (<RequestReset setShowRecover={setShowRecover} />) 
        :
        (showLogin && <Login setShowRecover={setShowRecover} setShowLogin={setShowLogin} myStorage={myStorage} setCurrentUser={setCurrentUser}/>)
        }
</Map>
    </div>
    );
  
}
export default Home