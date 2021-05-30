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
const markersOrigin = host+'/map-markers'

const mapTile = 'mapbox://styles/mapbox/streets-v11'

// Map vars
const placesLimit = 6;
const userId = 4;
//const routesLimit = 10;
//const publishEnabled = false
const createText = 'Create...'
const defaultCenter = {
  lat: 39.79, lng: 2.68, zoom: 3
}

const HomePage = () => {
  
  //const [userId, setUserId] = useState(4)

  // Map Settings
  const map = useRef(null);
  const mapContainer = useRef(null);
  
  // Client routes for the select button
  const [clientRoutes, setClientRoutes] = useState([]);

  // Current Map
  const currentMapOpts = getStorage('currentRouteOptions') ?? defaultCenter;
  const [currentRouteMode, setCurrentRouteMode] = useState(getStorage('currentRouteMode', 'string') ?? '')

  const [focusLat,  setMapLat]  = useState(currentMapOpts.lat);
  const [focusLng,  setMapLng]  = useState(currentMapOpts.lng);
  const [focusZoom, setMapZoom] = useState(currentMapOpts.zoom);

  const [modalStatus, setModalStatus] = useState(false);

  // Related with routes...
  const [currentRoute, setCurrentRoute] = useState(getStorage('currentRoute') ?? { features: {} })
  
  
  // Current Route data
  const [currentRouteId, setCurrentRouteId] = useState(getStorage('currentRouteId', 'string') ?? 0)
  const [currentRouteIsPublished, setCurrentRouteIsPublished] = useState(getStorage('currentRouteIsPublished', 'string') ?? false)
  const [currentRouteName, setCurrentRouteName] = useState(getStorage('currentRouteName', 'string') ?? '')
  const [currentRouteLabel, setCurrentRouteLabel] = useState(getStorage('currentRouteLabel', 'string') ?? '')
  const [currentRouteDescription, setCurrentRouteDescription] = useState(getStorage('currentRouteDescription', 'string') ?? '')

  // Current Publish button parameters
  const [publishButtonLabel, setPublishButtonLabel] = useState(getStorage('publishButtonLabel', 'string') ?? createText )
  const [publishButtonStatus, setPublishButtonStatus] = useState(getStorage('publishButtonStatus', 'string') ?? false)
  const [publishButtonColor, setPublishButtonColor] = useState(getStorage('publishButtonColor', 'string') ?? 'primary')

  // New Place data
  const [currentPlaceName, setCurrentPlaceName] = useState('')
  const [currentPlaceLabel, setCurrentPlaceLabel] = useState('')
  const [currentPlaceDescription, setCurrentPlaceDescription] = useState('')


  const [routeChangesAdvisory, setRouteChangesAdvisory] = useState(getStorage('routeChangesAdvisory', 'string') ?? 'primary')
  const [routeCreationAdvisory, setRouteCreationAdvisory] = useState(getStorage('routeCreationAdvisory', 'string') ?? 'primary')

  if (typeof(window) !== 'undefined') {
    Modal.setAppElement('body')
  }

  function showChangeAdvisory(){
    if(routeChangesAdvisory !== ''){
      if(!window.confirm('Do you want to edit this route?')){
        return false
      }else{
        storeRouteChangeAdvisory(Date.now())
        return true
      }
    }
  }

  function showCreationAdvisory(){
    if(routeCreationAdvisory !== ''){
      if(!window.confirm('Do you want to create a new route?')){
        return false
      }else{
        storeRouteCreationAdvisory(Date.now())
        return true
      }
    }
  }

  function storeRouteCreationAdvisory(date){
    setRouteCreationAdvisory(date)
    setStorage('routeCreationAdvisory', date, 'string')
  }

  function storeRouteChangeAdvisory(date){
    setRouteChangesAdvisory(date)
    setStorage('routeChangesAdvisory', date, 'string')
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

    const updateDrawArea = (e) => { setStoredMap(e, Draw.getAll()) }

  }

  function resetMap(){
    removeStorage('currentRoute')
    Draw.deleteAll()
  }

  function togglePublished(){

    if(currentRouteIsPublished){
      console.log('Unpublishing??')
      if(window.confirm('ALERT:\n\nIf you continue the route will disapear from the app after next data uprgade\n\nDo you wanna unpublish the route?')){         
        storeCurrentRouteIsPublished(false)
      }else{
        return false
      }
    }else{
      console.log('Publishing??')
      if(validatePublishing()){
        if(window.confirm('ALERT:\n\nIf you continue the route will appear from the app after next data uprgade\n\nDo you wanna publish the route?')){         
          storeCurrentRouteIsPublished(true)
        }else{
          return false
        }
      }else{
        return false
      }
    }

    putData(routesOrigin+'/'+currentRouteId, {
      "published" : !currentRouteIsPublished
    })        
      .then(data => {
        console.log('The Route '+currentRouteId+' succesfully '+((!currentRouteIsPublished)?'published':'unpublished'))
      });

  }

  function setStoredMap(mapElement, data){    

    switch(currentRouteMode){

      case 'creation':

        if(currentRouteId === 0){

          if(showCreationAdvisory()){
            
            console.log('Creation mode map action!')          
            storeCurrentRouteId(currentRouteId)
  
            switch(mapElement.type){
  
              case 'draw.create':
  
                var name = (currentRouteName !== '') ? currentRouteName : storeCurrentRouteName('New route '+makeId(6))
                var label = (currentRouteLabel !== '') ? currentRouteLabel : storeCurrentRouteLabel('New route label')
                var description = (currentRouteDescription !== '') ? currentRouteDescription : storeCurrentRouteDescription('New route description...')
      
                var form = {
                  "name": name,
                  "creator": userId,
                  "element" : mapElement.features[0].id,
                  "description": [
                    {
                      "language": 1,
                      "label": label,
                      "description": currentRouteDescription ?? description
                    }
                  ],
                  "map_data" : {
                    "center_lat": focusLat,
                    "center_long": focusLng,
                    "center_zoom": focusZoom,
                    "data" : ( mapElement.features[0].geometry.type === 'LineString' ) ? mapElement.features[0] : '',
                  }
                } 
                postData(routesOrigin, form)
                  .then(response => {

                    console.log('You have created the id '+response.map_data.data.id+' to '+response.id)

                    // Set the main Inputs
                    storeCurrentRouteName(currentRouteName ?? name)
                    storeCurrentRouteLabel(currentRouteLabel ?? label)
                    storeCurrentRouteDescription(currentRouteDescription ?? description)  
  
                    if(mapElement.features[0].geometry.type !== 'LineString'){
  
                      if(mapElement.features[0].geometry.type === 'Point'){
                        setModalStatus(true);
                        setStorage('tmpPoint', mapElement.features[0])
                        //setNewPostPlace(data.id, element.features[0].id, element.features[0], '*')
  
                      }else if(mapElement.features[0].geometry.type === 'Polygon'){
                        setNewPostPolygon(data.id, mapElement.features[0], '*')
  
                      }
  
                    }else{
                      storeCurrentRoute(response.map_data.data)                 
                      storePublishButtonStatus(!true)
                      storeCurrentRouteId(data.id)
                    }
  
                  });
  
              break;
              default:
            
            }
  
            storeCurrentRouteMode('edition')

          }        

        }

        //console.log('Under this mode ther`s nothinga actively being saved ;)!')
        break;

      case 'edition':

        if(mapElement.action !== undefined){

          console.log('Edition mode map action!')

          if(showChangeAdvisory()){

            switch(mapElement.action){
              case 'change_coordinates':
              case 'move':
                updateExistingMapElement(mapElement)
                break;
  
              default:
                console.log('Uncontrolled action :// !!!'+mapElement.action)
              break;
            }
  
          }else{
            
            if(mapElement.features[0].geometry.type === 'LineString'){
              let storedLinesAmount = checkFeaturesAmount(currentRoute, 'LineString');
              if(storedLinesAmount > 1){
                alert('You cannot add more than one route. Delete one!')
                return false;
              }  
            }
  
            switch(mapElement.type){
              case 'draw.create':
                createNewMapElement(mapElement)
                break;
              case 'draw.update':
                updateExistingMapElement(mapElement)
                break;
              case 'draw.delete':
                deleteExistingMapElement(mapElement)
              break;
              default:
                console.log('Uncontrolled action :// !!!'+mapElement.action)
                break;
            }
          
          }

        }

      break;
      default:

    }

    defineSaveButtonStatus()

  }

  function createNewMapElement(mapElement){
    console.log('Now we create a new element for this route...')
    switch(mapElement.features[0].geometry.type){
      case 'Polygon':
        postData(polygonsOrigin, {
          "creator": userId,
          "parent_route": currentRouteId,
          "map_data": {
            "center_lat": focusLat,
            "center_long": focusLng,
            "center_zoom": focusZoom,
            "data": mapElement.features[0],
            "element": mapElement.features[0].id,
          }
        })
        .then(data => {
          console.log('The Polygon '+mapElement.features[0].id+' with the id "'+data.id+'" was succesfully created!!')
        });
        break;

      default:
        postData(placesOrigin, {
          "name": currentRouteName+' Place '+currentRouteId+' (added)',
          "creator": userId,
          "parent_route": currentRouteId,
          "description": [
            {
              "language": 1,
              "label": currentRouteName+' Place Added',
              "description": currentRouteDescription
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
          console.log('The Place '+mapElement.features[0].id+' with the id "'+data.id+'" was succesfully created!!')
        });
        break;
    }
  }

  function deleteExistingMapElement(event){
    deleteData()
  }

  function updateExistingMapElement(mapElement, equivalence=null){

    var url = ''
    switch(mapElement.features[0].geometry.type){
      case 'LineString' : url = routesOrigin; break;
      case 'Polygon' : url = polygonsOrigin; break;
      default: break;
    }

    if(isNaN(mapElement.features[0].id)){

      console.log('Must get the temporary id equivalences ;)')
      console.log(mapElement.features[0].id)
      
      var url = url+'?element='+mapElement.features[0].id;
      
      console.log(url)
      
      getData(url)
        .then(data1 => {

          console.log(data1)

          putData(url)
            .then(data2 => {

              console.log(data2)

            })
        });

    }else{

      putData(url+'/'+mapElement.features[0].id, {
        "map_data" : {
          "center_lat": focusLat,
          "center_long": focusLng,
          "center_zoom": focusZoom,
          "data" : mapElement.features[0],
          "element" : mapElement.features[0].id,
        }
      })
        .then(data => {
          console.log('The Place '+mapElement.features[0].id+' with the id "'+data.id+'" was succesfully update!!')
        });

    }

  }

  function launchToast(message, doContinue=false){
    alert(message);
    return doContinue
  }

  function validatePublishing() {

    if(currentRoute === []) return false

    console.log(currentRoute)

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

    return true;

  }
  
  function defineSaveButtonStatus(){
    //console.log([currentRouteName, currentRouteDescription, currentRoute.features.length])
  }
  
  function setNewPostPolygon(routeId, polygonFeatures, i){
    postData(host+'/polygons', {
      "name": currentRouteName+' Warning '+routeId+'-'+i.toString(),
      "creator": userId,
      "parent_route" : routeId,      
      "element": polygonFeatures.id,
      "map_data": {
        "center_lat": focusLat,
        "center_long": focusLng,
        "center_zoom": focusZoom,
        "data": polygonFeatures
      },
    } )
    .then(data => {
      //data.map_data.data.id = data.id
      putData(host+'/polygons/'+data.id, data);
      console.log('Polygon '+data.id+' posted successful ;)')
    });
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

  function setRoute(route_id){

    resetMap()
    //reloadMap()
    let url = routesOrigin+'/'+route_id
    console.log('Setting this ur route :'+url)
    fetch(url)
      .then((res) => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {

        storeCurrentRouteId(route_id);
        setStorage('currentRouteId', route_id, 'string')        

        if(!response){

          console.log('CREATION MODE!')
          setCurrentRouteMode('creation')
          setStorage('currentRouteMode', 'creation', 'string')
          //setSaveButtonStatus(false)

          storeCurrentRouteName('')
          storeCurrentRouteLabel('')
          storeCurrentRouteDescription('')
          resetPublishButton()


          map.current.flyTo({
            center:[
              defaultCenter.lng,
              defaultCenter.lat
            ],
            zoom: defaultCenter.zoom
          });          

        }else{

          storeCurrentRouteName(response.name)
          storeCurrentRouteLabel(response.description[0].label)
          storeCurrentRouteDescription(response.description[0].description)
          storeCurrentRouteIsPublished(response.published)

          console.log('EDITION MODE!')
          setCurrentRouteMode('edition')
          setStorage('currentRouteMode', 'edition', 'string')

          let selected = {
            type: 'FeatureCollection', features: []
          }

          //response.map_data.data.id = response.id
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

          storeCurrentRoute(selected)

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

  function storeCurrentRoute(selected){
    setStorage('currentRoute', selected)
    setCurrentRoute(selected)
  }

  function getEditPlaceModal(){
    return <Modal
      isOpen={modalStatus}
      style={customStyles}
      contentLabel="Save your place"
    >
    <div className='table'>
      <div className='row'>
        <div className='col-12'>
          <label>Place name</label>
        </div>
        <div className='col-12'>
          <InputText
            type='text'
            name='place-name'
            value={currentPlaceName} 
            placeholder='Set here the place name on this route...'
            required={true}
            onChange={({ target: { value } }) =>{storeCurrentPlaceName(value)}}
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
            value={currentPlaceLabel} 
            placeholder='Set here the place label on this route...'
            required={true}
            onChange={({ target: { value } }) =>{storeCurrentPlaceLabel(value)}}
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
            placeholder='Set here the description on this route...'
            required={true}
            onChange={({ target: { value } }) =>{storeCurrentPlaceDescription(value)}}
            value={currentPlaceDescription}
          /> 
        </div>
      </div>   
      {/*<div className='row'>
        <div className='col-6'>
          <button onClick={closePlace}>Cancel</button>
        </div>
        <div className='col-6'>
          <button onClick={savePlace}>Save</button>
        </div>
      </div>*/}
    </div>
  </Modal>
  }

  function closePlace(){
    setModalStatus(false)
  }

  function savePlace(){
    setModalStatus(false)
    //setNewPostPlace(data.id, element.features[0].id, element.features[0], '*')
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
            value={currentRouteId}
            options={options}
            closeMenuOnSelect={true}
            onChange={({ target: { value } }) => { setRoute(value) }}
          />
        </>
      : <>
          <p>Add your first route! ;)</p>
          <p> - Paint a route to trace with boat</p>
          <p> - Set at least one Place</p>
          <p> - Don't forget to publish</p>
        </>
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

  function storeCurrentRouteMode(mode){
    setCurrentRouteMode(mode)
    setStorage('currentRouteMode', mode, 'string')
  }

  function storeCurrentRouteId(value){
    setCurrentRouteId(value)
    setStorage('currentRouteId', value, 'string')
  }

  function storeCurrentRouteName(name){
    setCurrentRouteName(name)
    setStorage('currentRouteName', name, 'string')
    return name
  }

  function storeCurrentRouteLabel(label){
    setCurrentRouteLabel(label)
    setStorage('currentRouteLabel', label, 'string')
    //defineSaveButtonStatus()
  }

  function storeCurrentRouteDescription(description){
    setCurrentRouteDescription(description)
    setStorage('currentRouteDescription', description, 'string')
    //defineSaveButtonStatus()
  }

  function storeCurrentRouteIsPublished(status){
    setCurrentRouteIsPublished(status)
    setStorage('currentRouteIsPublished', status, 'string')
    if(!status){
      setPublishable()
    }else{
      setUnpublishable()
    }
  }

  function storeCurrentPlaceName(name){
    setCurrentPlaceName(name)
    setStorage('currentPlaceName', name, 'string')
    //defineSaveButtonStatus()
  }

  function storeCurrentPlaceLabel(label){
    setCurrentPlaceLabel(label)
    setStorage('currentPlaceLabel', label, 'string')
    //defineSaveButtonStatus()
  }

  function storeCurrentPlaceDescription(description){
    setCurrentPlaceDescription(description)
    setStorage('currentPlaceDescription', description, 'string')
    //defineSaveButtonStatus()
  }

  function storePublishButtonLabel(label){
    setPublishButtonLabel(label)
    setStorage('publishButtonLabel', label, 'string')
  }

  function storePublishButtonStatus(status){
    setPublishButtonStatus(status)
    setStorage('publishButtonStatus', status, 'string')
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
            {/*<RouteSelector selectedRoute={(value)=>{setCurrentRouteId(value)}}/>*/}
          </div>
          <br/>
          {/*<Tabs>

            <TabList>
              <Tab>Route</Tab>
              <Tab>Places</Tab>
            </TabList>

            <TabPanel>*/}        
              <div className='row'>
                <Label htmlFor="route-name">Route name</Label>
                <InputText
                  type='text'
                  name='route-name'
                  value={currentRouteName} 
                  placeholder='Set the route name...'
                  required={true}
                  onChange={({ target: { value } }) =>{storeCurrentRouteName(value)}}
                />
              </div>
              <br/>
              <div className='row'>
                <Label htmlFor="route-name">Route label</Label>
                <InputText
                  type='text'
                  name='route-name'
                  value={currentRouteLabel}
                  placeholder='Set here the english route label on app map...'
                  required={true}
                  onChange={({ target: { value } }) =>{storeCurrentRouteLabel(value)}}
                />
              </div>
              <br/>
              <div className='row'>
                <Label htmlFor="route-description">Route description</Label>
                <Textarea
                  name="route-description"
                  placeholder='Set here the english description on app map...'
                  required={true}
                  onChange={({ target: { value } }) =>{storeCurrentRouteDescription(value)}}
                  value={currentRouteDescription}
                /> 
              </div>
            {/*</TabPanel>
            
            <TabPanel>
            </TabPanel>

          </Tabs>*/}
          {getEditPlaceModal()}      
        </div>
      </div>
    </>
  );

};

export default memo(HomePage)
