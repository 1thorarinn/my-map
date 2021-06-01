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
import { faPlus } from '@fortawesome/free-solid-svg-icons';

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
var newId = makeId(6)
//const routesLimit = 10;
//const publishEnabled = false
const createText = 'Publish'
const defaultCenter = { lat: 39.79, lng: 2.68, zoom: 3 }
const defSelected = { type: 'FeatureCollection', features: [] }
const mapStyle = {
  position:'absolute',
  top: 0,
  bottom: 0,
  width:'100%',
  minHeight: '1000px'
}

const HomePage = () => {
  
  //const [userId, setUserId] = useState(4)

  // Map Settings
  const map = useRef(null);
  const mapContainer = useRef(null);

  // Client routes for the select button
  const [clientRoutes, setClientRoutes] = useState([]);

  //  Map
  const [mapOpts, setRouteOptions] = useState(getStorage('routeOptions') ?? defaultCenter)
  const [routeMode, setRouteMode] = useState(getStorage('routeMode', 'string'))

  // Map coords
  const [focusLat,  setMapLat]  = useState(mapOpts.lat)
  const [focusLng,  setMapLng]  = useState(mapOpts.lng)
  const [focusZoom, setMapZoom] = useState(mapOpts.zoom)

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

  const [deleteButtonStatus, setDeleteButtonStatus] = useState(getStorage('deleteButtonStatus', 'string') ?? false)

  // New Place data
  const [placeModalStatus, setPlaceModalStatus] = useState(false);
  const [alertModalStatus, setAlertModalStatus] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState(false);

  const [placeName, setPlaceName] = useState('')
  const [placeLabel, setPlaceLabel] = useState('')
  const [placeDescription, setPlaceDescription] = useState('')


  const [routeChangesAdvisory, setRouteChangesAdvisory] = useState(getStorage('routeChangesAdvisory', 'string') ?? false)
  const [routeCreationAdvisory, setRouteCreationAdvisory] = useState(getStorage('routeCreationAdvisory', 'string', ''))

  if (typeof(window) !== 'undefined') {
    Modal.setAppElement('body')
  }

  useEffect(() => { 
    fetch(routesOrigin+'?created_by='+userId)
    .then((res) => res.json())
    .then(setClientRoutes); 
  },[routeId]);

  useEffect(() => {
    loadMap()
  },[]);

  function setMapOptions(){
    setMapLat(map.current.getCenter().lat)
    setMapLng(map.current.getCenter().lng)
    setMapZoom(Math.round(map.current.getZoom()))
    setStorage('routeOptions',{
      lat:  map.current.getCenter().lat,
      lng:  map.current.getCenter().lng,
      zoom: Math.round(map.current.getZoom())
    })
    
    let decideToChange = routeId !== null && parseInt(getStorage('lastMapOptionsUpdate')) > Date.now()+60    
    if(decideToChange){
      putData(routesOrigin+'/'+routeId, {
        "map_data" : {
          "center_lat": getStorage('routeOptions').lat,
          "center_long": getStorage('routeOptions').lng,
          "center_zoom": getStorage('routeOptions').zoom,
        }
      })
      .then(response =>{
        if(response.statusCode === 400){
          console.log('Something was wrong in setMapOptions post call')
        }else{
          console.log('The route center params were updated...')
          setStorage('lastMapOptionsUpdate', Date.now())
        }
      })
    }
  }

  function renderRoutesSelector(){
    var options = [{ value: '0', label: messages.chooseRoute }]
    for(var i = 0; i < clientRoutes.length; i++){
      options.push({ value: clientRoutes[i].id.toString(), label: clientRoutes[i].name ?? '' })
    }
    return (options.length > 1 )
      ? <>          
          <Label htmlFor="selected-route">Create new or edit existent...</Label>
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
          <br/><br/>
          <p> • Trace a route for boats</p>
          <p> • Set at least one Place</p>
          <p> • Don't forget to publish! ;)</p>
        </>
  }

  function loadMap(){

    if (map.current) return;

    map.current = new MapboxGL.Map({
      center: [ focusLng, focusLat ],
      zoom: focusZoom,
      containerStyle: mapStyle,
      container: mapContainer.current,
      style: mapTile,
      minZoom: 4,
      maxZoom: 18
    })

    map.current.on('load', function () {      

      map.current.resize()
      map.current.addControl(Draw, 'top-left');

      map.current.addControl(new MapboxGLGeocoder({
        accessToken: MapboxGL.accessToken,
        marker: false
      }))

      map.current.on('move', () => { setMapOptions() })

      map.current.on('draw.add',    updateDrawArea)
      map.current.on('draw.create', updateDrawArea)
      map.current.on('draw.update', updateDrawArea)
      map.current.on('draw.delete', updateDrawArea)

      map.current.addControl(new MapboxLanguage());
      //map.current.addControl(new MapboxGL.FullscreenControl());
      //map.current.addControl(new MapboxGL.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }));

      // Draw temporary stored map!!
      if(getStorage('currentRoute')){
        Draw.add(getStorage('currentRoute'))
      }

    })

    const updateDrawArea = (e) => { updateRoute(e, Draw.getAll()) }

  }

  function resetRouteDraw(){
    setStorage('currentRoute', '{}', 'json')
    removeStorage('currentRoute')
    Draw.deleteAll()
    Draw.trash()
  }

  function loadRoute(selectedRouteId){
    if(selectedRouteId === 0){
      resetToCreationMode()
    }else{
      fetch(routesOrigin+'/'+selectedRouteId)
      .then((res) => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {
        resetRouteDraw()
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
    resetRouteDraw()
    flyTo(defaultCenter.lat, defaultCenter.lng, defaultCenter.zoom+5)
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
    //console.log(response.map_data)
    flyTo(response.map_data.center_lat, response.map_data.center_long, response.map_data.center_zoom)
  }

  function drawSelectedRoute(response){
    resetRouteDraw()
    let selected = defSelected
    Draw.add(response.map_data.data)
    selected.features.push(response.map_data.data)
    if(response.places !== undefined){
      for(var i = 0; i < response.places.length; i++){
        let data = response.places[i].map_data.data
        Draw.add(data)
        selected.features.push(data)
      }
    }
    if(response.polygons !== undefined){
      for(var z = 0; z < response.polygons.length; z++){
        let data = response.polygons[z].map_data.data
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

  function updateRoute(mapElement, data){
    var mode = getStorage('routeMode', 'string')
    if( mode === 'edition'){     
      editionModeAction(mapElement)
    }else{
      creationModeAction(mapElement)
    }
  }

  function editionModeAction(mapElement){
    let route_id = getStorage('routeId', 'string')    
    if(route_id !== null){      
      console.log('Edition route mode '+route_id+' action!')
      if(showChangeAdvisory()){  
        if(mapElement.action !== undefined){  
          if(mapElement.action === 'change_coordinates' || mapElement.action === 'move'){
            updateRouteElement(mapElement)
          }else{
            console.log('Uncontrolled action :// !!!'+mapElement.action)
          }  
        }else{          
          if(mapElement.features[0].geometry.type === 'LineString'){
            let storedLinesAmount = checkFeaturesAmount(Route, 'LineString');
            if(storedLinesAmount > 1){
              setAlert('You cannot add more than one route. Delete one!')
              return false;
            }  
          }
          switch(mapElement.type){
            case 'draw.create': createMapElement(mapElement); break;
            case 'draw.update': updateRouteElement(mapElement); break;
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

          var name          = (getStorage('routeName', 'string')) ? getStorage('routeName', 'string') : 'New route '+newId
          var label         = (getStorage('routeLabel', 'string')) ? getStorage('routeLabel', 'string') : 'New route label'
          var description   = (getStorage('routeDescription', 'string')) ? getStorage('routeDescription', 'string') : 'New route description...'
          var isLineString  = mapElement.features[0].geometry.type === 'LineString'
          var type          = mapElement.features[0].geometry.type;

          postData(routesOrigin, {
            "name": name,
            "creator": userId,
            "element" : mapElement.features[0].id,
            "description": [{
              "language": 1,
              "label": label,
              "description": description
            }],
            "map_data" : {
              "center_lat": getStorage('routeOptions').lat,
              "center_long": getStorage('routeOptions').lng,
              "center_zoom": getStorage('routeOptions').zoom,
              "data" : ( isLineString ) ? mapElement.features[0] : '',
            }
          })
          .then(res => {

            if(res.statusCode === 400){
              console.log('Something was wrong with updateRoute creation mode action...')
            }else{
              
              console.log('You have created the element id '+res.map_data.data.id+' as route with the id "'+res.id+'"')

              storeRouteMode('edition')

              if(isLineString){

                // Setting main inputs ;)
                console.log('The element is a LineString')
                storeRouteId(res.id)
                storeRouteName(name)
                storeRouteLabel(label)
                storeRouteDescription(description)  
                storePublishButtonStatus(!true)
                storeRoute(res.map_data.data)
                setAlert('GRETTINGS!:\n\nYou have created a new route!')
              }else{

                if(type === 'Point'){
                  console.log('The element is a Point')
                  //XXX: The point requires a modal to save the textual data
                  setPlaceModalStatus(true);
                  setStorage('tmpPoint', mapElement.features[0], 'json')    
                }else if(type === 'Polygon'){
                  console.log('The element is a Polygon')
                  postPolygon(mapElement.features[0], newId)    
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
        "name": 'Polygon route '+mapElement.features[0].id,
        "creator": userId,
        "parent_route": route,
        "element": mapElement.features[0].id,
        "map_data": {
          "center_lat": getStorage('routeOptions').lat,
          "center_long": getStorage('routeOptions').lng,
          "center_zoom": getStorage('routeOptions').zoom,
          "data": mapElement.features[0],
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
      // XXX: Call to a Places modal...
      setPlaceModalStatus(true);
      setStorage('tmpPoint', mapElement.features[0], 'json')
    }
  }

  function deleteMapElement(mapElement){

    if(routeIsPublished){
      alert('You cannot delete an element while a map is published.\n\nPlease, ubpublish before remove elements')
      return false
    }

    var url = ''
    var type = mapElement.features[0].geometry.type
    switch(type){
      case 'Point'      : url = placesOrigin;   break;
      case 'Polygon'    : url = polygonsOrigin; break;
      case 'LineString' : url = routesOrigin;   break;
      default: break;
    }

    if(type==='Point'){
      if(!window.confirm('ALERT:\n\nIf you delete this Place you will lose all the related content.\n\nDo you want to continue?')){
        return false
      }
    }

    if(type==='LineString'){
      if(!window.confirm('ALERT:\n\nIf you delete this Route you will must to put a new one.\n\nConsider first to edit the existent one.\n\nDo you want to continue?')){
        return false
      }
    }
    
    let getUrl = url+'?element='+mapElement.features[0].id
    getData(getUrl).then(response=>{
      let delUrl = url+'/'+response[0].id
      deleteData(delUrl)
      .then(data => {
        if(data.statusCode === 400){
          console.log('Something was wrong deleting a route element')
        }else{
          Draw.delete()
          Draw.trash()
          console.log('The MapElement '+mapElement.features[0].id+' with the id "'+data.id+'" was succesfully deleted!!')
        }
      })
    })
  }

  function updateRouteElement(mapElement){
    var url = ''
    var type = mapElement.features[0].geometry.type
    var id =  mapElement.features[0].id
    switch(type){
      case 'Point'      : url = placesOrigin;   break;
      case 'Polygon'    : url = polygonsOrigin; break;
      case 'LineString' : url = routesOrigin;   break;
      default: break;
    }
    let urlGet = url+'?element='+mapElement.features[0].id
    getData(urlGet)
    .then(response => {
      if(response.statusCode === 400){
        console.log('Something was wrong with updateRouteElement action...')
      }else{
        console.log('The updateRouteElement first response')
        console.log(response)

        console.log('You got the desired element '+mapElement.features[0].id)
        var  putUrl = url+'/'+response[0].id

        putData(putUrl, {
          "map_data" : {
            "center_lat": getStorage('routeOptions').lat,
            "center_long": getStorage('routeOptions').lng,
            "center_zoom": getStorage('routeOptions').zoom,
            "data" : mapElement.features[0]
          }
        })
        .then(data => {
          if(data.statusCode === 400){
            console.log('Something was wrong with updateRouteElement action...')
          }else{
            var res = (type==='LineString') ? id : id
            console.log('The Element '+mapElement.features[0].id+' with the id "'+res+'" was succesfully updated!!')
          }
        })
      }
    })
  }

  function postPlace(key, placeFeatures, i){    
    postData(placesOrigin, {
      "name": placeName,
      "creator": userId,
      "parent_route" : routeId,
      "element": placeFeatures.id,
      "description": [{
        "language": 1,
        "label": placeLabel,
        "description": placeDescription
      }],
      "map_data": {
        "center_lat": getStorage('routeOptions').lat,
        "center_long": getStorage('routeOptions').lng,
        "center_zoom": getStorage('routeOptions').zoom,
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
        "center_lat": getStorage('routeOptions').lat,
        "center_long": getStorage('routeOptions').lng,
        "center_zoom": getStorage('routeOptions').zoom,
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

    console.log('validatePublishing attempt... is Route! ;))')
    console.log(Route)

    if(Route === []) return false

    // Analizing the data to save :)
    if(Route.features.length > 0){

      console.log('Routes::Features!!')
      console.log(Route.features)

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
    setAlert(message)
    return doContinue
  }


  // For Advisories

  function storeCreationAdvisory(date){
    setRouteCreationAdvisory(date)
    setStorage('routeCreationAdvisory', date, 'string')
  }

  function storeChangeAdvisory(date){
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
        storeChangeAdvisory(true)
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
        storeCreationAdvisory(Date.now())
        return true
      }else{
        return false
      }
    }
    return false
  }

  function deleteRoute(){
    if(window.confirm('ALERT: \n\nIf you delete the route this will delete on cascade all the related content.\n\nDo you want continue??')){
      let route_id = getStorage('routeId','string')
      getData(routesOrigin+'/'+route_id)
      .then(result=>{
        deleteData(routesOrigin+'/'+route_id).then(result2=>{
          for(var i = 0; i < result.places.length; i++ ){
            deleteData(placesOrigin+'/'+result.places[i].id)
          }
          for(var ii = 0; ii < result.polygons.length; ii++ ){
            deleteData(polygonsOrigin+'/'+result.polygons[ii].id)
          }
        })
        resetToCreationMode()
      })
      return true
    }else{
      return false
    }
  }

  // For places

  function storePlaceName(name){
    setPlaceName(name)
    setStorage('placeName', name, 'string')
  }

  function storePlaceLabel(label){
    setPlaceLabel(label)
    setStorage('placeLabel', label, 'string')
  }

  function storePlaceDescription(description){
    setPlaceDescription(description)
    setStorage('placeDescription', description, 'string')
  }

  function cancelPlace(){
    var mapElement = getStorage('tmpPoint', 'json')
    if(mapElement !== ''){
      console.log('You are canceling to save the Place '+mapElement.id)
      Draw.delete(mapElement.id)
    }
    setPlaceModalStatus(false)
  }

  function savePlace(){    
    var mapElement = getStorage('tmpPoint', 'json')
    if(mapElement !== ''){//Undo
      postPlace(mapElement.id, mapElement, makeId(6))
      setStorage('tmpPoint', '', 'json')
      setPlaceName('')
      setPlaceLabel('')
      setPlaceDescription('')

    }else{
      alert('Theres is not data to save about the place');
      Draw.trash()      
    }
    setPlaceModalStatus(false)
  }

  function getEditPlaceModal(){
    return <Modal
      isOpen={placeModalStatus}
      style={customStyles}
      contentLabel="Save your place"
    >
    <div className='table'>
      <div className='row'>
        <h2>Set the place data</h2>
      </div>
      <div className='row'>
        <div className='col-12'>
          <Label htmlFor="place-name">Place name</Label>
          <InputText
            type='text'
            name='place-name'
            value={placeName} 
            placeholder='Set here the place name for this route...'
            required={true}
            onChange={({ target: { value } }) =>{storePlaceName(value)}}
          />
        </div>
      </div>
      <div className='row'>
        <div className='col-12'>
          <Label htmlFor="place-label">Place label</Label>
          <InputText
            type='text'
            name='place-label'
            value={placeLabel} 
            placeholder='Set here the place label for this route...'
            required={true}
            onChange={({ target: { value } }) =>{storePlaceLabel(value)}}
          />
        </div>
      </div>
      <div className='row'>
        <div className='col-12'>
          <Label htmlFor="place-description">Place label</Label>
          <Textarea
            name="route-description"
            placeholder='Set here the description for this place...'
            required={true}
            onChange={({ target: { value } }) =>{storePlaceDescription(value)}}
            value={placeDescription}
          /> 
        </div>
      </div>
      <br/>
      <div className='row'>
        <div className='col-6'>
          <Button
            label={'Save'}            
            onClick={savePlace}
          />
        </div>
        <div className='col-6'>
          <Button
            label={'Cancel'}            
            color={publishButtonColor}
            onClick={cancelPlace}
          />
        </div>
      </div>
    </div>
  </Modal>
  }

  function setAlert(message){
    setAlertModalMessage(message)
    setAlertModalStatus(true)
  }

  function closeAlert(message){
    setAlertModalStatus(false)
  }

  function alertModal(){
    return <Modal
      isOpen={alertModalStatus}
      contentLabel={alertModalMessage}
      width='30%'
      style={{
        overlay: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.75)'
        },
        content: {
          position: 'absolute',
          top: '40px',
          left: '40px',
          right: '40px',
          bottom: '40px',
          border: '1px solid #ccc',
          background: '#fff',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '4px',
          outline: 'none',
          padding: '20px',
          textAlign: 'center',
        }
      }}
    ><Label htmlFor="input" message={alertModalMessage} />
      <Button
        label={'OK'}            
        color={publishButtonColor}
        onClick={closeAlert}
      />
    </Modal>
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
            <div className='col-6'>
              <Button
                label={'Delete'}            
                color={'delete'}
                disabled={!publishButtonStatus}
                visible={true}
                onClick={ (e) => {deleteRoute()}}
              />
            </div>
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
              className='my-input'
              value={routeName} 
              placeholder='Set the route name...'
              required={true}
              onChange={({ target: { value } }) =>{storeRouteName(value)}}
            />
          </div>
          <br/>
          <div className='row'>
            <Label htmlFor="route-label">Route label</Label>
            <InputText
              type='text'
              name='route-label'
              className='my-input'
              value={routeLabel}
              placeholder='Set here the route label...'
              required={true}
              onChange={({ target: { value } }) =>{storeRouteLabel(value)}}
            />
          </div>
          <br/>
          <div className='row'>
            <Label htmlFor="route-description">Route description</Label>
            <Textarea
              name="route-description"
              placeholder='Set here the description...'
              required={true}
              onChange={({ target: { value } }) =>{storeRouteDescription(value)}}
              value={routeDescription}
            /> 
          </div>
        </div>
      </div>
      {getEditPlaceModal()}
      {alertModal()}
    </>
  )

}

export default memo(HomePage)
