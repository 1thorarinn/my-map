import React, { memo, useRef, useEffect, useState } from 'react';
import { Select } from '@buffetjs/core';
import Modal from 'react-modal';
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder';
import RouteSelector from './RouteSelector.js'

import MapboxGL from 'mapbox-gl';

// BuffetJS
import { Button, InputText } from '@buffetjs/core';
import { LoadingBar  } from '@buffetjs/styles';

// Fontawsome...
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { setStorage, getStorage, getRouteType, Draw, customStyles, messages, removeStorage, checkFeaturesAmount, postData } from './map-utils.js';

import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'

const host ='http://161.97.167.92:1337';
MapboxGL.accessToken = "pk.eyJ1IjoiZHJ1bGxhbiIsImEiOiJja2l4eDBpNWUxOTJtMnRuejE1YWYyYThzIn0.y7nuRLnfl72qFp2Rq06Wlg"
const MapboxLanguage = require('@mapbox/mapbox-gl-language');

const routesOrigin = host+'/routes'
const polygonsOrigin = host+'/polygons'
const placesOrigin = host+'/my-places'

const mapTile = 'mapbox://styles/mapbox/streets-v11'

// Map vars
const placesLimit = 6;
const routesLimit = 10;
const defaultCenter = {
  lat: 39.79, lng: 2.68, zoom: 3
}

