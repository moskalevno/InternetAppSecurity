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

////////////////////////////////////DELETING////////////////////////////////////////////////////////////////////
const handleDeleteReview = async (pinId, reviewId) => {
  try {
    const response = await axios.delete(`http://localhost:8800/api/reviews/${pinId}/delete_review/${reviewId}`, {
      data: { userId: currentUser } // убедитесь, что currentUser соответствует текущему идентификатору пользователя
    });

    if (response.status === 200) {
      // Обновляем состояние пинов после удаления отзыва
      setPins(prevPins => prevPins.map(pin => {
        if (pin._id === pinId) {
          // Обновляем отзывы для этого пина, исключая удаленный
          const updatedReviews = pin.reviews.filter(review => review._id !== reviewId);
          // Возвращаем обновленный пин
          return { ...pin, reviews: updatedReviews };
        }
        return pin;
      }));
      console.log("Отзыв удален");
       // Сбрасываем состояние редактируемого отзыва, если это был удаленный отзыв
       if (editingReview && editingReview._id === reviewId) {
        setEditingReview(null);
       }
    }
  } catch (error) {
    console.error('Ошибка при удалении отзыва: ', error.response?.data || error.message);
  }
};
//1 отзыв (создателя)
  const deletePin = async (pinId) => {
    try {
      const response = await axios.delete(`http://localhost:8800/api/pins/${pinId}`, {
        data: { userId: currentUser }
      });
      if (response.status === 200) {
        setPins(pins.filter(pin => pin._id !== pinId));
        console.log('Пин и отзыв успешно удалены');
        // Обновите состояние или выполните действия после удаления, например:
        // setPins(pins.filter(pin => pin._id !== pinId));
      }
    } catch (error) {
      console.error('Ошибка при удалении пина:', error.response.data);
    }
  };
//Удаление отзыва создателем пина, когда есть другие отзывы
const deleteFirstReview = async (pinId) => {
  try {
    const response = await axios.delete(`http://localhost:8800/api/pins/${pinId}/delete_desc`, {
      data: { userId: currentUser }
    });

    if (response.status === 200) {
      // Предполагаем, что сервер возвращает обновленный пин с новым описанием
      const updatedPin = response.data;

      // Обновляем список пинов в состоянии
      setPins(pins.map(pin => pin._id === pinId ? updatedPin : pin));

      console.log('Описание пина удалено и заменено на первый отзыв из массива reviews');
    }
  } catch (error) {
    console.error('Ошибка при удалении описания пина:', error.response?.data || error.message);
  }
};
////////////////////////////////////DELETING////////////////////////////////////////////////////////////////////

/////////////////////////////////////////UPDATE//////////////////////////////////////////////////////////////////////////

// Это функция вызывается, когда пользователь хочет редактировать отзыв


const handleReviewSubmit = async () => {
  
  if (editingReview) {
    // Если редактируется отзыв, вызываем функцию обновления
    await handleUpdateReview(
      editingReview.pinId,
      editingReview._id,
      newReviewText,
      newReviewRating
    );
  } else {
    // Если создаётся новый отзыв, вызываем функцию добавления
    await handleAddReview(currentPlaceId, newReviewText, newReviewRating);
  }
  // Очистка формы
  setNewReviewText('');
  setNewReviewRating(0);
  setEditingReview(null); // Выходим из режима редактирования
};


const handleUpdateReview = async (pinId, reviewId, text, rating) => {
  try {
    const res = await axios.put(`http://localhost:8800/api/reviews/${pinId}/update_review/${reviewId}`, {
      text: text,
      rating: rating,
      userId: currentUser // Используем идентификатор текущего пользователя
    });

    if (res.status === 200) {
      setPins(prevPins => prevPins.map(pin => 
        pin._id === pinId ? { ...pin, reviews: pin.reviews.map(review => 
          review._id === reviewId ? { ...review, text, rating } : review
        )} : pin
      ));
    }
  } catch (error) {
    console.error('Ошибка при обновлении отзыва:', error.response?.data || error.message);
  }
};


const hasUserReviewedPin = (pin, username) => {
  return pin.reviews.some((review) => review.username === username);
};



