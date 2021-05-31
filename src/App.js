import React, { memo, useRef, useEffect, useState } from 'react';
import { Select, Button, InputText, Textarea, Label } from '@buffetjs/core';
//import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Modal from 'react-modal';
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder';
//import RouteSelector from './RouteSelector.js'

import MapboxGL from 'mapbox-gl';

// BuffetJS
//import { LoadingBar  } from '@buffetjs/styles';

// Fontawsome...
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { setStorage, getStorage, getRouteType, getData, Draw, customStyles, putData, deleteData, messages, removeStorage, checkFeaturesAmount, postData, makeId } from './map-utils.js';

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
const userId = 12;
//const routesLimit = 10;
//const publishEnabled = false
const createText = 'Create...'
const defaultCenter = { lat: 39.79, lng: 2.68, zoom: 3 }
const defSelected = { type: 'FeatureCollection', features: [] }

const HomePage = () => {
  
  //const [userId, setUserId] = useState(4)

  // Map Settings
  const map = useRef(null);
  const mapContainer = useRef(null);
  
  // Client routes for the select button
  const [clientRoutes, setClientRoutes] = useState([]);

  //  Map
  const MapOpts = getStorage('routeOptions') ?? defaultCenter
  const [routeMode, setRouteMode] = useState(getStorage('routeMode', 'string'))

  // Map coords
  const [focusLat,  setMapLat]  = useState(MapOpts.lat)
  const [focusLng,  setMapLng]  = useState(MapOpts.lng)
  const [focusZoom, setMapZoom] = useState(MapOpts.zoom)

  // Related with routes...
  const [Route, setRoute] = useState(getStorage('currentRoute', 'json') ?? '')  
  
  //  Route data
  const [routeId, setRouteId] = useState(getStorage('routeId', 'string'))
  const [routeIsPublished, setRouteIsPublished] = useState(getStorage('routeIsPublished', 'string') ?? false)
  const [routeName, setrouteName] = useState(getStorage('routeName', 'string',''))
  const [routeLabel, setrouteLabel] = useState(getStorage('routeLabel', 'string'),'')
  const [routeDescription, setRouteDescription] = useState(getStorage('routeDescription', 'string') ?? '')

  //  Publish button parameters
  const [publishButtonLabel, setPublishButtonLabel] = useState(getStorage('publishButtonLabel', 'string') ?? createText)
  const [publishButtonStatus, setPublishButtonStatus] = useState(getStorage('publishButtonStatus', 'string') ?? false)
  const [publishButtonColor, setPublishButtonColor] = useState(getStorage('publishButtonColor', 'string') ?? 'primary')

  // New Place data
  const [modalStatus, setModalStatus] = useState(false);
  const [PlaceName, setPlaceName] = useState('')
  const [PlaceLabel, setPlaceLabel] = useState('')
  const [PlaceDescription, setPlaceDescription] = useState('')


  const [routeChangesAdvisory, setRouteChangesAdvisory] = useState(getStorage('routeChangesAdvisory', 'string') ?? false)
  const [routeCreationAdvisory, setRouteCreationAdvisory] = useState(getStorage('routeCreationAdvisory', 'string', ''))

  if (typeof(window) !== 'undefined') {
    Modal.setAppElement('body')
  }

  useEffect(() => { 
    fetch(routesOrigin+'?created_by='+userId)
    .then((res) => res.json())
    .then(setClientRoutes); 
  },[]);

  useEffect(() => {
    loadMap()
  },[]);

  function setMapOptions(){

    setMapLat(map.current.getCenter().lat);
    setMapLng(map.current.getCenter().lng);        
    setMapZoom(Math.round(map.current.getZoom()));

    setStorage('routeOptions',{
      lat: map.current.getCenter().lat,
      lng: map.current.getCenter().lng,
      zoom: Math.round(map.current.getZoom())
    })
    let decideToChange = routeId !== null && parseInt(getStorage('lastMapOptionsUpdate')) > Date.now()+60
    if(decideToChange){

      putData(routesOrigin+'/'+routeId, {
        "map_data" : {
          "center_lat": focusLat,
          "center_long": focusLng,
          "center_zoom": focusZoom,
        }
      })
      .then(response =>{
        if(response.statusCode === 400){
          console.log('Something was wrong')
        }else{
          console.log('The route center params were updated...')
          setStorage('lastMapOptionsUpdate', Date.now())
        }
      });

    }

  }

  function renderRoutesSelector(){
    var options = [{ value: '0', label: messages.chooseRoute }]
    for(var i = 0; i < clientRoutes.length; i++){
      options.push({ value: clientRoutes[i].id.toString(), label: clientRoutes[i].name ?? '' })
    }
    return (options.length > 1 )
      ? <>          
          <Label htmlFor="selected-route">Create new or select existent...</Label>
          <Select
            name="selected-route"
            value={routeId}
            options={options}
            closeMenuOnSelect={true}
            onChange={({ target: { value } }) => { loadRoute(value) }}
          />
        </>
      : <>
          <br/>
          <h4>Add your first route!!</h4>
          <p></p>
          <p> • Paint a Route to trace with boat</p>
          <p> • Set at least one Place</p>
          <p> • Don't forget to publish! ;)</p>
        </>
  }

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

      map.current.on('draw.add',    updateDrawArea);
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

    const updateDrawArea = (e) => { updateMap(e, Draw.getAll()) }

  }

  function resetDrawRoutes(){
    removeStorage('currentRoute')
    Draw.deleteAll()
  }

  function loadRoute(selectedRouteId){
    if(selectedRouteId === 0){
      resetToCreationMode()
    }else{
      fetch(routesOrigin+'/'+selectedRouteId)
      .then((res) => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {
        resetDrawRoutes()
        if(response){
          resetToEditonMode(response)
        }else{
          resetToCreationMode()
        }          
      })
    }
  }

  function resetToCreationMode(){
    console.log('CREATION MODE!')
    storeRouteMode('creation')
    storeRouteId(0)
    storeRouteName('')
    storeRouteLabel('')
    storeRouteDescription('')
    resetPublishButton()
    flyTo(defaultCenter.lat, defaultCenter.lng, defaultCenter.zoom)
  }

  function resetToEditonMode(response){
    console.log('EDITION MODE!::'+response.id)
    storeRouteMode('edition')
    storeRouteId(response.id);
    storeRouteName(response.name)
    storeRouteLabel(response.description[0].label)
    storeRouteDescription(response.description[0].description)
    storeRouteIsPublished(response.published)
    drawSelectedRoute(response)
    flyTo(response.map_data.center_lat, response.map_data.center_long, response.map_data.center_zoom)
  }

  function drawSelectedRoute(response){
    let selected = defSelected
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
    storeRoute(selected)
  }

  function flyTo(lat, long, zoom){
    map.current.flyTo({ center:[ long, lat ], zoom: zoom });
  }

  // Saved  route operations

  function updateMap(mapElement, data){
    var mode = getStorage('routeMode', 'string')
    console.log([mode, mapElement])
    if( mode === 'edition'){     
      editionModeAction(mapElement)
    }else{
      creationModeAction(mapElement)
    }
  }

  function editionModeAction(mapElement){
    let route = getStorage('routeId')
    if(route !== null){
      console.log('Edition mode map action!')

      if(showChangeAdvisory()){
  
        if(mapElement.action !== undefined){
  
          if(mapElement.action === 'change_coordinates' || mapElement.action === 'move'){
            updateMapElement(mapElement)
          }else{
            console.log('Uncontrolled action :// !!!'+mapElement.action)
          }
  
        }else{
          
          if(mapElement.features[0].geometry.type === 'LineString'){
            let storedLinesAmount = checkFeaturesAmount(Route, 'LineString');
            if(storedLinesAmount > 1){
              alert('You cannot add more than one route. Delete one!')
              return false;
            }  
          }
  
          switch(mapElement.type){
            case 'draw.create': createMapElement(mapElement); break;
            case 'draw.update': updateMapElement(mapElement); break;
            case 'draw.delete': deleteMapElement(mapElement); break;
            default: console.log('Uncontrolled action :// !!!'+mapElement.action)
          }
        
        }
  
      }

    }
  
  }

  function creationModeAction(mapElement){

    if(routeId === null){

      console.log('Creation mode map action!')
      
      if(showCreationAdvisory()){

        if(mapElement.type === 'draw.create'){

          var name          = (routeName) ? routeName : 'New route '+makeId(6)
          var label         = (routeLabel) ? routeLabel : 'New route label'
          var description   = (routeDescription) ? routeDescription : 'New route description...'
          var isLineString  = mapElement.features[0].geometry.type === 'LineString'

          postData(routesOrigin, {
            "name": name,
            "creator": userId,
            "element" : mapElement.features[0].id,
            "description": [
              {
                "language": 1,
                "label": label,
                "description": description
              }
            ],
            "map_data" : {
              "center_lat": focusLat,
              "center_long": focusLng,
              "center_zoom": focusZoom,
              "data" : ( isLineString ) ? mapElement.features[0] : '',
            }
          })
          .then(response => {

            if(response.statusCode === 400){
              console.log('Something was wrong with updateMap creation mode action...')
            }else{
              
              console.log('You have created the element id '+response.map_data.data.id+' as route with the id "'+response.id+'"')

              storeRouteMode('edition')

              if(isLineString){
                // Set the main Inputs
                console.log('The element is a LineString')
                storeRouteId(response.id)
                storeRouteName(name)
                storeRouteLabel(label)
                storeRouteDescription(description)  
                storePublishButtonStatus(!true)
                storeRoute(response.map_data.data)

              }else{                  
                if(mapElement.features[0].geometry.type === 'Point'){
                  //XXX: The point requires a modal to save textual data
                  setModalStatus(true);
                  setStorage('tmpPoint', mapElement.features[0])    
                }else if(mapElement.features[0].geometry.type === 'Polygon'){
                  postPolygon(mapElement.features[0], '*')    
                }

              }
            }

          })
        
        }           

      }        

    }

  }


  function updateRouteExtra(){
    if(routeId !== null && routeId !== 0){
      if(routeName !== '' && routeLabel !== '' && routeName !== ''){
        putData(routesOrigin+'/'+routeId, {
          "name" : routeName,
          "description":[{
            "language" : 1,
            "label" : routeLabel,
            "description" : routeDescription
          }]
        })
      }
    }
  }

  function createMapElement(mapElement){
    let route = parseInt(getStorage('routeId', 'string'))
    let type = mapElement.features[0].geometry.type
    if(type === 'Polygon'){
      postData(polygonsOrigin, {
        "creator": userId,
        "parent_route": route,
        "map_data": {
          "center_lat": focusLat,
          "center_long": focusLng,
          "center_zoom": focusZoom,
          "data": mapElement.features[0],
          "element": mapElement.features[0].id,
        }
      })
      .then(data => {
        if(data.statusCode === 400){
          console.log('Something was wrong creating a Polygon')
        }else{
          console.log('The Polygon '+mapElement.features[0].id+' with the id "'+data.id+'" to the route "'+route+'" was succesfully created!!')
        }
      });
    }else if(type === 'Point'){
      postData(placesOrigin, {
        "name": routeName+' Place '+route+' (added)',
        "creator": userId,
        "parent_route": route,
        "description": [
          {
            "language": 1,
            "label": routeName+' Place Added',
            "description": routeDescription
          }
        ],
        "map_data": {
          "center_lat": focusLat,
          "center_long": focusLng,
          "center_zoom": focusZoom,
          "data": mapElement.features[0],
          "element": mapElement.features[0].id,
        }
      })
      .then(data => {
        if(data.statusCode === 400){
          console.log('Something was wrong creating a Place')
        }else{
          console.log('The Place '+mapElement.features[0].id+' with the id "'+data.id+'" to the route "'+route+'" was succesfully created!!')
        }
      });
    }
  }

  function deleteMapElement(mapElement){
    var url = ''
    switch(mapElement.features[0].geometry.type){
      case 'LineString' : url = routesOrigin; break;
      case 'Polygon' :    url = polygonsOrigin; break;
      default: break;
    }
    url = url+'/'+mapElement.features[0].id
    deleteData(url)
    .then(data => {
      if(data.statusCode === 400){
        console.log('Something was wrong deleting a route element')
      }else{
        console.log('The Place '+mapElement.features[0].id+' with the id "'+data.id+'" was succesfully updated!!')
      }
    })
  }

  function updateMapElement(mapElement){
    var url = ''
    switch(mapElement.features[0].geometry.type){
      case 'Point'      : url = placesOrigin;   break;
      case 'Polygon'    : url = polygonsOrigin; break;
      case 'LineString' : url = routesOrigin;   break;
      default: break;
    }
    url = url+'/'+mapElement.features[0].id
    putData(url, {
      "map_data" : {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data" : mapElement.features[0]
      }
    })
    .then(data => {
      if(data.statusCode === 400){
        console.log('Something was wrong with updateMapElement action...')
      }else{
        console.log('The Place '+mapElement.features[0].id+' with the id "'+data.id+'" was succesfully update!!')
      }
    })
  }

  function postPlace(key, placeFeatures, i){    
    postData(placesOrigin, {
      "name": routeName+' Place '+routeId+'-'+i.toString(),//TODO: Improve
      "creator": userId,
      "parent_route" : routeId,
      "description": [{
        "language": 1,
        "label": routeName+' Place '+i.toString(),//TODO: Improve
        "description": 'asdfasdfa'
      }],
      "map_data": {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data": placeFeatures
      }
    })
    .then(data => {
      if(data.statusCode === 400){
        console.log('Something was wrong with this action...')
      }else{
        console.log('Place '+key+' posted successful ;)')
      }
    })
  }

  function postPolygon(polygonFeatures, i){
    postData(polygonsOrigin, {
      "name": routeName+' Warning '+routeId+'-'+i.toString(),
      "creator": userId,
      "parent_route" : routeId,      
      "element": polygonFeatures.id,
      "map_data": {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data": polygonFeatures
      },
    })
    .then(data => {
      if(data.statusCode === 400){
        console.log('Something was wrong creating a Polygon')
      }else{
        console.log('Polygon '+data.id+' posted successful ;)') 
      }
    })    
  }


