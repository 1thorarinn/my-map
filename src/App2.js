import React, { memo, useRef, useEffect, useState } from 'react';
import { Select } from '@buffetjs/core';
import Modal from 'react-modal';
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder';

import MapboxGL from 'mapbox-gl';

import { setStorage, getStorage, getRouteType, Draw, customStyles, messages, removeStorage, checkFeaturesAmount, postData } from './map-utils.js';

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

// Map vars
const placesLimit = 6;
const routesLimit = 10;
const defaultCenter = {
  lat: 39.79, lng: 2.68, zoom: 3
}

const HomePage = () => {
  
  var subtitle, subtitle2;

  const [userId, setUserId] = useState(12)

  // Map Settings
  const map = useRef(null);
  const mapContainer = useRef(null);
  const currentMapOpts = getStorage('currentMapOptions') ?? defaultCenter;

  const [focusLat,  setMapLat]  = useState(currentMapOpts.lat);
  const [focusLng,  setMapLng]  = useState(currentMapOpts.lng);
  const [focusZoom, setMapZoom] = useState(currentMapOpts.zoom);

  // Loading all the CMS client routes....
  const [clientRoutes, setClientRoutes] = useState([]);
  const [mapMode, setMapMode] = useState('creation')

  const [newRouteId, setNewRouteId] = useState(0)
  const [currentRoute, setCurrentRoute] = useState([]);
  const [routeGeoData, setRouteGeoData] = useState(getStorage('currentMap') ?? {features:{}})

  const [currentMap, setSelectedRoute] = useState(getStorage('currentMap') ?? [])

    // NEW Route settings
  const [routeName, setRouteName] = useState('')
  const [routeDescription, setRouteDescription] = useState('')

  const [modalStatus, setModalStatus] = useState(false);  
  //const [sessionTimestamp, setSessionTimestamp] = useState(Date.now())

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

      map.current.on('move', () => { memoMapData() });

      map.current.on('draw.add', createDrawArea);
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

    const createDrawArea = (e) => { setStoredMap(e.type, Draw.getAll()) }
    const updateDrawArea = (e) => { setStoredMap(e.type, Draw.getAll()) }    
    const deleteDrawArea = (e) => { setStoredMap(e.type, Draw.getAll()) }   

  }
  
  function setStoredMap(type, data){
    console.log('storedMap::'+mapMode)
    if(mapMode === 'creation'){
      setStorage('currentMap', data)
      setRouteGeoData(data)
    }else if(mapMode === 'edition'){




      console.log(type, data)





    }
  }

  function resetMap(){
    removeStorage('currentMap')
    Draw.deleteAll()
  }

  function launchToast(message, doContinue=false){
    alert(message);
    closeModal()
    return doContinue
  }

  // Modal control
  function openModal() {

    if(routeGeoData === []) return false

    // Analizing the data to save :)
    if(routeGeoData.features.length > 0){

      // 1.- Only a Linestring is allowed!! Not two      

        let storedLinesAmount = checkFeaturesAmount(routeGeoData, 'LineString');
        if(storedLinesAmount > 1 ){
          if(!launchToast('You are unable to draw two lines for a route. \n\n You must delete '+(storedLinesAmount-1)+' lines\n')) return false
        }else if(storedLinesAmount === 0){
          if(!launchToast('You must draw one route, at least')) return false
        }          

      // 2.- Now you will set the first location (meeting-point)

        let storedPointsAmount = checkFeaturesAmount(routeGeoData, 'Point');
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

    console.log('Opening Modal To Save ^^')
    setModalStatus(true);

  }

  function closeModal(){
    setModalStatus(false);
  }

  function afterOpenModal() {
    subtitle.style.color = '#000';
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

  function viewRouteData(){
    console.log('Saving the GeoJSON map data!!!')
    console.log('Route name: '+routeName)
    console.log('Route description: '+routeDescription)
    console.log(routeGeoData)
  }

  function saveRoute(){
    viewRouteData()
    subtitle2.style.color = 'green';
    //launchToast("Everything is ok. We gonna save the route. Please wait...")
    return processSave()
  }

  function processSave(){
    if(mapMode === 'creation'){
      setNewPostRoute()   
      closeModal()
    }else if(mapMode === 'edition'){ 
      alert('Please, wait the updating feature!! ^__^!')
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
        "data" : getRouteType(routeGeoData, 'LineString')
      }
    } )
    .then(data => {
      console.log('Route '+data.id+' was posted successful ;)')
      if(data.id !== '0'){
        for(var i=0; i < routeGeoData.features.length; i++){

          if(routeGeoData.features[i].geometry.type === 'Point'){
            setNewPostPlace(data.id, routeGeoData.features[i].id, routeGeoData.features[i],3, i)

          }else if(routeGeoData.features[i].geometry.type === 'Polygon'){
            setNewPostPolygon(data.id, routeGeoData.features[i].id, routeGeoData.features[i], i)

          }
        }
      }
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

  function setRoute(value){

    resetMap()

    fetch(routesOrigin+'/'+value)
      .then((res) => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {

        setSelectedRoute(value);

        if(!response){

          console.log('CREATION MODE!')
          setMapMode('creation')

        }else{

          console.log('EDITION MODE!')
          setMapMode('edition')

          let selected = {
            type: 'FeatureCollection', features: []
          }

          response.map_data.id = response.id
          Draw.add(response.map_data.data)
          selected.features.push(response.map_data.data)

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
              selected.features.push({data})
            }
          }

          setStorage('currentMap', selected)

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
    var options = [{ value: '0', label: messages.chooseRoute }]
    for(var i = 0; i < clientRoutes.length; i++){
      options.push({ value: clientRoutes[i].id.toString(), label: routes[i].name })
    }
    return <Select
      name="route"
      value={currentMap}
      options={options}
      closeMenuOnSelect={true}
      onChange={({ target: { value } }) => {
        setRoute(value)
      }}
    />
  }

  function memoMapData(){
    setMapLat(map.current.getCenter().lat);
    setMapLng(map.current.getCenter().lng);        
    setMapZoom(Math.round(map.current.getZoom()));
    setStorage('currentMapOptions',{
      lat: map.current.getCenter().lat,
      lng: map.current.getCenter().lng,
      zoom: Math.round(map.current.getZoom())
    })
  }

  return (
    <>
      <div className="row">
        <div className="col-lg-8 col-md-12">
            <div>
              <div>
                {/*<div className="sidebar">Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom: {Math.round(zoom)}</div>*/}
                {renderRoutesSelector(clientRoutes)}
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
          {/*<button onClick={viewStored('currentMapData')}>[View storage]</button>*/}          
        </div>
      </div>
    </>
  );

};

export default memo(HomePage)