// Функция для начала редактирования отзыва
const startEditingReview = (pinId, review) => {
  console.log('Начинаем редактирование отзыва', review);
  setEditingReview({ ...review, pinId });
  setNewReviewText(review.text);
  setNewReviewRating(review.rating);
  
};

/// pin DESC
// Функция для начала редактирования описания пина создателем
const startEditingPinReview = (pin) => {
  setEditingReview({ ...pin, isEditingDesc: true });
  setNewReviewText(pin.desc);
  setNewReviewRating(pin.rating);
};

// Функция для обновления описания пина
const handleUpdatePinReview = async (pinId) => {
  if (!editingReview.isEditingDesc) {
    console.error('The review is not in editing mode.');
    return;
  }
  try {
    const updatedReview = {
      desc: newReviewText,
      rating: newReviewRating,
      userId: currentUser // вот здесь добавляем userId
    };
    console.log(updatedReview);

    const res = await axios.put(`http://localhost:8800/api/pins/${pinId}/update`, updatedReview);

    if (res.status === 200) {
      setPins(prevPins => prevPins.map(pin => pin._id === pinId ? { ...pin, ...updatedReview } : pin));
      setEditingReview(null);
    }
  } catch (error) {
    console.error('Error updating the pin review:', error.response?.data || error.message);
  }
};


