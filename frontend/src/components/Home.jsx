import * as React from 'react';
import { BrowserRouter as Router, Route,Routes, Switch, useParams,useNavigate,Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from "react";
import * as turf from '@turf/turf';
import { lineString, bezierSpline} from '@turf/turf';
import Map, {Marker, Popup, Source, Layer} from 'react-map-gl';
import axios from 'axios'
import {Room, Star} from '@material-ui/icons';
import {format} from 'timeago.js'
import 'mapbox-gl/dist/mapbox-gl.css';
import '../app.css'
import './Verify/verify.css'
import Register from './Register/Register';
import Login from './Login/Login'
import RequestReset from './RequestReset/RequestReset';
import './layout.css'
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFrczM1NDkiLCJhIjoiY2xmc3U2bXU4MDl2ejNqb2JzeTFpazV5aiJ9.hK8UcLIKZyNtJlpBj_V06g'; 

function Home({ currentUser, handleLogout, myStorage, setCurrentUser, setShowRecover,showRecover, setShowLogin, showLogin }) {
  const navigate = useNavigate();
  // Для ввода города и места
  const [startCity, setStartCity] = useState('');
  const [startPlace, setStartPlace] = useState('');
  const [endCity, setEndCity] = useState('');
  const [endPlace, setEndPlace] = useState('');
  const [showCustomRouteForm1, setShowCustomRouteForm1] = useState(false);
  //////
  const [editingReview, setEditingReview] = useState(null);
  const [pins, setPins] = useState([]);
  const [currentPlaceId,setCurrentPlaceId] = useState(null);
  const [newPlace,setNewPlace] = useState(null);
  const [isCountryInputVisible, setIsCountryInputVisible] = useState(false);
  const [countryInput, setCountryInput] = useState("");
  const [title,setTitle] = useState(null);
  const [desc,setDesc] = useState(null);
  const [rating,setRating] = useState(0);
  const [showRegister,setShowRegister] = useState(false);
  /////////// маршруты

  /////A to B
  const [pointA,setPointA] = useState(null);
  const [pointB,setPointB] = useState(null);
  const [isRouteMode, setIsRouteMode] = useState(false);
  //////////
  const [topRatedPins, setTopRatedPins] = useState([]);
  const [route, setRoute] = useState(null);
  const [newReviewText,setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  ///////
  const [showPins, setShowPins] = useState(true);
  const [viewport, setViewport] = useState({
    latitude: 47.040182,
    longitude: 17.071727,
    zoom: 4,
  });

  const [countriesBordersGeoJSON, setCountriesBordersGeoJSON] = useState(null);

  useEffect(() => {
    fetch('/custom.geo.json')
      .then((response) => response.json())
      .then((data) => {
        console.log('GeoJSON data loaded:', data);
        setCountriesBordersGeoJSON(data);
      })
      .catch((error) => console.error('Error loading GeoJSON:', error));
  }, []);

  useEffect(() => {
    const getPins = async () => {
      try {
        const res = await axios.get("http://localhost:8800/api/pins")
        setPins(res.data)
        //получение мест с оценкой 4 и выше
        const topRate = res.data
        .filter(pins=> pins.rating>=4)
        .sort((a,b)=>b.rating-a.rating)
        setTopRatedPins(topRate)
        //
      }catch (err) {
        console.log(err)
      }
    };
    getPins();
  }, [])

  useEffect(() => {
    if (showRecover) {
      console.log('Show Recover Component');
      // Здесь может быть логика для отображения компонента восстановления пароля
    }
  }, [showRecover]);

  const togglePinsVisibility = () => {
    setShowPins(!showPins); // переключаем состояние видимости пинов
  };

  const handleShowCountryInput = () => {
    setIsCountryInputVisible(!isCountryInputVisible);
  };
  // Обработчик для сабмита формы, который вызывает функцию построения маршрута
  const handleCountrySubmit = (e) => {
    e.preventDefault();
    buildRouteWithinCountry(countryInput);
    setIsCountryInputVisible(false); // Скрываем форму после сабмита
  };

  const handleMarkerClick = (id,lat,long, countryName) => {
    setCurrentPlaceId(id)
    setViewport({...viewport, latitude:lat, longitude:long})
    setShowPopup(true)
  }

  const handleAddClick = (e) => {
    const [lng, lat] = e.lngLat.toArray()
    setNewPlace ({
      lat:lat,
      lng:lng,
    })
  }

 // LAYOUT//////////////////
 const [sortOption, setSortOption] = useState('');
 const [sortedPins, setSortedPins] = useState([]);
 const [selectedCountry, setSelectedCountry] = useState('');
 const [selectedRating, setSelectedRating] = useState(0);
 const [showPinList, setShowPinList] = useState(false);

 const sortPins = (option) => {
   let sorted = [...pins];
   if (option === 'rating') {
     sorted.sort((a, b) => AvgRating(b) - AvgRating(a));
   } else if (option === 'country') {
     sorted.sort((a, b) => a.countryName.localeCompare(b.countryName));
   }
   setSortedPins(sorted);
 };

 useEffect(() => {
   sortPins(sortOption);
 }, [pins, sortOption]);

 const handleSortOptionChange = (e) => {
   setSortOption(e.target.value);
 };

 const handleCountryChange = (e) => {
   setSelectedCountry(e.target.value);
 };

 const handleRatingChange = (e) => {
   setSelectedRating(Number(e.target.value));
 };

 const filterPins = () => {
   let filteredPins = pins;

   if (selectedCountry) {
     filteredPins = filteredPins.filter(pin => pin.countryName === selectedCountry);
   }

   if (selectedRating) {
     filteredPins = filteredPins.filter(pin => AvgRating(pin) === selectedRating);
   }

   if (sortOption === 'rating') {
     filteredPins.sort((a, b) => AvgRating(b) - AvgRating(a));
   } else if (sortOption === 'country') {
     filteredPins.sort((a, b) => a.countryName.localeCompare(b.countryName));
   }

   return filteredPins;
 };
                                                             // LAYOUT//////////////////


  //////inside city/////
  const handleShowCustomRouteForm1 = () => {
    setShowCustomRouteForm1(prevState => !prevState);
  };

  const geocodeLocation1 = async (locationName, cityName) => {
    const fullLocationName = `${locationName}, ${cityName}`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullLocationName)}.json?access_token=${MAPBOX_TOKEN}`;
    console.log(`Geocoding URL: ${url}`); // Добавлено для отладки
    try {
      const response = await axios.get(url);
      const data = response.data;
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        console.log(`Geocoded coordinates for ${fullLocationName}:`, coordinates);
        return coordinates;
      } else {
        console.error(`Location not found for ${fullLocationName}`);
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  };

  const buildCustomRouteFromNames1 = async (startCity, startPlace, endCity, endPlace) => {
    try {
      const startPointCoordinates = await geocodeLocation1(startPlace, startCity);
      const endPointCoordinates = await geocodeLocation1(endPlace, endCity);

      if (!startPointCoordinates || !endPointCoordinates) {
        console.error('One or both locations could not be geocoded');
        return;
      }

      const startPoint = { lng: startPointCoordinates[0], lat: startPointCoordinates[1] };
      const endPoint = { lng: endPointCoordinates[0], lat: endPointCoordinates[1] };
      console.log('Start Point:', startPoint);
      console.log('End Point:', endPoint);

      if (startPoint.lng < -180 || startPoint.lng > 180 || startPoint.lat < -90 || startPoint.lat > 90 ||
          endPoint.lng < -180 || endPoint.lng > 180 || endPoint.lat < -90 || endPoint.lat > 90) {
        console.error('Invalid coordinates received:', startPoint, endPoint);
        return;
      }
      
      const nearestTopRatedPlace = findNearestTopRatedPlace(startPoint, endPoint, topRatedPins);

      let waypoints = '';
      if (nearestTopRatedPlace) {
        waypoints = `${nearestTopRatedPlace.long},${nearestTopRatedPlace.lat}`;
      }

      const coordinates = `${startPoint.lng},${startPoint.lat}${waypoints ? ';' + waypoints : ''};${endPoint.lng},${endPoint.lat}`;
      console.log('Coordinates for Mapbox request:', coordinates);
      const mapboxRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;

      const response = await axios.get(mapboxRequestUrl);
      const data = response.data;
      if (data.routes && data.routes.length) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const line = lineString(coordinates);
        const smoothedLine = bezierSpline(line);
        setRoute(smoothedLine);
        console.log('Route set:', data.routes[0]);
      } else {
        console.error('No routes found in the mapbox response');
        setRoute(null);
      }
    } catch (error) {
      console.error('Error building route:', error);
      setRoute(null);
    }
  };

  const handleCustomRouteSubmit1 = async (e) => {
    e.preventDefault();
    setShowCustomRouteForm1(false);
    await buildCustomRouteFromNames1(startCity, startPlace, endCity, endPlace);
  };
  //////inside city/////


  /////////////////////////////////////////////////////ALL TOP RATED PINS IN 1 CITY///////////////////////////////////////////////////////////////////////////////////////
  const [showCityRouteForm, setShowCityRouteForm] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const geocodeCity = async (lat, long) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json?access_token=${MAPBOX_TOKEN}`;
    try {
      const response = await axios.get(url);
      const data = response.data;
      console.log('Geocoding response:', data);  // Добавлено для отладки
      if (data.features && data.features.length > 0) {
        // Находим feature с типом "place" для получения названия города
        const cityFeature = data.features.find(feature => feature.place_type.includes('place'));
        console.log('City Feature:', cityFeature);  // Добавлено для отладки
        return cityFeature;
      } else {
        console.error('Location not found');
        return null;
      }
    } catch (error) {
      console.error('Error geocoding city:', error);
      return null;
    }
  };
  
  
  const buildCityRoute = async (cityName, countryName) => {
    const cityPins = pins.filter(pin => pin.city === cityName && pin.countryName === countryName && AvgRating(pin) >= 4);
    if (cityPins.length === 0) {
      console.error('No high-rated pins found in this city');
      return;
    }
  
    const coordinates = cityPins.map(pin => `${pin.long},${pin.lat}`).join(';');
    const mapboxRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
  
    try {
      const response = await axios.get(mapboxRequestUrl);
      const data = response.data;
      if (data.routes && data.routes.length) {
        const route = data.routes[0];
        const line = lineString(route.geometry.coordinates);
        const smoothedLine = bezierSpline(line);
        setRoute(smoothedLine);
      } else {
        console.error('No routes found in the Mapbox response.');
        setRoute(null);
      }
    } catch (error) {
      console.error('Error requesting Mapbox API:', error);
      setRoute(null);
    }
  };
  
  const handleCityRouteSubmit = async (e) => {
    e.preventDefault();
    setShowCityRouteForm(false);
    await buildCityRoute(city, country);
  };
  /////////////////////////////////////////////////////ALL TOP RATED PINS IN 1 CITY///////////////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async (e) =>{
    e.preventDefault();
    console.log("Submitting with rating: ", rating);
    const cityData = await geocodeCity(newPlace.lat, newPlace.lng);
    const countryData = await getCountryBounds(newPlace.lat, newPlace.lng);
    // Если данные о стране получены, используем поле name_en для названия страны
    const countryName = countryData ? countryData.name_en : 'Unknown';
  
    // Используем поле text из cityFeature для названия города
    const cityName = cityData ? cityData.text : 'Unknown';
  
    console.log(countryName);
    console.log(cityName);
    
    const newPin = {
      username: currentUser,
      title,
      desc,
      rating,
      countryName,
      city: cityName,  // здесь добавляем город
      lat: newPlace.lat,
      long: newPlace.lng
    };
    
    try {
      const res = await axios.post("http://localhost:8800/api/pins", newPin);
      const addedPin = res.data; // предполагаем, что добавленный пин возвращается в ответе
      setPins([...pins, addedPin]);
      if (addedPin.rating >= 4) {
        setTopRatedPins([...topRatedPins, addedPin].sort((a, b) => b.rating - a.rating));
      }
      setNewPlace(null);
    }
    catch(err){
      console.log(err);
    }
  };

  function userHasReviewedPin(pin, currentUser) {
    // Проверяем, оставил ли пользователь отзыв при создании пина
    const createdReview = pin.username === currentUser;
    // Проверяем, есть ли отзывы в массиве отзывов от этого пользователя
    const addedReview = pin.reviews && pin.reviews.some(review => review.username === currentUser);

    return createdReview || addedReview;
  }

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
    return  res //totalRating  / totalReviews;
  }

  // Этот useEffect сработает каждый раз когда список pins изменится
  // Функция пересчета topRatedPins с использованием useCallback для оптимизации

  const recalculateTopRatedPins = useCallback(() => {
    const newTopRatedPins = pins.filter(pin => AvgRating(pin) >= 4)
      .sort((a, b) => AvgRating(b) - AvgRating(a));
    setTopRatedPins(newTopRatedPins);
  }, [pins]);

  const handleAddReview = async (pinId) => {
    const newReview = {
      username: currentUser,
      text: newReviewText,
      rating: newReviewRating
    };
    if (hasUserReviewedPin(pins.find((p) => p._id === pinId), currentUser)) {
      console.log('User has already reviewed this pin.');
      return;
    }

    try {
      const res = await axios.post(`http://localhost:8800/api/reviews/${pinId}/add_review`, newReview);
      if (res.status === 200) {
        const updatedPin = res.data;
        setPins(prevPins => prevPins.map(pin => (pin._id === pinId ? updatedPin : pin)));
        setNewReviewText('');
        setNewReviewRating(0);
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  ////////////////////////////////////DELETING////////////////////////////////////////////////////////////////////
  const handleDeleteReview = async (pinId, reviewId) => {
    try {
      const response = await axios.delete(`http://localhost:8800/api/reviews/${pinId}/delete_review/${reviewId}`, {
        data: { userId: currentUser }
      });

      if (response.status === 200) {
        // Обновить состояние пинов после удаления отзыва
        setPins(prevPins => prevPins.map(pin => {
          if (pin._id === pinId) {
            // Обновить отзывы для этого пина исключая удаленный
            const updatedReviews = pin.reviews.filter(review => review._id !== reviewId);
            // Вернуть обновленный пин
            return { ...pin, reviews: updatedReviews };
          }
          return pin;
        }));
        console.log("Отзыв удален");
        // Сбросить состояние редактируемого отзыва если это был удаленный отзыв
        if (editingReview && editingReview._id === reviewId) {
          setEditingReview(null);
        }
      }
    } 
    catch (error) {
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
        console.log('Pin has been deleted');
      }
    } catch (error) {
      console.error('Error:', error.response.data);
    }
  };
//Удаление отзыва создателем пина когда есть другие отзывы
  const deleteFirstReview = async (pinId) => {
    try {
      const response = await axios.delete(`http://localhost:8800/api/pins/${pinId}/delete_desc`, {
        data: { userId: currentUser }
      });
      if (response.status === 200) {
        const updatedPin = response.data;
        // Обноdbnm список пинов в состоянии
        setPins(pins.map(pin => pin._id === pinId ? updatedPin : pin));
        console.log('Описание пина удалено и заменено на первый отзыв из массива reviews');
      }
    } 
    catch (error) {
      console.error('Ошибка при удалении описания пина:', error.response?.data || error.message);
    }
  };
////////////////////////////////////DELETING////////////////////////////////////////////////////////////////////

/////////////////////////////////////////UPDATE//////////////////////////////////////////////////////////////////////////
  const handleReviewSubmit = async () => {
    if (editingReview) {
      await handleUpdateReview(
        editingReview.pinId,
        editingReview._id,
        newReviewText,
        newReviewRating
      );
    } else {
      await handleAddReview(currentPlaceId, newReviewText, newReviewRating);
    }
    setNewReviewText('');
    setNewReviewRating(0);
    setEditingReview(null);
  };

  const handleUpdateReview = async (pinId, reviewId, text, rating) => {
    try {
      const res = await axios.put(`http://localhost:8800/api/reviews/${pinId}/update_review/${reviewId}`, {
        text: text,
        rating: rating,
        userId: currentUser 
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
    } 
    catch (error) {
      console.error('Error updating the pin review:', error.response?.data || error.message);
    }
  };
  /////////////////////////////////////////UPDATE//////////////////////////////////////////////////////////////////////////
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
    // Огранинение количества точек для маршрута чтобы избежать превышения ограничений API.
    const MAX_ROUTE_POINTS = 4; 
    const eligiblePins = topRatedPins.filter(pin => AvgRating(pin) >= 4);
    const sortedPins = [...eligiblePins].sort((a, b) => AvgRating(b) - AvgRating(a));
    const topPins = sortedPins.slice(0, MAX_ROUTE_POINTS);
    // Формируем строку координат для Mapbox API из первых 10 высокооцененных точек
    const coordinates = topPins.map(pin => `${pin.long},${pin.lat}`).join(';');
    const mapboxRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
    try {
      const response = await axios.get(mapboxRequestUrl);
      const data = response.data;
      console.log(data);
      // Проверяем что полученный ответ содержит маршруты
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
      } 
      else {
        // Обработка случаев, когда маршрут не найден или ошибка в данных
        console.error('No routes found in the Mapbox response.');
        setRoute(null);
      }
    } 
    catch (err) {
      console.error('Ошибка при запросе к Mapbox API:', err);
      setRoute(null);
    }
  };
  const buildRouteWithinCountry = async (countryName) => {  // Функция для построения маршрута внутри страны
    const MAX_ROUTE_POINTS = 10;
    const withinCountryPins = pins.filter(pin =>   // Фильтрация пинов внутри заданной страны и с оценкой 4 и выше
    pin.countryName === countryName && AvgRating(pin) >= 4);
    const sortedPins = withinCountryPins.sort((a, b) => AvgRating(b) - AvgRating(a)).slice(0, MAX_ROUTE_POINTS); // Сортировка пинов по среднему рейтингу и взятие первых MAX_ROUTE_POINTS
    const coordinates = sortedPins.map(pin => `${pin.long},${pin.lat}`).join(';');  // Получение координат для построения маршрута
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
    } 
    catch (err) {
      console.error('Error requesting Mapbox API:', err);
      setRoute(null);
    }
  };
    ////A TO B///////////////////////
  const selectPoint = (e) => {
    if (!isRouteMode){
      return;
    } 
    const [lng, lat] = e.lngLat.toArray();

    if (!pointA) {
      setPointA({ lat, lng });
      console.log('Point A is set: ', { lat, lng });
    } 
    else {
      setPointB({ lat, lng });
      console.log('Point B is set: ', { lat, lng }); 
      buildCustomRoute(pointA, { lat, lng }, topRatedPins);
      setPointA(null); 
      setPointB(null); 
      setIsRouteMode(false); 
    }
  };

    // для поиска ближайшего высокооцененного места
  const findNearestTopRatedPlace = (pointA,pointB,topRatedPins) => {
    if (!Array.isArray(topRatedPins) || topRatedPins.length === 0) {
      console.error('No top rated pins provided');
      return null;
    }
    const line = turf.lineString([[pointA.lng, pointA.lat], [pointB.lng, pointB.lat]]);
    let nearestPlace = null;
    let nearestDistance = Infinity;
    topRatedPins.forEach(pin => {
      if (pin && typeof pin.rating === 'number' && AvgRating(pin) >= 4) {
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
    //для построения пользовательского маршрута
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

    ////////////////////////////BUTTON FOR A TO B ROUTE//////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [showCustomRouteForm, setShowCustomRouteForm] = useState(false);

  const handleShowCustomRouteForm = () => {
    setShowCustomRouteForm(prevState => !prevState); // Переключает состояние между true и false
  };

  const buildCustomRouteFromNames = async (startName, endName) => {
    try {
      // let startPointCoordinates = findPinByName(startName);
      // let endPointCoordinates = findPinByName(endName);
      // console.log("STARTNAME",startName);
      //   console.log("ENDNAME",endName);
      //   console.log("STARPOINT",startPointCoordinates);
      //   console.log("ENDPOINT",endPointCoordinates);
      
      const startPointCoordinates = await geocodeLocation(startName);
      const endPointCoordinates = await geocodeLocation(endName);

      // console.log("STARTNAME",startName);
      // console.log("ENDNAME",endName);
      // console.log("STARPOINT",startPointCoordinates);
      // console.log("ENDPOINT",endPointCoordinates);
      //console.log("NEAREST",nearestTopRatedPlace);
      //console.log("WAYPOINTS",waypoints);

      if (!startPointCoordinates || !endPointCoordinates) {
        console.error('One or both locations could not be geocoded');
        return;
      }
    
      // Поиск ближайшего высокооцененного места к каждой из точек маршрута
      const startPoint = { lng: startPointCoordinates[0], lat: startPointCoordinates[1] };
      const endPoint = { lng: endPointCoordinates[0], lat: endPointCoordinates[1] };
      const nearestTopRatedPlace = findNearestTopRatedPlace(startPoint, endPoint, topRatedPins);
      let waypoints = '';
      if (nearestTopRatedPlace) {
        waypoints = `${nearestTopRatedPlace.long},${nearestTopRatedPlace.lat}`;
      }
      console.log("NEAREST",nearestTopRatedPlace);
      console.log("WAYPOINTS",waypoints);
      const coordinates = `${startPoint.lng},${startPoint.lat}${waypoints ? ';' + waypoints : ''};${endPoint.lng},${endPoint.lat}`;
      const mapboxRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
      const response = await axios.get(mapboxRequestUrl);
      const data = response.data;
      if (data.routes && data.routes.length) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const line = lineString(coordinates);
        const smoothedLine = bezierSpline(line);
        setRoute(smoothedLine);
        console.log('Route set:', data.routes[0]);
      } 
      else {
        console.error('No routes found in the mapbox response');
        setRoute(null);
      }
      await buildCustomRoute({
        lng: startPointCoordinates[0], 
        lat: startPointCoordinates[1]
      }, 
      {
        lng: endPointCoordinates[0], 
        lat: endPointCoordinates[1]
      }, topRatedPins);
    } 
    catch (error) {
    console.error('Error building route:', error);
    setRoute(null);
  }
  };
  // Обработчик события для подтверждения формы
  const handleCustomRouteSubmit = async (e) => {
    e.preventDefault();
    setShowCustomRouteForm(false);
    await buildCustomRouteFromNames(startPoint, endPoint);
  };
  // для геокодирования названия места
  const geocodeLocation = async (locationName) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}`;
    try {
      const response = await axios.get(url);
      const data = response.data;
      console.log(locationName);
      if (data.features && data.features.length > 0) {
        console.log(`Geocoded coordinates for ${locationName}:`, data.features[0].geometry.coordinates);
        return data.features[0].geometry.coordinates;
      } else {
        console.error(`Location not found for ${locationName}`);
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  };
  ////////////////////////////BUTTON FOR A TO B ROUTE//////////////////////////////////////////////////////////////////////////////////////////////////////////
const [showPopup, setShowPopup] = useState(true);

return (
  <div className='Home'>
    <Map
      initialViewState={{...viewport}}
      style={{width: "100vw", height: "100vh"}}
      mapStyle="mapbox://styles/safak/cknndpyfq268f17p53nmpwira"
      mapboxAccessToken={MAPBOX_TOKEN}
      onViewportChange={(viewport) => setViewport(viewport)}
      onDblClick={handleAddClick}
      onClick={isRouteMode ? selectPoint : null}
      transitionDuration="200"
    >
      {showPins && pins.map(p => (
        <>
          <Marker
            latitude={p.lat}
            longitude={p.long}
            offsetLeft={-viewport.zoom * 5}
            offsetTop={-viewport.zoom * 10}
            anchor="bottom"
          >
            <Room
              style={{fontSize: (10 * viewport.zoom), color: p.username === currentUser ? "tomato" : userHasReviewedPin(p, currentUser) ? "teal" : "slateblue", cursor: "pointer"}}
              onClick={() => handleMarkerClick(p._id, p.lat, p.long, p.countryName)}
            />
          </Marker>

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
                  <button className='button buttonRoute buttonReview' onClick={() => deleteFirstReview(p._id)}>Delete my first review</button>
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

                {editingReview && editingReview.isEditingDesc && (
                  <div className="editReview">
                    <form className='accumForm'>
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
                      </select>
                      <button type="button" className='button buttonRoute buttonReview' onClick={() => handleUpdatePinReview(editingReview._id)}>Update Review</button>
                    </form>
                  </div>
                )}

                {editingReview && !editingReview.isEditingDesc && currentUser !== p.username && (
                  <div className="addReview">
                    <form className='accumForm'>
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
                        type="button"
                        className='button buttonRoute buttonReview'
                        onClick={() => handleReviewSubmit()}
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
            <form onSubmit={handleSubmit}>
              <label>Title</label>
              <input placeholder='Enter a title' onChange={(e) => setTitle(e.target.value)} />
              <label>Review</label>
              <textarea placeholder='Share your opinion about this place' onChange={(e) => setDesc(e.target.value)} />
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
        <div className="button-container">
          <button className="button ButtonPoints" onClick={handleShowCustomRouteForm}>
            Build Route Between Two Points
          </button>

          <button className="button ButtonPoints LayoutPin" onClick={() => setShowPinList(!showPinList)}>
            {showPinList ? "Hide Pin List" : "Show Pin List"}
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

        <div className="button-container">
          <button className="button countryRoute ButtonByCountry" onClick={handleShowCountryInput}>
            Build Route By Country
          </button>
          <button className="button countryRoute" onClick={() => setIsRouteMode(!isRouteMode)}>
            {isRouteMode ? 'Cancel Route' : 'Build Custom Route'}
          </button>

          {isCountryInputVisible && (
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

        <div className="button-container">
          <button className="button ButtonPoints ButtonIsideCity" onClick={handleShowCustomRouteForm1}>
            Build Route Inside City
          </button>

          {showCustomRouteForm1 && (
            <form className="custom-route-form" onSubmit={handleCustomRouteSubmit1}>
              <input
                type="text"
                placeholder="Enter start city (e.g., 'Kettering')"
                value={startCity}
                onChange={(e) => setStartCity(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter start place (e.g., 'Prezzo')"
                value={startPlace}
                onChange={(e) => setStartPlace(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter end city (e.g., 'Kettering')"
                value={endCity}
                onChange={(e) => setEndCity(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter end place (e.g., 'Savers')"
                value={endPlace}
                onChange={(e) => setEndPlace(e.target.value)}
              />
              <button className='button PointsRoute' type="submit">Build Route</button>
            </form>
          )}
        </div>

        <div className="button-container">
          <button className="button ButtonPoints" onClick={() => setShowCityRouteForm(!showCityRouteForm)}>
            Build Route in City
          </button>
          {showCityRouteForm && (
            <form className="custom-route-form" onSubmit={async (e) => {
              e.preventDefault();
              setShowCityRouteForm(false);
              await buildCityRoute(city, country);
            }}>
              <input
                type="text"
                placeholder="Enter country name (e.g., 'USA')"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter city name (e.g., 'New York')"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <button className='button PointsRoute' type="submit">Build Route</button>
            </form>
          )}
        </div>

        <button className="button visibilityPinButton" onClick={togglePinsVisibility}>
          {showPins ? "Hide Pins" : "Show Pins"}
        </button>

        {currentUser
          ? (<button className="button logout" onClick={handleLogout}>LogOut</button>)
          :
          (
            <>
              <button className="button login" onClick={() => navigate('/login')}>LogIn</button>
              <button className="button register" onClick={() => navigate('/register')}>Register</button>
            </>
          )}
      </div>

      {showPinList && (
        <div className="pin-list">
          <form className='sort-form'>
            <label>Sort By:</label>
            <select value={sortOption} onChange={handleSortOptionChange}>
              <option value="">None</option>
              <option value="rating">Rating</option>
              <option value="country">Country</option>
            </select>
          </form>
          <div className="filter-container">
            <select className='select-country' value={selectedCountry} onChange={handleCountryChange}>
              <option value="">All Countries</option>
              {Array.from(new Set(pins.map(pin => pin.countryName))).map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select value={selectedRating} onChange={handleRatingChange}>
              <option value={0}>All Ratings</option>
              <option value={5}>5 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={2}>2 Stars</option>
              <option value={1}>1 Star</option>
            </select>
          </div>
          <ul>
            {filterPins().map(pin => (
              <li key={pin._id}>
                <strong>{pin.title}</strong> ({pin.countryName}) - Rating: {AvgRating(pin)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRegister && <Register setShowRegister={setShowRegister} />}

      {showRecover ?
        (<RequestReset setShowRecover={setShowRecover} />)
        :
        (showLogin && <Login setShowRecover={setShowRecover} setShowLogin={setShowLogin} myStorage={myStorage} setCurrentUser={setCurrentUser} />)
      }

      {countriesBordersGeoJSON && (
        <Source id="countries" type="geojson" data={countriesBordersGeoJSON}>
          <Layer
            id="countries-borders"
            type="line"
            paint={{
              'line-color': '#0eabed', // Цвет линий границ
              'line-width': 2 // Ширина линий границ
            }}
          />
        </Source>
      )}

      {/* Отображение маршрута */}
      {route && (
        <Source id="route" type="geojson" data={route}>
          <Layer
            id="route"
            type="line"
            layout={{
              'line-join': 'round',
              'line-cap': 'round'
            }}
            paint={{
              'line-color': '#61e740',
              'line-width': 5
            }}
          />
        </Source>
      )}

    </Map>
  </div>
);
}
export default Home
