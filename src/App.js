import React, { memo, useRef, useEffect, useState } from 'react';
import { Select } from '@buffetjs/core';
import Modal from 'react-modal';
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder';
import RouteSelector from './RouteSelector.js'

import MapboxGL from 'mapbox-gl';

// BuffetJS
import { Button, InputText, Textarea, Label } from '@buffetjs/core';
import { LoadingBar  } from '@buffetjs/styles';

// Fontawsome...
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { setStorage, getStorage, getRouteType, Draw, customStyles, putData, deleteData, messages, removeStorage, checkFeaturesAmount, postData } from './map-utils.js';

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
const publishEnabled = false
const defaultCenter = {
  lat: 39.79, lng: 2.68, zoom: 3
}

const HomePage = () => {
  
  const [userId, setUserId] = useState(4)

  // Map Settings
  const map = useRef(null);
  const mapContainer = useRef(null);
  
  // Client routes for the select button
  const [clientRoutes, setClientRoutes] = useState([]);

  // Current Map
  const [currentRouteMode, setCurrentRouteMode] = useState(getStorage('currentRouteMode', 'string') ?? 'creation')
  const currentMapOpts = getStorage('currentRouteOptions') ?? defaultCenter;
  const [focusLat,  setMapLat]  = useState(currentMapOpts.lat);
  const [focusLng,  setMapLng]  = useState(currentMapOpts.lng);
  const [focusZoom, setMapZoom] = useState(currentMapOpts.zoom);

  setStorage('currentRouteMode', currentRouteMode, 'string')

  const [featureRelations, setFeatureRelations] = useState([])



  // Related with routes...
  const [currentRoute, setCurrentRoute] = useState(getStorage('currentRoute') ?? { features: {} })
  const [currentRouteId, setCurrentRouteId] = useState(getStorage('currentRouteId', 'string') ?? 0)

  // NEW Route data
  const [modalStatus, setModalStatus] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState(getStorage('currentRouteName', 'string') ?? '')
  const [routeDescription, setRouteDescription] = useState(getStorage('routeDescription', 'string') ?? 'Set here the english description')//XXX: MUST be english, the main lang at least for auto ;)  
  
  const [saveButtonStatus, setSaveButtonStatus] = useState(getStorage('disabledMainSaveButton', 'string') ??  true)
  const [saveButtonStyle, setSaveButtonStyle] = useState(getStorage('setSaveButtonStyle', 'string') ?? 'primary')

  // Publish button parameters
  const [publishButtonLabel, setPublishButtonLabel] = useState(getStorage('setPublishButtonLabel', 'string') ?? 'Publish')
  const [publishButtonDisabled, setPublishButtonDisabled] = useState(getStorage('setPublishButtonDisabled', 'string') ?? true)
  const [publishButtonColor, setPublishButtonColor] = useState(getStorage('setPublishButtonColor', 'string') ?? 'primary')

  const [routeChangesAdvisory, setRouteChangesAdvisory] = useState(false)

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

  function loadMap(clean=false){
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

    const updateDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }

  }

  function mapOnLoad(){
      map.current.resize()
  }

  function resetMap(){
    removeStorage('currentRoute')
    Draw.deleteAll()
  }

  function mainSaveButtonStatus(status){
    //setStorage('disabledMainSaveButton', status, 'string')
    //setSaveButtonStatus(status)
  }
    
  function setStoredMap(event, data){    

    setStorage('currentRoute', data)
    setCurrentRoute(data)

    defineSaveButtonStatus()

    switch(currentRouteMode){

      case 'creation':
        if(currentRouteName !== ''){
          //mainSaveButtonStatus(true)
        }
        //console.log('Creation mode map action!')
        //console.log('Under this mode ther`s nothinga actively being saved ;)!')

        break;

      default:
      case 'edition':

        console.log('Edition mode map action!')

        if(event.action !== undefined){

          switch(event.action){
            case 'change_coordinates':
            case 'move':
              updateExistingMapElement(event)
              break;

            default:
              console.log('Uncontrolled action :// !!!'+event.action)
              break;
          }

        }else{
          
          console.log('Event Action is undefined!!')

          if(event.features[0].geometry.type === 'LineString'){
            let storedLinesAmount = checkFeaturesAmount(currentRoute, 'LineString');
            if(storedLinesAmount > 1){
              alert('You cannot add more than one route. Edit the existent one!!')
              return false;
            }

          }

          switch(event.type){

            case 'draw.create':
              createNewMapElement(event)
            break;

            case 'draw.update':
              if(isNaN(event.features[0].id)){
                // TODO: Si no está identificado o si lo está cambia!!
                console.log(event.type)
              }else{
                updateExistingMapElement(event)
              }
            break;

            case 'draw.delete':
              if(isNaN(event.features[0].id)){
                // TODO: Si no está identificado o si lo está cambia!!
                console.log(event.type)
              }else{
                deleteExistingMapElement(event)
              }
            break;

            default:
              console.log(event.type)

          }

        }

    }

    defineSaveButtonStatus()

  }

  function featureRelation(id, key){
    setStorage(key, id)
    featureRelations.push({ key: key, id: id })
    setFeatureRelations(featureRelations)
  }

  function createNewMapElement(event){
    console.log('Now we create a new element for this route...')
    switch(event.features[0].geometry.type){
      case 'Polygon':
        postData(polygonsOrigin, {
          "creator": userId,
          "parent_route" : currentRouteId,
          "map_data": {
            "center_lat": focusLat,
            "center_long": focusLng,
            "center_zoom": focusZoom,
            "data": event.features[0]
          }
        })
        .then(data => {
          featureRelation('polygon::'+data.id, data.map_data.data.id)
          data.map_data.data.id = data.id
          putData(polygonsOrigin+'/'+data.id, data);
        });
        break;

      default:
        postData(placesOrigin, {
          "name": currentRouteName+' Place '+currentRouteId+' (added)',
          "creator": userId,
          "parent_route" : currentRouteId,
          "description": [
            {
              "language": 1,
              "label": currentRouteName+' Place Added',
              "description": routeDescription
            }
          ],
          "map_data": {
            "center_lat": focusLat,
            "center_long": focusLng,
            "center_zoom": focusZoom,
            "data": event.features[0]
          }
        })
        .then(data => {
          featureRelation('place::'+data.id, data.map_data.data.id)
          data.map_data.data.id = data.id
          putData(placesOrigin+'/'+data.id, data);
        });
        break;
    }
  }

  function deleteExistingMapElement(event){
    deleteData()
  }

  function updateExistingMapElement(event, equivalence=null){

    if(isNaN(event.features[0].id)){

      console.log('Must get the temporary id equivalences ;)')
      console.log(event.features[0].id)

    }else{

      console.log('I will post the GeoJson changes ;)')

      let data = {
        "map_data" : {
          "center_lat": focusLat,
          "center_long": focusLng,
          "center_zoom": focusZoom,
          "data" : event.features[0]
        }
      }

      var root = placesOrigin;
      switch(event.features[0].geometry.type){
        case 'LineString' : root = routesOrigin; break;
        case 'Polygon' : root = polygonsOrigin; break;
        default: break;
      }

      let url = root+'/'+event.features[0].id

      putData(url, data)

    }

  }

  function launchToast(message, doContinue=false){
    alert(message);
    return doContinue
  }

  // Modal control
  function validateSaving() {

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
            //if(!launchToast('You canceled to save this Route')) 
            return false
          }
        }else if(storedPointsAmount > placesLimit ){
          if(!launchToast('You have passed the amount limit of Places on your route. Please, the limit are '+placesLimit)) return false
        }

    }else{ 
      return launchToast("You haven't created a route. Please, print at least a Route!")
    }

    saveRoute()

  }
  
  function defineSaveButtonStatus(){
    console.log([currentRouteName, currentRoute.features.length])
    if(currentRouteName !== '' && currentRoute.features.length > 2 ){      
      console.log('Enable de button!!')
      //mainSaveButtonStatus(true)
    }else{
      console.log('Disable the button!!')
      //mainSaveButtonStatus(false)
    }
    //mainSaveButtonStatus(false)
  }

  function storeRouteName(name){
    setCurrentRouteName(name)
    setStorage('currentRouteName', name, 'string')
    defineSaveButtonStatus()
  }

  function storeRouteDescription(name){
    setCurrentRouteName(name)
    setStorage('currentRouteDescription', name, 'string')
    //defineSaveButtonStatus()
  }

  function viewRouteData(){
    console.log('Saving the GeoJSON map data!!!')
    console.log('Route name: '+currentRouteName)
    console.log('Route description: '+routeDescription)
    console.log(currentRoute)
  }

  function saveRoute(){
    viewRouteData()
    //launchToast("Everything is ok. We gonna save the route. Please wait...")
    return processRouteSave()
  }

  function processRouteSave(){

    switch(currentRouteMode){
      case 'edition':
        alert('Please, wait the updating feature!! ^__^!')
        break;
      default:
      case 'creation':
        setNewPostRoute()   
        break;
    }

    return true;
  }

  function setNewPostRoute(){
    var form = {
      "name": currentRouteName,
      "creator": userId,
      "description": [
        {
          "language": 1,
          "label": currentRouteName,
          "description": routeDescription
        }
      ],
      "map_data" : {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data" : getRouteType(currentRoute, 'LineString')
      }
    } 
    postData(host+'/routes', form )
    .then(data => {

      data.map_data.data.id = data.id
      data.published_at = null
      putData(host+'/routes/'+data.id, data);

      if(data.id !== '0'){
        for(var i=0; i < currentRoute.features.length; i++){
          if(currentRoute.features[i].geometry.type === 'Point'){
            setNewPostPlace(data.id, currentRoute.features[i].id, currentRoute.features[i], i)
          }else if(currentRoute.features[i].geometry.type === 'Polygon'){
            setNewPostPolygon(data.id, currentRoute.features[i].id, currentRoute.features[i], i)
          }
        }
      }

      //setSaveButtonStyle('success')
      console.log('Route '+data.id+' was posted successful ;)')

    });
  }

  function setNewPostPlace(routeId, key, placeFeatures, i){    
    postData(host+'/my-places', {
      "name": currentRouteName+' Place '+routeId+'-'+i.toString(),
      "creator": userId,
      "parent_route" : routeId,
      "description": [
        {
          "language": 1,
          "label": currentRouteName+' Place '+i.toString(),
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
      data.map_data.data.id = data.id
      putData(host+'/my-places/'+data.id, data);
      console.log('Place '+key+' posted successful ;)')
    });
  }

  function setNewPostPolygon(routeId, key, polygonFeatures, i){
    postData(host+'/polygons', {
      "name": currentRouteName+' Warning '+routeId+'-'+i.toString(),
      "creator": userId,
      "parent_route" : routeId,      "map_data": {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data": polygonFeatures
      },
    } )
    .then(data => {
      data.map_data.data.id = data.id
      putData(host+'/polygons/'+data.id, data);
      console.log('Polygon '+key+' posted successful ;)')
    });
  }

  function setRoute(route_id){

    resetMap()
    mapOnLoad()

    fetch(routesOrigin+'/'+route_id)
      .then((res) => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {

        setCurrentRouteId(route_id);
        setStorage('currentRouteId', route_id, 'string')        

        if(!response){

          console.log('CREATION MODE!')
          setCurrentRouteMode('creation')
          setStorage('currentRouteMode', 'creation', 'string')
          //setSaveButtonStatus(false)

          setCurrentRouteName('')
          storeRouteName('')

        }else{

          setCurrentRouteName(response.name)
          storeRouteName(response.name)
          console.log('EDITION MODE!')
          setCurrentRouteMode('edition')
          setStorage('currentRouteMode', 'edition', 'string')

          let selected = {
            type: 'FeatureCollection', features: []
          }

          response.map_data.data.id = response.id
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
    return (options.length > 1 ) ? <Select
      name="route"
      value={currentRouteId}
      options={options}
      closeMenuOnSelect={true}
      onChange={({ target: { value } }) => { setRoute(value) }}
    /> :(<h4>Add your first route! ;)</h4>)
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
                <div className="nav-bar">Longitude: {focusLng.toFixed(4)} • Latitude: {focusLat.toFixed(4)} • Zoom: {Math.round(focusZoom)}</div>
              </div>
            </div>
        </div>
        <div className="col-md-4 col-lg-4">
          <br/>
          <div className='row'>
            <div className='col-6'>
            <Button
                label={publishButtonLabel}            
                color={publishButtonColor}
                disabled={publishButtonDisabled}
                onClick={ (e) => {console.log('Clicked Publish!! ^^')}}
              />
            </div>
            <div className='col-6'>
              <Button
                label="Save"
                color={saveButtonStyle}
                disabled={!saveButtonStatus}
                onClick={validateSaving}
              />
            </div>
          </div> 
          <br/>
          <div className='row'>
            {renderRoutesSelector(clientRoutes)}
           {/*} <RouteSelector onChange={()=>console.log('maybe')}/>*/}
          </div>
          <br/>
          <div className='row'>
            <Label htmlFor="route-name">Route name</Label>
            <InputText
              type='text'
              name='route-name'
              value={currentRouteName} 
              placeholder='Set the route name...'
              required='true'
              onChange={({ target: { value } }) =>{storeRouteName(value)}}
            />
          </div>
          <br/>
          <div className='row'>
            <Label htmlFor="route-description">Route description</Label>
            <Textarea
              name="route-description"
              onChange={({ target: { value } }) =>{storeRouteDescription(value)}}
              value={routeDescription}
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