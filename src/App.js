import React, { memo, useRef, useEffect, useState } from 'react';
import { Select } from '@buffetjs/core';
import Modal from 'react-modal';
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder';
import MapboxGLDraw from "@mapbox/mapbox-gl-draw";
import MapboxGL from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import './index.css'

const host ='http://161.97.167.92:1337';
MapboxGL.accessToken = "pk.eyJ1IjoiZHJ1bGxhbiIsImEiOiJja2l4eDBpNWUxOTJtMnRuejE1YWYyYThzIn0.y7nuRLnfl72qFp2Rq06Wlg"

const routesOrigin = host+'/routes'
const polygonsOrigin = host+'/polygons'
const placesOrigin = host+'/my-places'

const mapTile = 'mapbox://styles/mapbox/streets-v11'
const placesLimit = 6;
const user_id = 12;

const messages = {
  chooseRoute : 'Choose a route...'
}

//XXX: NOW IS MORE OR LESS EUROPE!!!
const bounds = [
  [-25, 53], // Southwest coordinates
  [ 58, 2 ]  // Northeast coordinates
];

const center = {
  lat: 39.79,
  lng: 2.68,
  zoom: 3
}

const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
}

var MapboxLanguage = require('@mapbox/mapbox-gl-language');

const Draw = new MapboxGLDraw({
  displayControlsDefault: true,
  controls: {
    polygon: true,
    polyline: true,
    marker: true,
    trash: true
  }
});

