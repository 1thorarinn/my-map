/*
 *
 * HomePage
 *
 */
/* eslint-disable */
/*
import PageTitle from '../../components/PageTitle';
import { useModels } from '../../hooks';

import { get, upperFirst } from 'lodash';
import { auth, LoadingIndicatorPage } from 'strapi-helper-plugin';
*/

/* eslint-disable */
import React, { useRef, useState, useEffect, memo, useMemo, Link } from 'react';

import { Select, Button, InputText, Textarea, Label } from '@buffetjs/core'

import 'react-tabs/style/react-tabs.css'
import Modal from 'react-modal'
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder'
import { Header } from '@buffetjs/custom';
import MapboxGL from 'mapbox-gl'
import routeIcon from './routeIcon.png'
import placeIcon from './placeIcon.png'
import polygonIcon from './polygonIcon.png'
import dropIcon from './dropIcon.png'



// BuffetJS
import { LoadingBar  } from '@buffetjs/styles';

// Fontawsome...
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { setStorage, getStorage, getRouteType, alertModalStyle, getData, Draw, placesModalStyle, putData, deleteData, messages, removeStorage, checkFeaturesAmount, postData, makeId } from './map-utils.js';
import { Toast } from 'bootstrap';

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

import jQuery from "jquery"

const host ='https://cms.hoponboard.eu';
MapboxGL.accessToken = "pk.eyJ1IjoiZHJ1bGxhbiIsImEiOiJja2l4eDBpNWUxOTJtMnRuejE1YWYyYThzIn0.y7nuRLnfl72qFp2Rq06Wlg"
const MapboxLanguage = require('@mapbox/mapbox-gl-language')

const testing = true
const routesOrigin = host+'/routes'
const polygonsOrigin = host+'/polygons'
const placesOrigin = host+'/my-places'
const instructionsOrigin = host+'/instructions'
const uploadOrigin = host

const mapTile = 'mapbox://styles/mapbox/streets-v11'


// Map vars
const placesLimit = 12

//const routesLimit = 10;
//const publishEnabled = false

const createText = 'Publish'
const defaultCenter = { lat: 50.79, lng: 16.68, zoom: 3 }
const defSelected = { type: 'FeatureCollection', features: [] }
const mapStyle = {
  position:'absolute',
  top: 0,
  bottom: 0,
  width:'100%',
  minHeight: '900px'
}
const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1
};

