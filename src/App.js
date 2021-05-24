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
const MapboxLanguage = require('@mapbox/mapbox-gl-language');

const routesOrigin = host+'/routes'
const polygonsOrigin = host+'/polygons'
const placesOrigin = host+'/my-places'

const mapTile = 'mapbox://styles/mapbox/streets-v11'
const placesLimit = 6;
const user_id = 12;

const messages = {
  chooseRoute : 'Choose a route...'
}

const customStyles = {
  content : {
    //width                 : '45%',
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
}



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

  // Map Settings
  const map = useRef(null);
  const mapContainer = useRef(null);
  const mapOptions = getStorage('currentMapOptions') ?? {
    lat: 39.79, lng: 2.68, zoom: 3
  }
  const [lat, setMapLat] = useState(mapOptions.lat);// Mallorca is the map center ;)
  const [lng, setMapLng] = useState(mapOptions.lng);// Mallorca is map center ;)
  const [zoom, setMapZoom] = useState(mapOptions.zoom);

  // NEW Route settings
  const [routeName, setRouteName] = useState('')
  const [routeDescription, setRouteDescription] = useState('')
  const [routeGeoData, setRouteGeoData] = useState([])
  const [modalStatus, setModalStatus] = useState(false);  
  const [clientRoutes, setClientRoutes] = useState([]);
  
  const [newRouteId, setNewRouteId] = useState('0')

  const [selectedRoute, setSelectedRoute] = useState(getStorage('currentMap') ?? [])

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
    
    if (map.current) return;

    map.current = new MapboxGL.Map({
      container: mapContainer.current,
      containerStyle: {
        position:'absolute',
        top: 0,
        bottom: 0,
        width:'100%',
        minHeight: '1000px'
      },
      style: mapTile,
      center: [ lng, lat ],
      zoom: zoom
    });

    map.current.on('load', function () {      

      map.current.addControl(Draw, 'top-left');
      map.current.resize()      

      map.current.addControl(new MapboxGLGeocoder({
        accessToken: MapboxGL.accessToken,
        marker: false
      }));      

      map.current.on('move', () => {
        setMapLat(map.current.getCenter().lat);
        setMapLng(map.current.getCenter().lng);        
        setMapZoom(Math.round(map.current.getZoom()));
        setStorage('currentMapOptions',{
          lat: map.current.getCenter().lat,
          lng: map.current.getCenter().lng,
          zoom: map.current.getZoom()
        })
      });

      map.current.on('draw.create', createDrawArea);
      map.current.on('draw.update', updateDrawArea);
      map.current.on('draw.delete', deleteDrawArea);
      map.current.addControl(new MapboxLanguage());
      //map.current.addControl(new MapboxGL.FullscreenControl());
      //map.current.addControl(new MapboxGL.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }));

      // Draw temporary stored map!!
      if(getStorage('currentMap')){
        Draw.add(getStorage('currentMap'));
      }

    });

    const createDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }
    const updateDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }    
    const deleteDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }   

  }

  function setStoredMap(e, data){
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
    if(!routeGeoData.features) return false
    // Analizing the data to save :)
    if(routeGeoData.features.length > 0){

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

    }else if(!launchToast("You haven't created a route. Please, print at least a Route!")){

    }else{
      setModalStatus(true);
    }

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
    </Modal>
  }

  function saveRoute(){      

    console.log('Saving the GeoJSON map data!!!')
    console.log('Route name: '+routeName)
    console.log('Route description: '+routeDescription)
    console.log(routeGeoData)

    subtitle2.style.color = 'green';
    launchToast("Everything is ok. We gonna save the route. Please wait...")

    return processSave()

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

  }

  function setNewPostPlace(key, placeFeatures, markerType=3, i){

    let setNewPostPlaceData = {
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
    
    postData(host+'/my-places', setNewPostPlaceData )
    .then(data => {
      console.log('Place '+key+' posted successful ;)')
    });

  }

  function setNewPostPolygon(key, polygonFeatures, i){

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

  function processSave(){
    postRoute()
    /*if(newRouteId){
      for(var i=0; i < routeGeoData.features.length; i++){
        if(routeGeoData.features[i].geometry.type === 'Point'){
          setNewPostPlace(routeGeoData.features[i].id, routeGeoData, i)
        }else if(routeGeoData.features[i].geometry.type === 'Polygon'){
          setNewPostPolygon(routeGeoData.features[i].id, routeGeoData, i)
        }
      }
    }*/
    let endData = []
    setStorage('currentMap', endData)
    setRouteGeoData(endData)
    loadMap()
    closeModal()
    return true;
  }

  const [clientPlaces, setClientPlaces] = useState([]);
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
    console.log(selectedRoute)
  }

  function renderRoutesSelector(routes){
    var options = [{ value: '0', label: messages.chooseRoute }]
    for(var i = 0; i < routes.length; i++){
      options.push({ value: routes[i].id.toString(), label: routes[i].name })
    }
    return <Select
      name="route"
      value={selectedRoute}
      options={options}
      closeMenuOnSelect={true}
      onChange={e=>{setSelectedRoute(e.value)}}
    />
  }

  return (
    <>
      <div className="row">
        <div className="col-lg-8 col-md-12">
            <div>
              <div>
                {/*<div className="sidebar">Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom: {Math.round(zoom)}</div>*/}
                {/*renderRoutesSelector(clientRoutes)*/}
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