// For  route

  function storeRouteMode(mode){
    setRouteMode(mode)
    setStorage('routeMode', mode, 'string')
  }

  function storeRouteId(id){
    setRouteId(id)
    setStorage('routeId', id, 'string')
  }

  function storeRouteName(name){
    setrouteName(name)
    setStorage('routeName', name, 'string')
    updateRouteExtra()
    return name
  }

  function storeRouteLabel(label){
    setrouteLabel(label)
    setStorage('routeLabel', label, 'string')
    updateRouteExtra()
    return label
  }

  function storeRouteDescription(description){
    setRouteDescription(description)
    setStorage('routeDescription', description, 'string')
    updateRouteExtra()
    return description
  }

  function storeRouteIsPublished(status){
    setRouteIsPublished(status)
    setStorage('routeIsPublished', status, 'string')
    if(!status){
      setPublishable()
    }else{
      setUnpublishable()
    }
  }


  // For places

  function getEditPlaceModal(){
    return <Modal
      isOpen={modalStatus}
      style={customStyles}
      contentLabel="Save your place"
    >
    <div className='table'>
    <div className='row'>
      Set here the place data
    </div>
      <div className='row'>
        <div className='col-12'>
          <label>Place name</label>
        </div>
        <div className='col-12'>
          <InputText
            type='text'
            name='place-name'
            value={PlaceName} 
            placeholder='Set here the place name for this route...'
            required={true}
            onChange={({ target: { value } }) =>{storePlaceName(value)}}
          />
        </div>
      </div>
      <div className='row'>
        <div className='col-12'>
          <label>Route Place label</label>
        </div>
        <div className='col-12'>
          <InputText
            type='text'
            name='place-label'
            value={PlaceLabel} 
            placeholder='Set here the place label for this route...'
            required={true}
            onChange={({ target: { value } }) =>{storePlaceLabel(value)}}
          />
        </div>
      </div>
      <div className='row'>
        <div className='col-12'>
        <label>Route Place Description</label>
        </div>
        <div className='col-12'>
          <Textarea
            name="route-description"
            placeholder='Set here the description for this place...'
            required={true}
            onChange={({ target: { value } }) =>{storePlaceDescription(value)}}
            value={PlaceDescription}
          /> 
        </div>
      </div>   
      <div className='row'>
        <div className='col-6'>
          <Button
            label={'Save'}            
            onClick={savePlace}
          />
        </div>
        <div className='col-6'>
          <Button
            label={'Close'}            
            color={publishButtonColor}
            onClick={closePlace}
          />
        </div>
      </div>
    </div>
  </Modal>
  }

  function storePlaceName(name){
    setPlaceName(name)
    setStorage('PlaceName', name, 'string')
  }

  function storePlaceLabel(label){
    setPlaceLabel(label)
    setStorage('PlaceLabel', label, 'string')
  }

  function storePlaceDescription(description){
    setPlaceDescription(description)
    setStorage('PlaceDescription', description, 'string')
  }

  function closePlace(){
    var mapElement = getStorage('tmpPoint', '')
    Draw.delete(mapElement.id)
    setModalStatus(false)
  }

  function savePlace(){    
    var mapElement = getStorage('tmpPoint')
    if(mapElement !== ''){
      postPlace(mapElement.id, mapElement, makeId(6))
      setStorage('tmpPoint', '')
    }else{
      alert('Theres is not data for save about the place');
      Draw.delete(mapElement.id)      
    }
    setModalStatus(false)
  }


  // For Publish button

  function storePublishButtonLabel(label){
    setPublishButtonLabel(label)
    setStorage('publishButtonLabel', label, 'string')
  }

  function storePublishButtonStatus(status){
    setPublishButtonStatus(status)
    setStorage('publishButtonStatus', status, 'string')
  }

  function togglePublished(){
    if(routeIsPublished){
      console.log('Unpublishing??')
      if(window.confirm('ALERT:\n\nIf you continue the route will disapear from the app after next data uprgade\n\nDo you wanna unpublish the route?')){         
        storeRouteIsPublished(false)
      }else{
        return false
      }
    }else{
      console.log('Publishing??')
      if(validatePublishing()){
        if(window.confirm('ALERT:\n\nIf you continue the route will appear from the app after next data uprgade\n\nDo you wanna publish the route?')){         
          storeRouteIsPublished(true)
        }else{
          return false
        }
      }else{
        return false
      }
    }
    let publishedStatus ={
      "published" : ! routeIsPublished
    }
    putData(routesOrigin+'/'+routeId, publishedStatus)        
    .then(data => {
      let action = ( ( ! routeIsPublished ) ? 'published' : 'unpublished' )
      console.log('The Route '+routeId+' succesfully '+action)
    })
  }

  function validatePublishing() {

    if(Route === []) return false

    // Analizing the data to save :)
    if(Route.features.length > 0){

      // 1.- Only a Linestring is allowed!! Not two      

        let storedLinesAmount = checkFeaturesAmount(Route, 'LineString');
        if(storedLinesAmount > 1 ){
          if(!launchToast('You are unable to draw two lines for a route. \n\n You must delete '+(storedLinesAmount-1)+' lines\n')) return false
        }else if(storedLinesAmount === 0){
          if(!launchToast('You must draw one route, at least')) return false
        }          

      // 2.- Now you will set the first location (meeting-point)

        let storedPointsAmount = checkFeaturesAmount(Route, 'Point');
        if(storedPointsAmount < 1 ){
          if (!window.confirm("You don't have addressed any Place to your route. \nWe encourage you to put, at least, one Place Marker ;)\n\n Do you really want to save?\n\n")) {
            //if(!launchToast('You canceled to save this Route')) 
            return false
          }
        }else if(storedPointsAmount > placesLimit ){
          if(!launchToast('You have passed the amount limit of Places on your route. Please, the limit are '+placesLimit)) return false
        }

    }else{ 
      if(!launchToast("You haven't created a route. Please, print at least a Route!")) return false
    }

    return true;

  }

  function resetPublishButton(){
    storePublishButtonStatus(false)
    storePublishButtonLabel(createText)
  }

  function setPublishable(){
    storePublishButtonStatus(true)
    storePublishButtonLabel('Publish')
  }

  function setUnpublishable(){
    storePublishButtonStatus(true)
    storePublishButtonLabel('Unpublish')
  }

  function launchToast(message, doContinue=false){
    alert(message);
    return doContinue
  }


  // For Advisories

  function storeRouteCreationAdvisory(date){
    setRouteCreationAdvisory(date)
    setStorage('routeCreationAdvisory', date, 'string')
  }

  function storeRouteChangeAdvisory(date){
    setRouteChangesAdvisory(date)
    setStorage('routeChangesAdvisory', date, 'string')
  }

  function storeRoute(theRoute){
    setStorage('currentRoute', theRoute)
    setRoute(theRoute)
  }


  // Toggling advisements
  
  function showChangeAdvisory(){
    if(getStorage('routeChangesAdvisory', 'string') === false){
      if(window.confirm('Do you want to edit this route?')){
        storeRouteChangeAdvisory(true)
        return true
      }else{
        return false
      }
    }
    return true
  }

  function showCreationAdvisory(){
    if(routeId === null && routeCreationAdvisory !== ''){      
      if(window.confirm('Do you want to create a new route?')){
        storeRouteCreationAdvisory(Date.now())
        return true
      }else{
        return false
      }
    }
    return true
  }


  return (
    <>
      <div className="row">
        <div className="col-lg-8 col-md-8">
          <div ref={mapContainer} className="map-container" />
          <div className="nav-bar">Longitude: {focusLng.toFixed(4)} • Latitude: {focusLat.toFixed(4)} • Zoom: {Math.round(focusZoom)}</div>
        </div>
        <div className="col-md-4 col-lg-4">
        <br/>
        <div className='row'>
            <div className='col-6'></div>
            <div className='col-6'>
              <Button
                label={publishButtonLabel}            
                color={publishButtonColor}
                disabled={!publishButtonStatus}
                visible={true}
                onClick={ (e) => {togglePublished()}}
              />
            </div>
          </div>
          <br/>  
          <div className='row'>
            {renderRoutesSelector()}
          </div>
          <br/>  
          <div className='row'>
            <Label htmlFor="route-name">Route name</Label>
            <InputText
              type='text'
              name='route-name'
              value={routeName} 
              placeholder='Set the route name...'
              required={true}
              onChange={({ target: { value } }) =>{storeRouteName(value)}}
            />
          </div>
          <br/>
          <div className='row'>
            <Label htmlFor="route-name">Route label</Label>
            <InputText
              type='text'
              name='route-name'
              value={routeLabel}
              placeholder='Set here the english route label...'
              required={true}
              onChange={({ target: { value } }) =>{storeRouteLabel(value)}}
            />
          </div>
          <br/>
          <div className='row'>
            <Label htmlFor="route-description">Route description</Label>
            <Textarea
              name="route-description"
              placeholder='Set here the english description...'
              required={true}
              onChange={({ target: { value } }) =>{storeRouteDescription(value)}}
              value={routeDescription}
            /> 
          </div>
        </div>
      </div>
      {getEditPlaceModal()}
    </>
  )

}

export default memo(HomePage)