const HomePage = () => {
  
  // User params  

  localStorage.setItem('STRAPI_UPDATE_NOTIF', true)
  const username = 'asfsdfsa'//get(auth.getUserInfo(), 'firstname', '')  
  const user_id = 13//get(auth.getUserInfo(), 'id', '')
  if(!user_id){
    location.reload()
  }

  localStorage.setItem('user_id', user_id)  

  // Map Settings
  const map = useRef(null)
  const mapContainer = useRef(null)

  // Client routes for the select button


  //  Map
  const [mapOpts, setRouteOptions] = useState(defaultCenter)
  const [routeMode, setRouteMode] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  // Map coords
  const [focusLat,  setMapLat]  = useState(mapOpts.lat)
  const [focusLng,  setMapLng]  = useState(mapOpts.lng)
  const [focusZoom, setMapZoom] = useState(mapOpts.zoom)

  // Related with routes...
  const [Route, setRoute] = useState()
  
  //  Route data
  const [routeId, setRouteId] = useState(0)
  const [routeIsPublished, setRouteIsPublished] = useState(false)
  const [routeName, setRouteName] = useState('')
  const [routeLabel, setrouteLabel] = useState()
  const [routeDescription, setRouteDescription] = useState()

  const [lastChange, setLastChange] = useState('')

  function storeLastChange(){
    setLastChange(Date.now())
  }

  //  Publish button parameters
  const [publishButtonLabel, setPublishButtonLabel] = useState( createText)
  const [publishButtonStatus, setPublishButtonStatus] = useState(false)
  const [publishButtonColor, setPublishButtonColor] = useState('primary')

  const [deleteButtonStatus, setDeleteButtonStatus] = useState(false)

  // New Place data
  const [placeModalStatus, setPlaceModalStatus] = useState(false)
  const [alertModalStatus, setAlertModalStatus] = useState(false)
  const [alertModalMessage, setAlertModalMessage] = useState('')
  const [alertModalLabel, setAlertModalLabel] = useState('')
  const [alertContent, setAlertContent] = useState(null)
  //const [alertContent2, setAlertContent2] = useState(<></>)

  const [element, setElement] = useState('')
  const [placeId, setPlaceId] = useState(0)
  const [placeName, setPlaceName] = useState('')
  const [placeLabel, setPlaceLabel] = useState('')
  const [placeDescription, setPlaceDescription] = useState('')

  const [ wasEdited, setWasEdited ] = useState(false)

  const [routeChangesAdvisory, setRouteChangesAdvisory] = useState()
  const [routeCreationAdvisory, setRouteCreationAdvisory] = useState()

  if (typeof(window) !== 'undefined') { Modal.setAppElement('body') }
  
  const [clientRoutes, setClientRoutes] = useState([])
  useEffect(() => { 
    fetch(routesOrigin+'?creator='+user_id)
      .then((res) => res.json())
      .then(setClientRoutes)
      .catch(error => { console.error(error) })
    },[lastChange])
  
  const [instructions, setInstructions] = useState([])
  useEffect(() => {
    fetch(instructionsOrigin)
      .then((res) => res.json())
      .then(setInstructions)
      .catch(error => { console.error(error) })
  },[])

  useEffect(() => {
    if(map.current) Draw.deleteAll()
    loadMap()
    localStorage.setItem('user_id', user_id)
    storeRouteMode('creation')
  },[])

  function setMapOptions(){
    //if(!isLoading) return
    if(testing) console.log('setMapOptions!!!')
    setMapLat(map.current.getCenter().lat)
    setMapLng(map.current.getCenter().lng)
    setMapZoom(Math.round(map.current.getZoom()))
    setStorage('routeOptions',{
      lat:  map.current.getCenter().lat,
      lng:  map.current.getCenter().lng,
      zoom: Math.round(map.current.getZoom())
    })
    /*if(!routeUnselected()){
      putData(routesOrigin+'/'+routeId, {
        'map_data' : {
          "center_lat": getStorage('routeOptions').lat ?? defaultCenter.lat,
          "center_long": getStorage('routeOptions').lng ?? defaultCenter.lng,
          "center_zoom": getStorage('routeOptions').zoom ?? defaultCenter.zoom,
        }
      })
      .then(response =>{
        if(response.statusCode === 400){
          if(testing) console.log('Something was wrong in setMapOptions post call')
        }else{
          if(testing) console.log('The route center params were updated...')
        }
      })
    }*/

  }

  function routeUnselected(){
    let route_id = getStorage('routeId','string')
    if(testing) console.log('The route value is:'+route_id)
    return route_id == 0 || route_id === null  || route_id == '' || route_id === false
  }

  function renderRoutesSelector(){
    let empty = clientRoutes.length === 0
    var options = [{ value: '0', label: (empty ? 'Create a route...' : 'Select a route...') }]
    for(var i = 0; i < clientRoutes.length; i++){
      options.push({ value: clientRoutes[i].id.toString(), label: clientRoutes[i].name })
    }
    return (
      <div>
        <Label htmlFor='' className={'head-advisory'}>Hello {username}!</Label>
        <Select
          name="selected-route"
          className='primary'
          value={routeId}
          options={options}
          closeMenuOnSelect={true}
          style={{width: '100%', disabled: (empty ? 'disabled' : 'false')}}
          onChange={({ target: { value } }) => { loadRoute(value) }}
        >        
        </Select>
        <br/><br/>
        {routeId !== 0 && <Button style={{display: 'block'}} onClick={()=>{          
          handleEditDetails()
        }} className="btn btn-primary">Edit details</Button>}
      </div>
    )
    
  }

  function handleEditDetails(){
    if(routeId === 0){
      setAlert('If you want to edit a route, first you must select one', 'Warning!')
      return false
    }
    window.open(host+'/admin/plugins/content-manager/collectionType/application::routes.routes/'+routeId, '_self');
  }

  function getMarker(markerId){
    switch(markerId){
      case 1: return 'start-marker';      
      case 2: return 'end_marker';        
      case 3: return 'anchorage-marker'; 
      case 4: return 'camera-marker';    
      case 5: return 'restaurant-marker'; 
      case 7: return 'mylocation-marker'; 
      case 8: return 'base-marker';       
      default: return 'standar-marker';   
    }    
  }
  
  const renderInstructions = () => {
    return (
      <div className='col-sm-12 col-md-12 col-lg-12'>
        <div className='advisory-box col-sm-12 col-md-12 col-lg-12' style={{cursor: 'pointer', display:'inline'}}>
          <table style={{width:'100%'}}>
            {instructions.map((instr, index)=>{
            return  (
              <tr >
                <td>           
                  <img onClick={()=> launchOption(instr.action_class)} src={uploadOrigin+instr.icon.url} alt={instr.summary} style={{cursor: 'pointer'}}/>
                </td>
                <td>  
                  <Label> {instr.summary}</Label>
                </td>                
              </tr>
            )})}
          </table>
        </div>
      </div>
    )
  }

  function launchOption(type){
    jQuery('.mapbox-gl-draw_'+type).click()
  }

  function loadMap(){

    if (map.current) map.current.deleteAll()

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

      map.current.addControl(Draw, 'top-right');
      map.current.addControl(new MapboxGLGeocoder({
        accessToken: MapboxGL.accessToken,
        marker: false
      }), 'top-left')
      map.current.addControl(new MapboxLanguage(), 'top-left');
      map.current.addControl(new MapboxGL.FullscreenControl(), 'top-left');
      map.current.addControl(new MapboxGL.GeolocateControl(
        { positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-left'); 

      map.current.on('move', (e) => { setMapOptions() })
      map.current.on('click', (e) => { editPlace( e, Draw.getSelected() ) })

      map.current.on('draw.add',    (e)=>{ updateRoute(e, Draw.getAll()) })
      map.current.on('draw.create', (e)=>{ updateRoute(e, Draw.getAll()) })
      map.current.on('draw.update', (e)=>{ updateRoute(e, Draw.getAll()) })
      map.current.on('draw.delete', (e)=>{ updateRoute(e, Draw.getAll()) })
      map.current.on('draw.select', (e)=>{ updateRoute(e, Draw.change()) })

      map.current.resize()

    })

  }

  function editPlace(e, selected){
    if(testing) console.log('SELECTED')
    if(testing) console.log(selected)
    setElement(selected.id)
    localStorage.setItem('tmpPoint', JSON.stringify(selected.features) )
    if(selected && selected.features.length > 0){
      if(testing) console.log(placesOrigin+'?element='+selected.features[0].id)
      getData(placesOrigin+'?element='+selected.features[0].id)
      .then(data=>{
        if(data.statusCode === 400){
          if(testing) console.log('Something was wrong creating a Polygon')
        }else{
          if(testing) console.log('RECOVERED')
          if(testing) console.log(data)
          if(!data[0]) return
          resetPlace(false);
          setPlaceId(data[0].id)
          setElement(data[0].element)
          setPlaceName(data[0].name)
          setPlaceDescription(data[0].description[0].description)
          setPlaceModalStatus(true)
        }
      })
    }
  }

  function resetRouteDraw(){
    setStorage('routeId', 0, 'string')
    removeStorage('routeId')
    Draw.deleteAll()
    Draw.trash()
  }

  /*if(getStorage('routeId', 'string') > 0){
    loadRoute(getStorage('routeId', 'string'))
  }*/

  const routeEditionForm = () => {
    return (
      <div>
        <div className='row'>
          <Label htmlFor="route-name">Edit name</Label>
          <InputText
            type='text'
            name='route-name'
            value={routeName} 
            placeholder='Set the route name...'
            required={true}
            onChange={({ target: { value } }) =>{setRouteName(value)}}
          />
          <Button
            label={'Save'}
            type="submit"            
            onClick={savePlace}
          />
        </div>
        <div className='row'>
          <span style={{opacity: routeName ? 0 : 1}}>Please, set a route name...</span>
        </div>
      </div>
    )
  }

  function loadRoute(selectedRouteId){
    setIsLoading(true)
    if(selectedRouteId === 0){
      resetToCreationMode()
    }else{

      fetch(routesOrigin+'/'+selectedRouteId)
      .then((res) => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {        
        console.log(response)
        if(response){
          resetToEditonMode(response)
        }else{
          resetToCreationMode()
        }         
      })
    }
  }

  function resetToCreationMode(){
    if(testing) console.log('CREATION MODE!')    
    Draw.deleteAll()
    storeRouteMode('creation')
    resetRouteDraw()
    storeRouteId(0)
    setRouteName('')
    setRouteDescription('')
    resetPublishButton()
    flyTo(defaultCenter.lat, defaultCenter.lng, defaultCenter.zoom)
    setTimeout(function(){ setIsLoading(false)},3000)
  }

  function resetToEditonMode(response){
    if(testing) console.log('EDITION MODE!::'+response.id)
    storeRouteMode('edition')
    Draw.deleteAll()
    storeRouteId(response.id)
    setRouteName(response.name)
    storeRouteIsPublished(response.published)
    setRouteDescription(response.description[0].description)
    drawSelectedRoute(response)    
    flyTo(response.map_data.center_lat, response.map_data.center_long, response.map_data.center_zoom)
    setTimeout(function(){setIsLoading(false)},3000)
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

  function storeRouteId(id){
    setRouteId(id)
    setStorage('routeId', id, 'string')
  }

  function storeRouteMode(mode){
    setRouteMode(mode)
    setStorage('routeMode', mode, 'string')
  }

  function drawSelectedRoute(response){
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
    setRoute(selected)
  }

  function flyTo(lat, long, zoom){
    map.current.flyTo({ center:[ long, lat ], zoom: zoom })
  }

  // Saved  route operations

  function updateRoute(mapElement, data){
    console.log(mapElement)
    if( getStorage('routeMode', 'string') === 'edition'){     
      editionModeAction(mapElement)
    }else{
      creationModeAction(mapElement)
    }
  }  

  function editionModeAction(mapElement){
    if(!routeUnselected()){
      let route = getStorage('routeId', 'string')      
      if(testing) console.log('Edition route mode '+route+' action!')
      if(showChangeAdvisory()){  
        if(mapElement.action !== undefined){  
          if(mapElement.action === 'change_coordinates' || mapElement.action === 'move'){
            updateRouteElement(mapElement)
          }else{
            if(testing) console.log('Uncontrolled action :// !!!'+mapElement.action)
          }  
        }else{          
          if(mapElement.features[0].geometry.type === 'LineString'){
            let storedLinesAmount = checkFeaturesAmount(Route, 'LineString')
            if(storedLinesAmount > 1){
              setAlert('You cannot add more than one route. Delete one!')
              return false
            }  
          }
          switch(mapElement.type){
            case 'draw.create': createMapElement(mapElement); break;
            case 'draw.update': updateRouteElement(mapElement); break;
            case 'draw.delete': deleteMapElement(mapElement); break;
            default: if(testing) console.log('Uncontrolled action :// !!!'+mapElement.action)
          }        
        }  
      }
    }  
  }

  function creationModeAction(mapElement){

    if(routeUnselected()){

      if(testing) console.log('Creation mode map action!')
      
      if(showCreationAdvisory()){

        if(mapElement.type === 'draw.create'){

          var name          = 'New route'
          //var label         = (getStorage('routeLabel', 'string')) ? getStorage('routeLabel', 'string') : 'New route label'
          var description   = (getStorage('routeDescription', 'string')) ? getStorage('routeDescription', 'string') : 'New route description...'
          var isLineString  = mapElement.features[0].geometry.type === 'LineString'
          var type          = mapElement.features[0].geometry.type

          postData(routesOrigin, {
            "name": name,
            "creator": user_id,
            "element" : mapElement.features[0].id,
            "description": [{
              "language": 1,
              "label": name,//label,
              "description": description
            }],
            'map_data':  setMapData(isLineString ? mapElement.features[0] : '')
          })
          .then(res => {

            if(res.statusCode === 400){
              if(testing) console.log('Something was wrong with updateRoute creation mode action...')
            }else{
              
              if(testing) console.log('You have created the element id '+res.map_data.data.id+' as route with the id "'+res.id+'"')

              resetToEditonMode(res)
              storeChangeAdvisory(true)

              if(isLineString){

                // Setting main inputs ;)
                if(testing) console.log('The element is a LineString')
                setRouteId(res.id)
                setRouteName(name)
                setRouteDescription(description)  
                setPublishButtonStatus(!true)
                storeLastChange()
                
                setRoute(res.map_data.data)
                setAlert('You have created the new route!!', 'GRETTINGS!', 
                'Now is the moment to create Place or Polygons, \nYou must to edit the Route and each Place rich contents to have the best result.')

              }else{

                // This blocks my fist idea to be able to create all from a pointer or a polygon, because it can cause logic problems....
                setAlert('Please, trace a route first!', 'WARNING!')
                return

                if(type === 'Point'){
                  if(testing) console.log('The element is a Point')
                  //XXX: The point requires a modal to save the textual data
                  resetPlace(true);
                  setStorage('tmpPoint', mapElement.features[0], 'json')    
                }else if(type === 'Polygon'){
                  if(testing) console.log('The element is a Polygon')
                  postPolygon(mapElement.features[0], newId)    
                }

              }

              setPublishable()

            }

          })
        
        }           

      }else{
        if(testing) console.log('Burp...')
      }       

    }

  }

  function contentGrettings(){
    return <Link to={host+"/admin/plugins/content-manager/collectionType/application::routes.routes/"+routeId} target="_self" className="btn btn-link">Edit details</Link>
  }

  function resetPlace(status){
    setPlaceModalStatus(status)
    if(!status){
      setPlaceId(0)
      setPlaceName('')
      setPlaceLabel('')
      setPlaceDescription('')
    }
  }

  function updateRouteExtra(){
    if(!routeUnselected()){
      setIsLoading(true)
      var route = getStorage('routeId', 'string')
      if(route){
        putData(routesOrigin+'/'+route, {
          "name" : routeName,
          "description":[{
            "language" : 1,
            "label" : routeName,
            "description" : routeDescription
          }]
        })
        .then()
      }
      setIsLoading(false)
    }
  }

  function createMapElement(mapElement){
    let route = parseInt(getStorage('routeId', 'string'))
    let type = mapElement.features[0].geometry.type
    if(type === 'Polygon'){
      postData(polygonsOrigin, {
        "name": 'Polygon route '+mapElement.features[0].id,
        "creator": user_id,
        "parent_route": route,
        "element": mapElement.features[0].id,
        'map_data': setMapData(mapElement.features[0])
      })
      .then(result => {
        if(result.statusCode === 400){
          if(testing) console.log('Something was wrong creating a Polygon')
        }else{
          if(testing) console.log('The Polygon '+mapElement.features[0].id+' with the id "'+result.id+'" to the route "'+route+'" was succesfully created!!')
        }
      })
    }else if(type === 'Point'){
      // XXX: Call to a Places modal...
      resetPlace(true);
      setStorage('tmpPoint', mapElement.features[0], 'json')
    }
  }

  function setMapData(features){
    let routeOptions = getStorage('routeOptions')
    var lat = defaultCenter.lat
    var lng = defaultCenter.lng
    var zoom = defaultCenter.zoom
    if(routeOptions){
      lat = getStorage('routeOptions').lat
      lng = getStorage('routeOptions').lng
      zoom = getStorage('routeOptions').zoom
    }
    return {
      "center_lat": lat,
      "center_long": lng,
      "center_zoom": zoom,
      "data": features,
    }
  }

  function deleteMapElement(mapElement){

    if(routeIsPublished){
      setAlert('You cannot delete an element while a map is published.\n\nPlease, ubpublish before remove elements')
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
      if(!window.confirm('ALERT:\nIf you delete this Place you will lose all the related content.\n\nDo you want to continue?')){
        return false
      }
    }

    if(type==='LineString'){
      if(!window.confirm('ALERT:\nIf you delete this Route you will must to put a new one.\n\nConsider first to edit the existent one.\n\nDo you want to continue?')){
        return false
      }
    }
    
    let getUrl = url+'?element='+mapElement.features[0].id
    getData(getUrl).then(response=>{
      let delUrl = url+'/'+response[0].id
      deleteData(delUrl)
      .then(data => {
        if(data.statusCode === 400){
          if(testing) console.log('Something was wrong deleting a route element')
        }else{
          Draw.delete()
          Draw.trash()
          if(testing) console.log('The MapElement '+mapElement.features[0].id+' with the id "'+data.id+'" was succesfully deleted!!')
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
    let urlGet = url+'?element='+id
    getData(urlGet)
    .then(response => {
      if(response.statusCode === 400){
        if(testing) console.log('Something was wrong with updateRouteElement action...')
      }else{
        if(testing) console.log('The updateRouteElement first response')
        if(testing) console.log(response)

        if(testing) console.log('You got the desired element '+id)
        var  putUrl = url+'/'+response[0].id

        putData(putUrl, { 'map_data' : setMapData(mapElement.features[0]) })
        .then(data => {
          if(data.statusCode === 400){
            if(testing) console.log('Something was wrong with updateRouteElement action...')
          }else{
            var res = (type==='LineString') ? id : id
            if(testing) console.log('The Element '+id+' with the id "'+res+'" was succesfully updated!!')
          }
        })
      }
    })
  }

  function updatePlace(){
    let url = placesOrigin
    let urlGet = url+'?element='+element
    getData(urlGet)
    .then(response => {

      if(response.statusCode === 400){
        if(testing) console.log('Something was wrong with updateRouteElement action...')
      }else{
        putData(placesOrigin+'/'+response.id, {
          "name": placeName,
          "description": [{
            "language": 1,
            "label": placeName,// 'New route label',
            "description": placeDescription
          }],
          'map_data': setMapData(placeFeatures)
        })
        .then(data => {
          if(data.statusCode === 400){
            if(testing) console.log('Something was wrong with creating a Place...')
          }else{
            if(testing) console.log('Place '+placeFeatures.id+' posted successful ;)')
          }
        })
      }

    })
  }

  function updatePlaceTexts(){
    var url = placesOrigin
    var urlGet = url+'?element='+element
    console.log('url_get_element', urlGet)
    getData(urlGet)
    .then(response => {
      if(response.statusCode === 400){
        if(testing) console.log('Something was wrong with updateRouteElement action...')
      }else{
        setPlaceId(response[0].id)
        putData(placesOrigin+'/'+response[0].id, {
          "name": placeName,
          "description": [{
            "language": 1,
            "label": placeName,// 'New route label',
            "description": placeDescription
          }],
        })
        .then(data => {
          if(data.statusCode === 400){
            if(testing) console.log('Something was wrong with creating a Place...')
          }else{
            if(testing) console.log('Place '+placeId+' posted successful ;)')
            setPlaceModalStatus(false)
          }
        })
      }

    })
  }


  function savePlace(event){
    event.preventDefault()
    var mapElement = getStorage('tmpPoint', 'json')
    if(mapElement !== ''){//Undo
      if(placeName === '' && placeDescription === ''){//&& placeLabel === '' 
        setAlert('You must to put data in the placename and description')
      }else{
        postPlace(mapElement) 
      }
    }else{
      setAlert('Theres is not data to save about the place');
      Draw.trash()  
      setPlaceModalStatus(false)    
    }    
  }

  function postPlace(placeFeatures){
    if(!placeFeatures) return false
    var route = getStorage('routeId','string')
    postData(placesOrigin, {
      "name": placeName,
      "creator": user_id,
      "parent_route" : route,
      "element": placeFeatures.id,
      "description": [{
        "language": 1,
        "label": placeName,// 'New route label',
        "description": placeDescription
      }],
      'map_data': setMapData(placeFeatures)
    })
    .then(data => {
      if(data.statusCode === 400){
        if(testing) console.log('Something was wrong with creating a Place...')
      }else{
        if(testing) console.log('Place '+placeFeatures.id+' posted successful ;)')
        resetPlace(false)
      }
    })
  }

  function postPolygon(polygonFeatures, i){
    var route = getStorage('routeId','string')
    postData(polygonsOrigin, {
      "name": routeName+' Warning '+route+'-'+i.toString(),
      "creator": user_id,
      "parent_route" : route,      
      "element": polygonFeatures.id,
      'map_data': setMapData(polygonFeatures)
    })
    .then(data => {
      if(data.statusCode === 400){
        if(testing) console.log('Something was wrong creating a Polygon')
      }else{
        if(testing) console.log('Polygon '+data.id+' posted successful ;)') 
      }
    })    
  }

  // For Publish button

  function togglePublished(){
    var route = getStorage('routeId','string')
    if(testing) console.log('togglePublished: Is published: '+routeIsPublished)
    if(routeIsPublished){
      if(testing) console.log('Unpublishing??')
      if(window.confirm('ALERT:\nIf you continue the route will disapear from the app after next app data upgrade\n\nDo you wanna unpublish the route?')){         
        setRouteIsPublished(false)     
      }else{
        return false
      }
    }else{
      
      if(validatePublishing()){
        if(testing) console.log('Publishing??')
        if(window.confirm('ALERT:\nIf you continue the route will appear from the app after next app data upgrade\n\nDo you wanna publish the route?')){         
          setRouteIsPublished(true)         
        }else{
          return false
        }
      }else{
        return false
      }
    }    

    putData(routesOrigin+'/'+route, { published: ! routeIsPublished })        
    .then(data => {
      let action = ( ( !  routeIsPublished ) ? 'published' : 'unpublished' )
      setAlert('The Route "'+routeName+'" was succesfully '+action+'!')
    })
  }

  function validatePublishing() {

    if(testing) console.log('validatePublishing attempt... is Route! ;))')
    var route = getStorage('routeId','string')
    getData(routesOrigin+'/'+route)
    .then(result=>{

     /* Only if routes have more data... 
      if(result.description.length === ''){
        launchToast('To publish a good quality Route, please set at least a description...')
        return false
      }else if(result.images.length === 0){
        launchToast('To publish a good quality Route, please set at least a representative Image to your route...')
        return false
      }else*/ 
      
      if(!result.places.length){
        launchToast('To publish a good quality Route, please set at least a Place...')
        return false
      }else{
        for( var i = 0; i < result.places.length; i++){
          if(! result.places[i].description || 
             ! result.places[i].images){
            launchToast('Please set your Place images, markers and descriptions before publish the Route...')
            return false
          }
        }
      }     

    })

    return true    

  }

  function resetPublishButton(){
    console.log('resetPublishButton')
    setPublishButtonStatus(false)
    setPublishButtonLabel(createText)
  }

  function setPublishable(){
    console.log('setPublishable')
    setPublishButtonStatus(true)
    setPublishButtonLabel('Publish')
    setPublishButtonColor('primary')
  }

  function setUnpublishable(){
    console.log('setUnpublishable')
    setPublishButtonStatus(true)
    setPublishButtonLabel('Unpublish')
    setPublishButtonColor('success')
  }

  function launchToast(message, doContinue=false, label){
    setAlert(message, label)
    return doContinue
  }

  // Toggling advisements
  
  function showChangeAdvisory(){
    let adv = getStorage('routeChangesAdvisory','string')
    if(!adv){
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
    let adv = getStorage('routeCreationAdvisory','string')
    if(!adv){   
      if(window.confirm('Do you want to create a new route?')){
        storeCreationAdvisory(Date.now())
        return true
      }else{
        Draw.trash()
        return false
      }
    }
    return true
  }

  // For Advisories

  function storeCreationAdvisory(date){
    console.log('created')
    setRouteCreationAdvisory(date)
    setStorage('routeCreationAdvisory', date, 'string')
  }

  function storeChangeAdvisory(date){
    setRouteChangesAdvisory(date)
    setStorage('routeChangesAdvisory', date, 'string')
  }

  function deleteRoute(){
    if(window.confirm('ALERT:\nIf you delete the route this will delete on cascade all the related content.\n\nDo you want continue??')){
      getData(routesOrigin+'/'+routeId)
      .then(result=>{
        deleteData(routesOrigin+'/'+routeId)
        .then(result2=>{
          if(result2.statusCode === 400){
            if(testing) console.log('Something was wrong deleting places on route delete cascade')
            return false
          }else{
            resetToCreationMode()
            for(var i = 0; i < result.places.length; i++ ){
              deleteData(placesOrigin+'/'+result.places[i].id).then(result3=>{
                if(result3.statusCode === 400){
                  if(testing) console.log('Something was wrong deleting places on route delete cascade')
                }else{
                  if(testing) console.log('The Place with  was succesfully deleted')                
                }
              })
            }
            for(var ii = 0; ii < result.polygons.length; ii++ ){
              deleteData(polygonsOrigin+'/'+result.polygons[ii].id).then(result4=>{
                if(result4.statusCode === 400){
                  if(testing) console.log('Something was wrong deleting places on route delete cascade')
                }else{
                  if(testing) console.log('The Polygon  was succesfully deleted')                
                }
              })
            }
            storeLastChange()
            return true
          }
        })        
      })
    }else{
      return false
    }
  }

  // For places

  function cancelPlaceEdition(){
    var mapElement = getStorage('tmpPoint', 'json')
    if(mapElement){
      if( placeId === 0){
        if(testing) console.log('You are aborting to save the Place')
        Draw.delete(mapElement.id)
      }else{
        resetPlace(false)
      }
    }else{
      resetPlace(false)
    }
  }

  function editPlaceModal(){
    return (
      <Modal
        isOpen={placeModalStatus}
        style={placesModalStyle}
        contentLabel="Save your place"
      >
        <div className='table'>
          <div className='row'>
            <Label htmlFor="place-name"><h2>Set the place data</h2></Label>
          </div>
          <div className='row'>
            <Label htmlFor="place-name">Edit Place Name</Label>
            <InputText
              type='text'
              name='place-name'
              className='my-input'
              value={placeName} 
              placeholder='Set here the Place Name for this Route...'
              required={true}
              style={{width: '171%'}}
              onChange={({ target: { value } }) =>{setPlaceName(value)}}
            />
          </div>
          <div className='row'>
            <span style={{color: placeName ? 'white' : 'red'}}>Please, set a place name...</span>
          </div>
          <div className='row'>
            <Label htmlFor="place-description">Description</Label>
            <Textarea
              name="route-description"
              className={'description'}
              placeholder='Set here the description for this place...'
              required={true}
              style={{maxHeight: '261px', height: '261px'}}
              onChange={({ target: { value } }) =>{setPlaceDescription(value)}}
              value={placeDescription}
            />
          </div>
          <div className='row'>
            <span style={{color: placeDescription ? 'white' : 'red'}}>Please, set a place label...</span> 
          </div>
          <div className='row'>
            <LoadingBar style={{width:'100%', opacity: isLoading ? 99 : 0}}/>
            <div className='col-6' style={{textAlign: 'center', marginTop: '20px'}}>
              <Button
                label={'Save'}
                type="submit"            
                onClick={placeId ? updatePlaceTexts : savePlace}
                className='my-button'
              />
            </div>
            <div className='col-6' style={{textAlign: 'center', marginTop: '20px'}}>
              <Button
                label={'Cancel'}            
                color={'delete'}
                onClick={cancelPlaceEdition}
                className='my-button'
              />
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  function setAlert(message, label='', header = null){
    if(!message) return
    setAlertModalMessage(message)
    setAlertModalLabel(label)
    setAlertModalStatus(true)
    if(typeof header === 'string'){
      setAlertContent(header)
    }
  }

  function closeAlert(message){
    setAlertModalStatus(false)
  }

  function alertModal(){
    return (
      <Modal
        isOpen={alertModalStatus}
        contentLabel={alertModalMessage}
        style={alertModalStyle}
        shouldCloseOnOverlayClick={true}
      >
        <div style={{minHeight :'90%', textAlign: 'center'}}>
          <Label htmlFor="input" clasName={'labelAlert'} style={{color: 'white', fontWeight: 'bold', fontSize: '1.2rem'}} message={alertModalLabel}/>
          <Label htmlFor="input" message={alertModalMessage} />
          <div>{alertContent}</div>
        </div> 
        <Button
          label={'OK'}            
          color={publishButtonColor}
          onClick={closeAlert}
        />
      </Modal>
    )
  }

  return (
    <div>
      <div className="row">
        <div className="col-sm-12 col-md-9 col-lg-9">
          <div ref={mapContainer} className="map-container" />
          <div className="nav-bar">Longitude: {focusLng.toFixed(4)} • Latitude: {focusLat.toFixed(4)} • Zoom: {Math.round(focusZoom)}</div>
        </div>
        <div className="col-sm-12 col-md-3 col-lg-3">
          <div className='row'>
            <div className='col-6' style={{textAlign: 'center'}}>
              <Button
                label={'Delete'}            
                color={'delete'}
                disabled={!publishButtonStatus}
                visible={true}
                className='my-button'
                onClick={ (e) => {deleteRoute()}}
              />
            </div>
            <div className='col-6' style={{textAlign: 'center'}}>
              <Button
                label={publishButtonLabel}            
                color={publishButtonColor}
                disabled={!publishButtonStatus}
                visible={true}
                className='my-button'
                onClick={ (e) => {togglePublished()}}
              />
            </div>
          </div>
          <br/>  
          <div className='col-sm-12 col-md-12 col-lg-12'>
            <div className='row'>
              {renderRoutesSelector()}
              {renderInstructions()}
              <LoadingBar style={{width:'100%', opacity: isLoading ? 99 : 0}}/>
            </div>
          </div>
          <div className='col-sm-12 col-md-12 col-lg-12'>
            <div className='row route-creator'>
              <Label htmlFor="route-description">Description</Label>
              <Textarea
                name="route-description"
                value={routeDescription}
                className={'description'}
                placeholder='Set a description...'
                required={true}
                style={{height: '450px', maxHeight: '450px', minHeight: '450px'}}
                onChange={({ target: { value } }) =>{setRouteDescription(value)}}
              />
              <span style={{color: routeDescription ? 'white' : 'red'}}>Please, set a route description...</span>
            </div>
          </div>
        </div>
      </div>
      {editPlaceModal()}
      {alertModal()}
    </div>
  )

}

export default memo(HomePage)