const HomePage = () => {  

  const map = useRef(null);
  const mapContainer = useRef(null);

  // The main center of the map
  const [lat, setMapLat] = useState(center.lat);// Mallorca is the map center ;)
  const [lng, setMapLng] = useState(center.lng);// Mallorca is map center ;)
  const [zoom, setMapZoom] = useState(center.zoom);

  const [routeName, setRouteName] = useState('')
  const [routeDescription, setRouteDescription] = useState('')
  const [routeGeoData, setRouteGeoData] = useState([])
  const [modalStatus, setModalStatus] = useState(false);  
  const [clientRoutes, setClientRoutes] = useState([]);
  
  const [newRouteId, setNewRouteId] = useState('0')

  var subtitle, subtitle2;

  function afterOpenModal() {
    subtitle.style.color = '#000';
  }


  if (typeof(window) !== 'undefined') {
    Modal.setAppElement('body')
  }

  useEffect(() => { 
    fetch(routesOrigin+'?created_by='+user_id)
    .then((res) => res.json())
    .then(setClientRoutes); 
  },[user_id]);

  useEffect(() => {
    loadMap()
  },[]);



  function loadMap(){
    
    if (map.current) return; // initialize map only once

    map.current = new MapboxGL.Map({
      container: mapContainer.current,
      containerStyle: {
        position:'absolute',
        top:0,
        bottom:0,
        width:'100%',
        minHeight: '1000px'
      },
      style: mapTile,
      center: [lng, lat],
      zoom: zoom,
      //maxBounds: bounds // Sets bounds as max
    });

    map.current.on('load', function () {      

      map.current.addControl(Draw, 'top-left');
      map.current.resize()      

      map.current.addControl(new MapboxGLGeocoder({
        accessToken: MapboxGL.accessToken,
        marker: false
      }));      

      map.current.on('move', () => {
        setMapLng(map.current.getCenter().lng.toFixed(4));
        setMapLat(map.current.getCenter().lat.toFixed(4));
        setMapZoom(Math.round(map.current.getZoom()));
      });

      map.current.on('draw.create', createDrawArea);
      map.current.on('draw.update', updateDrawArea);
      map.current.on('draw.delete', deleteDrawArea);
      map.current.addControl(new MapboxLanguage());
      //map.current.addControl(new MapboxGL.FullscreenControl());
      //map.current.addControl(new MapboxGL.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }));

    });

    const createDrawArea = (e) => { storedMap(e, Draw.getAll()) }
    const updateDrawArea = (e) => { storedMap(e, Draw.getAll()) }    
    const deleteDrawArea = (e) => { storedMap(e, Draw.getAll()) }   

  }

  function storedMap(e, data){
    setStorage('currentMap', data)
    setRouteGeoData(data)
  }


  function setStorage(key, data, type='json'){
    return ( type === 'json')
      ? localStorage.setItem(key, JSON.stringify(data))
      : localStorage.setItem(key, data)
  }

  function getStorage(key, type='json'){
    return (type === 'json')
      ? JSON.parse(localStorage.getItem(key))
      : localStorage.getItem(key);
  }

  function launchToast(message, doContinue=false){
    alert(message);
    closeModal()
    return doContinue
  }

  // Checking stored LiveMap
  function checkFeaturesAmount(data=[], type='Point'){
    let amount = 0
    for(var i=0; i < data.features.length; i++){
      if( data.features[i].geometry.type === type){
        amount++
      } 
    }
    return amount
  }

  function getRouteLine(data=[], type='Point'){
    for(var i=0; i < data.features.length; i++){
      if( data.features[i].geometry.type === type){
        return data
      } 
    }
  }


  function openModal() {
    setModalStatus(true);
  }


  function closeModal(){
    setModalStatus(false);
  }

  async function postData(url = '', data = {}) {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: { 'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    }).catch(function(error) {
      console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }

  function viewRouteData(){
    console.log('Route name: '+routeName)
    console.log('Route description: '+routeDescription)
    console.log(routeGeoData)
  }

  function getSaveRouteModal(){
    return <Modal
      isOpen={modalStatus}
      onAfterOpen={afterOpenModal}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Save your route"
    >
      <h2 ref={_subtitle => (subtitle = _subtitle)}>Save your route</h2>
      <label ref={_subtitle2 => (subtitle2 = _subtitle2)}>Please, include the basic info...</label>
      <form>
        <div className='table'>
          <div className='row'>
            <div className='col-12'>
              <label>Route Name</label>
            </div>
            <div className='col-12'>
              <input type='text' id='route-name' onChange={e=>{setRouteName(e.target.value)}}/>
            </div>
          </div>
          <div className='row'>
            <div className='col-12'>
            <label>Route Description</label>
            </div>
            <div className='col-12'>
            <textarea id='route-description' onChange={e=>{setRouteDescription(e.target.value)}}/>
            </div>
          </div>

          <div className='row'>
            <div className='col-6'>
              <button onClick={closeModal}>Cancel</button>
            </div>
            <div className='col-6'>
              <button onClick={saveRoute}>Save</button>
            </div>
          </div>        
        </div>
      </form>
    </Modal>
  }


  function saveRoute(){      
    
    console.log('Route name: '+routeName)
    console.log('Route description: '+routeDescription)
    console.log(routeGeoData)

    // Analizing the data to save :)
    if(routeGeoData.length > 0){

      // 1.- Only a Linestring is allowed!! Not two      

        let storedLinesAmount = checkFeaturesAmount(routeGeoData, 'LineString');
        if(storedLinesAmount > 1 ){
          if(!launchToast('You are unable to draw two lines for a route. You must delete '+(storedLinesAmount-1)+' lines')) return false
        }else if(storedLinesAmount === 0){
          if(!launchToast('You must draw one route, at least')) return false
        }          

      // 2.- Now you will set the first location (meeting-point)

        let storedPointsAmount = checkFeaturesAmount(routeGeoData, 'Point');
        if(storedPointsAmount < 1 ){
          if (!window.confirm("You don't have addressed any Place to your route. We encourage you to put, at least, one Place Marker ;)' Do you really want to save?")) {
            if(!launchToast('You cancel to save this Route')) return false
          }
        }else if(storedPointsAmount > placesLimit ){
          if(!launchToast('You have passed the amount limit of Places on your route. Please, the limit are '+placesLimit)) return false
        }

    }else{
      if(!launchToast("You haven't created a route. Please, print at least a Route!")) return false
    }

    subtitle2.style.color = 'green';
    //launchToast("Everything is ok. We gonna save the route. Please wait...")

    processSave(routeGeoData)

  }

  function postRoute(){

    let postRouteData = {
      "name": routeName,
      "creator": user_id,
      "description": [
        {
          "language": 1,
          "label": routeName,
          "description": routeDescription
        }
      ],
      "map_data" : {
        "center_lat": lat,
        "center_long": lng,
        "center_zoom": zoom,
        "data" : JSON.stringify(getRouteLine(routeGeoData))
      }
    }
    
    postData(host+'/routes', postRouteData )
    .then(data => {
      console.log('Route was posted successful ;)')
      setNewRouteId(data.id)
    });

    console(newRouteId);

  }

  function postPlace(key, placeFeatures, markerType=3, i){

    let postPlaceData = {
      "name": routeName+' Place '+i,
      "creator": user_id,
      "parent_route" : newRouteId,
      "description": [
        {
          "language": 1,
          "label": routeName+' Place '+i,
          "description": routeDescription
        }
      ],
      "map_data": {
        "center_lat": lat,
        "center_long": lng,
        "center_zoom": zoom,
        "data": JSON.stringify(placeFeatures)
      }
    }    
    
    postData(host+'/my-places', postPlaceData )
    .then(data => {
      console.log('Place '+key+' posted successful ;)')
    });

  }

  function postPolygon(key, polygonFeatures, i){

    let postRouteData = {
      "name": routeName+' Warning Polygon '+i,
      "creator": user_id,
      "parent_route" : newRouteId,
      "map_data": {
        "id": "string",
        "center_lat": lat,
        "center_long": lng,
        "center_zoom": zoom,
        "data": JSON.stringify(polygonFeatures)
      },
    }
    
    postData(host+'/polygons', postRouteData )
    .then(data => {
      console.log('Polygon '+key+' posted successful ;)')
    });

  }

  function processSave(storedRoute){
    postRoute()
    if(newRouteId){
      for(var i=0; i < storedRoute.features.length; i++){
        if(storedRoute.features[i].geometry.type === 'Point'){
          postPlace(storedRoute.features[i].id, storedRoute, i)
        }else if(storedRoute.features[i].geometry.type === 'Polygon'){
          postPolygon(storedRoute.features[i].id, storedRoute, i)
        }
      }
    }
    closeModal()
  } 

  return (
    <>
      <div className="row">
        <div className="col-lg-8 col-md-12">
            <div>
              <div>
                {/*<div className="sidebar">
                  Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
                </div>
                {renderRoutesSelector(clientRoutes)}*/}
                <button color="success" disabled="" onClick={openModal}>Save route</button>
                <div className="calculation-box">                  
                  <div id="calculated-area"></div>
                </div>
                <div ref={mapContainer} className="map-container" />
              </div>
            </div>
        </div>
        <div className="col-md-12 col-lg-4">
          {getSaveRouteModal()}       
          {/*<button onClick={viewStored('currentMapData')}>[View storage]</button>   */}
          
        </div>
      </div>
    </>
  );

};

export default memo(HomePage)

  /*const [clientPlaces, setClientPlaces] = useState([]);
  useEffect(() => { 
    fetch(placesOrigin+'?created_by='+user_id)
    .then((res) => res.json())
    .then(setClientPlaces); 
  },[user_id]);  
  
  const [clientPolygons, setClientPolygons] = useState([]);
  useEffect(() => { 
    fetch(polygonsOrigin+'?created_by='+user_id)
    .then((res) => res.json())
    .then(setClientPolygons); 
  },[user_id]);

  function setRoute(e){
    console.log(e)
  }

    function renderRoutesSelector(routes){
    var options = [{ value: '0', label: messages.chooseRoute }]
    for(var i = 0; i < routes.length; i++){
      options.push({ value: routes[i].id.toString(), label: routes[i].name })
    }
    return <Select
      name="route"
      options={options} onChange={e=>{setRoute(e)}}
    />
  }

  */