/////////////////////////////////////////UPDATE//////////////////////////////////////////////////////////////////////////


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
      onClick={isRouteMode ? selectPoint : null}
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


    {
      // Отображение построенного маршрута
      route && (
        <Source id="route" type="geojson" data={route.geometry}>
          <Layer
            id="route"
            type="line"
            source="route"
            layout={{
              'line-join': 'round',
              'line-cap': 'round'
            }}
            paint={{
              'line-color': '#603aeb',
              'line-width': 3
            }}
          />
        </Source>
      )
    }
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
      {p._id === currentPlaceId &&
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
      {currentUser === p.username && !p.reviews.length && (
        <button className='button buttonRoute buttonReview' onClick={() => deletePin(p._id)}>Delete Pin</button>
      )}
      {currentUser === p.username && p.reviews.length >= 1 && (
        <button className='button buttonRoute buttonReview' onClick={() => deleteFirstReview(p._id)}>Delte my first review</button>
      )}
      <label>Information</label>
      <span className='username'>Created by <b>{p.username}</b> </span>
      <span className='date'>{format(p.createdAt)}</span>
      <div className="reviews">
        {p.reviews.map(review => (
          <div key={review._id} className="review">
            <label>----------------------------------<br></br> </label>
            <label>Review</label>
            <p className='desc'>{review.text}</p>
            <label>Information<br></br></label>
            <span className='username'>Created by <b>{review.username}</b> </span>
            <span className='date'><br></br>{format(review.createdAt)}</span>
            <div className='stars'>
              {Array(review.rating).fill(<Star className="star" />)}
            </div>
            {review.username === currentUser && (
              <button className='button buttonRoute buttonReview' onClick={() => handleDeleteReview(p._id, review._id, p.username === currentUser)}>Delete</button>
            )}
          </div>
        ))}
        <span className='avg'><b>Average Rating</b><br></br></span>
              {Array(Math.round(AvgRating(p))).fill(<Star className='star'></Star>)}
      </div>

      {currentPlaceId && currentUser && currentUser !== p.username && !hasUserReviewedPin(p, currentUser) && (
        <div className="addReview">
          {/* Форма для добавления нового отзыва */}
          <input
            placeholder="Share your opinion about this place"
            value={newReviewText}
            onChange={(e) => setNewReviewText(e.target.value)}
          />
          <select
            value={newReviewRating}
            onChange={(e) => setNewReviewRating(Number(e.target.value))}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <button
            className='button buttonRoute buttonReview'
            onClick={() => handleAddReview(currentPlaceId)}
          >
            Add Review
          </button>
        </div>
      )}

      {/* Внутри отзывов, кнопки для редактирования и удаления */}
      {p.reviews.map((review) => (
        review.username === currentUser && (
          <div key={review._id} className="review">
            <button className='button buttonRoute buttonReview' onClick={() => startEditingReview(p._id, review)}>Edit Review</button>
          </div>
        )
      ))}

      {currentUser === p.username && (
        <button className='button buttonRoute buttonReview' onClick={() => startEditingPinReview(p)}>Edit Review</button>
      )}

      {/* // При рендере формы для редактирования: */}
      {editingReview && editingReview.isEditingDesc && (
        <div className="editReview">
          <form className='accumForm'>
          {/* Форма редактирования */}
          <input
            value={newReviewText}
            onChange={(e) => setNewReviewText(e.target.value)}
          />
          <select
            value={newReviewRating}
            onChange={(e) => setNewReviewRating(Number(e.target.value))}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            {/* options */}
          </select>
          <button type="button" className='button buttonRoute buttonReview' onClick={() => handleUpdatePinReview(editingReview._id)}>Update Review</button>
          </form>
        </div>
      )}

      {editingReview && !editingReview.isEditingDesc && currentUser !== p.username &&(
        // Если в редактировании - покажем форму с данными редактируемого отзыва
        <div className="addReview">
          <form className='accumForm'>
            <input
              placeholder="Share your opinion about this place"
              value={newReviewText} // Значение должно быть из состояния newReviewText
              onChange={(e) => setNewReviewText(e.target.value)}
            />
            <select
              value={newReviewRating} // Значение должно быть из состояния newReviewRating
              onChange={(e) => setNewReviewRating(Number(e.target.value))}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <button
              type="button"
              className='button buttonRoute buttonReview' 
              onClick={() => handleReviewSubmit()} // Убрал параметры, так как они не используются в handleReviewSubmit
            >
              Update Review
            </button>
          </form>
        </div>
      )}
        <button className='button buttonRoute' onClick={() => buildRouteWithinCountry(p.countryName)}>Build Route In This Country</button>
      </div>
      </Popup>
      }
      </>
      ))}

      {newPlace && (
        <Popup
        latitude={newPlace.lat}
        longitude={newPlace.lng}
        closeButton={true}
        closeOnClick={false}
        onClose={() => setNewPlace(null)}
        anchor="left"
        >
        <div>
          <form onSubmit ={handleSubmit}>
            <label>Title</label>
            <input placeholder='Enter a title' onChange={(e) => setTitle(e.target.value)}/>
            <label>Review</label>
            <textarea placeholder='Share your opinion about this place' onChange={(e) => setDesc(e.target.value)}/>
            <label>Rating</label>
            <select onChange={(e) => setRating(Number(e.target.value))}>
              <option value='1'>1</option>
              <option value='2'>2</option>
              <option value='3'>3</option>
              <option value='4'>4</option>
              <option value='5'>5</option>
            </select>
            <button className='submitButton' type='submit'>Add Pin</button>
          </form>
        </div>
      </Popup>
      )}

    <div className="buttons">
      {/*////////////////////////////////////////////////////////////////////////////////////*/}
        <div className="button-container">
        <button className="button ButtonPoints" onClick={handleShowCustomRouteForm}>
          Build Route Between Two Points
        </button>
        
        {showCustomRouteForm && (
          <form className="custom-route-form" onSubmit={handleCustomRouteSubmit}>
            <input
              type="text"
              placeholder="Enter start point (e.g., 'Cairo, Egypt')"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter end point (e.g., 'Tokyo, Japan')"
              value={endPoint}
              onChange={(e) => setEndPoint(e.target.value)}
            />
            <button className='button PointsRoute' type="submit">Build Route</button>
          </form>
        )}
      </div>
      {/*////////////////////////////////////////////////////////////////////////////////////*/}

      <div className="button-container">
          <button className="button countryRoute" onClick={handleShowCountryInput}>
            Build Route By Country
          </button>

          <button className="button countryRoute" onClick={() => setIsRouteMode(!isRouteMode)}>
              {isRouteMode ? 'Cancel Route' : 'Build Custom Route'}
          </button>

          {isCountryInputVisible &&  (
            <form className="form-popup" onSubmit={handleCountrySubmit}>
              <input className='popup-input'
                type="text"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder="Enter country name"
              />
              <button className="button countryRoute input-button" type="submit">Build Route</button>
            </form>
          )}
      </div>

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
    </div>
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