const HomePage = () => {
  
  const [userId, setUserId] = useState(12)

  // Map Settings
  const map = useRef(null);
  const mapContainer = useRef(null);
  
  // Client routes for the select button
  const [clientRoutes, setClientRoutes] = useState([]);

  // Current Map
  const [mapMode, setMapMode] = useState(getStorage('mapMode', 'string') ?? 'creation')
  const currentMapOpts = getStorage('currentRouteOptions') ?? defaultCenter;
  const [focusLat,  setMapLat]  = useState(currentMapOpts.lat);
  const [focusLng,  setMapLng]  = useState(currentMapOpts.lng);
  const [focusZoom, setMapZoom] = useState(currentMapOpts.zoom);


  // Related with routes...
  const [currentRoute, setCurrentRoute] = useState(getStorage('currentRoute') ?? { features: {} })
  const [currentRouteId, setCurrentRouteId] = useState(getStorage('currentRouteId') ?? 0)

  // NEW Route data
  const [modalStatus, setModalStatus] = useState(false);
  const [routeName, setRouteName] = useState(getStorage('routeName', 'string') ?? '')
  const [routeDescription, setRouteDescription] = useState(getStorage('routeDescription', 'string') ?? '')
  const [saveButtonDisabled, setSaveButtonDisabled] = useState(getStorage('disabledMainSaveButton', 'string') === 'false' ? false : true)
  const [saveButtonSuccess, setSaveButtonSuccess] = useState(getStorage('saveButtonSuccess', 'string') ?? 'primary')

  if (typeof(window) !== 'undefined') {
    Modal.setAppElement('body')
  }

  useEffect(() => { 
    fetch(routesOrigin+'?created_by='+userId)
    .then((res) => res.json())
    .then(setClientRoutes); 
  },[userId]);

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
      center: [ focusLng, focusLat ],
      zoom: focusZoom,
      minZoom: 4,
      maxZoom: 18
    });

    map.current.on('load', function () {      

      map.current.resize()
      map.current.addControl(Draw, 'top-left');

      map.current.addControl(new MapboxGLGeocoder({
        accessToken: MapboxGL.accessToken,
        marker: false
      }));      

      map.current.on('move', () => { setMapOptions() });

      map.current.on('draw.add', updateDrawArea);
      map.current.on('draw.create', updateDrawArea);
      map.current.on('draw.update', updateDrawArea);
      map.current.on('draw.delete', updateDrawArea);
      map.current.addControl(new MapboxLanguage());
      //map.current.addControl(new MapboxGL.FullscreenControl());
      //map.current.addControl(new MapboxGL.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }));

      // Draw temporary stored map!!
      if(getStorage('currentRoute')){
        Draw.add(getStorage('currentRoute'));
      }

    });

    //const addDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }
    //const createDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }
    const updateDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }    
    //const deleteDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }   

  }

  function resetMap(){
    removeStorage('currentRoute')
    Draw.deleteAll()
  }

  function mainSaveButtonStatus(status){
    setStorage('disabledMainSaveButton', status, 'string')
    setSaveButtonDisabled(status)
  }
    
  function setStoredMap(type, data){

    mainSaveButtonStatus(false)
    setStorage('currentRoute', data)
    setCurrentRoute(data)
    console.log(type, [data,mapMode])
    switch(mapMode){
      case 'creation':


        break;
      default:
      case 'edition':

        break;
    }

  }
  
  function launchToast(message, doContinue=false){
    alert(message);
    return doContinue
  }

  // Modal control
  function validateSaving() {

    console.log(currentRoute)

    if(currentRoute === []) return false

    // Analizing the data to save :)
    if(currentRoute.features.length > 0){

      // 1.- Only a Linestring is allowed!! Not two      

        let storedLinesAmount = checkFeaturesAmount(currentRoute, 'LineString');
        if(storedLinesAmount > 1 ){
          if(!launchToast('You are unable to draw two lines for a route. \n\n You must delete '+(storedLinesAmount-1)+' lines\n')) return false
        }else if(storedLinesAmount === 0){
          if(!launchToast('You must draw one route, at least')) return false
        }          

      // 2.- Now you will set the first location (meeting-point)

        let storedPointsAmount = checkFeaturesAmount(currentRoute, 'Point');
        if(storedPointsAmount < 1 ){
          if (!window.confirm("You don't have addressed any Place to your route. \nWe encourage you to put, at least, one Place Marker ;)\n\n Do you really want to save?\n\n")) {
            if(!launchToast('You canceled to save this Route')) return false
          }
        }else if(storedPointsAmount > placesLimit ){
          if(!launchToast('You have passed the amount limit of Places on your route. Please, the limit are '+placesLimit)) return false
        }

    }else{ 
      return launchToast("You haven't created a route. Please, print at least a Route!")
    }

    saveRoute()

  }

  function storeRouteName(name){
    setRouteName(name)
    setStorage('routeName', name, 'string')
    setSaveButtonSuccess('primary')
    mainSaveButtonStatus(false)
  }

  function viewRouteData(){
    console.log('Saving the GeoJSON map data!!!')
    console.log('Route name: '+routeName)
    console.log('Route description: '+routeDescription)
    console.log(currentRoute)
  }

  function saveRoute(){
    viewRouteData()
    //launchToast("Everything is ok. We gonna save the route. Please wait...")
    return processRouteSave()
  }

  function processRouteSave(){

    switch(mapMode){
      case 'creation':
        setNewPostRoute()   
        break;
      default:
      case 'edition':
        alert('Please, wait the updating feature!! ^__^!')
        break;
    }

    return true;
  }

  function setNewPostRoute(){
    postData(host+'/routes', {
      "name": routeName,
      "creator": userId,
      "description": [
        {
          "language": 1,
          "label": routeName,
          "description": routeDescription
        }
      ],
      "map_data" : {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data" : getRouteType(currentRoute, 'LineString')
      }
    } )
    .then(data => {

      if(data.id !== '0'){

        for(var i=0; i < currentRoute.features.length; i++){

          if(currentRoute.features[i].geometry.type === 'Point'){
            setNewPostPlace(data.id, currentRoute.features[i].id, currentRoute.features[i],3, i)

          }else if(currentRoute.features[i].geometry.type === 'Polygon'){
            setNewPostPolygon(data.id, currentRoute.features[i].id, currentRoute.features[i], i)

          }
        }

      }

      setSaveButtonSuccess('success')
      console.log('Route '+data.id+' was posted successful ;)')

    });
  }

  function setNewPostPlace(routeId, key, placeFeatures, markerType=3, i){    
    postData(host+'/my-places', {
      "name": routeName+' Place '+routeId+'-'+i,
      "creator": userId,
      "parent_route" : routeId,
      "description": [
        {
          "language": 1,
          "label": routeName+' Place '+i,
          "description": routeDescription
        }
      ],
      "map_data": {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data": placeFeatures
      }
    } )
    .then(data => {
      console.log('Place '+key+' posted successful ;)')
    });
  }

  function setNewPostPolygon(routeId, key, polygonFeatures, i){
    postData(host+'/polygons', {
      "name": routeName+' Warning '+routeId+'-'+i,
      "creator": userId,
      "parent_route" : routeId,
      "map_data": {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data": polygonFeatures
      },
    } )
    .then(data => {
      console.log('Polygon '+key+' posted successful ;)')
    });
  }

  function updateEditRoute(id, data){

  }

  function updateEditPolyline(id, data){
    
  }

  function updateEditPolygon(id, data){
    
  }

  function setRoute(route_id){

    resetMap()

    fetch(routesOrigin+'/'+route_id)
      .then((res) => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {

        setCurrentRouteId(route_id);
        setStorage('currentRouteId', route_id)        

        if(!response){

          console.log('CREATION MODE!')
          setMapMode('creation')
          setStorage('mapMode', 'creation', 'string')

          setRouteName('')

        }else{

          setRouteName(response.name)

          console.log('EDITION MODE!')
          setMapMode('edition')
          setStorage('mapMode', 'edition', 'string')

          let selected = {
            type: 'FeatureCollection', features: []
          }

          response.map_data.data.id = response.id
          Draw.add(response.map_data.data)
          selected.features.push(response.map_data.data)

          console.log(response)

          if(response.places !== undefined){
            for(var i = 0; i < response.places.length; i++){
              let data = response.places[i].map_data.data
              data.id = response.places[i].id
              Draw.add(data)
              selected.features.push(data)
            }
          }

          if(response.polygons !== undefined){
            for(var z = 0; z < response.polygons.length; z++){
              let data = response.polygons[z].map_data.data
              data.id = response.polygons[z].id
              Draw.add(data)
              selected.features.push(data)
            }
          }

          setStorage('currentRoute', selected)

          map.current.flyTo({
            center:[
              response.map_data.center_long,
              response.map_data.center_lat
            ],
            zoom: response.map_data.center_zoom
          });

        }
          
        //loadMap()
        
      });

  }

  function renderRoutesSelector(routes){
    var options = [{ value: '0', color: 'grey', label: messages.chooseRoute }]
    for(var i = 0; i < clientRoutes.length; i++){
      options.push({ value: clientRoutes[i].id.toString(), label: routes[i].name })
    }
    return <Select
      name="route"
      value={currentRouteId}
      options={options}
      closeMenuOnSelect={true}
      onChange={({ target: { value } }) => { setRoute(value) }}
    />
  }

  function setMapOptions(){
    setMapLat(map.current.getCenter().lat);
    setMapLng(map.current.getCenter().lng);        
    setMapZoom(Math.round(map.current.getZoom()));
    setStorage('currentRouteOptions',{
      lat: map.current.getCenter().lat,
      lng: map.current.getCenter().lng,
      zoom: Math.round(map.current.getZoom())
    })
  }

  return (
    <>
      <div className="row">
        <div className="col-lg-8 col-md-8">
            <div>
              <div>
                <div ref={mapContainer} className="map-container" />
                <div className="nav-bar">Longitude: {focusLng.toFixed(4)} | Latitude: {focusLat.toFixed(4)} | Zoom: {Math.round(focusZoom)}</div>
              </div>
            </div>
        </div>
        <div className="col-md-4 col-lg-4">
          <br/>
          <div className='row'>
            <div className='col-6'>
            </div>
            <div className='col-6'>
              <Button color={saveButtonSuccess} disabled={saveButtonDisabled} onClick={validateSaving} icon={<FontAwesomeIcon icon={faPlus} />} label="Save" />
            </div>
          </div> 
          <br/>
          <div class='row'>
            {renderRoutesSelector(clientRoutes)}
            <RouteSelector/>
          </div>
          <br/>
          <div className='row'>
            <label>Route name</label>
          </div>
          <div className='row'>
            <InputText
              type='text'
              name='route-name'
              value={routeName} 
              placeholder='Set the route name...'
              onChange={({ target: { value } }) =>{storeRouteName(value)}}
            />
          </div>
          {/*getSaveRouteModal()*/}                 
          {/*<button onClick={viewStored('currentRouteData')}>[View storage]</button>*/}          
        </div>
      </div>
    </>
  );

};

export default memo(HomePage)