import React, { memo, useRef, useEffect, useState } from 'react';
import { Select } from '@buffetjs/core';
import Modal from 'react-modal';
import Button from 'react-bootstrap/Button';
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder';
import MapboxGLDraw from "@mapbox/mapbox-gl-draw";
import MapboxGL from 'mapbox-gl';
import turf from '@turf/turf';

//import './index.css';
//import 'bootstrap/dist/css/bootstrap.min.css';
//import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import './index.css'

MapboxGL.accessToken = "pk.eyJ1IjoiZHJ1bGxhbiIsImEiOiJja2l4eDBpNWUxOTJtMnRuejE1YWYyYThzIn0.y7nuRLnfl72qFp2Rq06Wlg"

const routesOrigin = 'http://161.97.167.92:1337/routes'
const polygonsOrigin = 'http://161.97.167.92:1337/polygons'
const placesOrigin = 'http://161.97.167.92:1337/my-places'
const mapTile = 'mapbox://styles/mapbox/streets-v11'
const user_id = 12;

const messages = {
  chooseRoute : 'Choose a route...'
}

const keys = {
  chooseRoute : 'Choose a route...'
}

const placesLimit = 5;

var bounds = [//TODO: automati
  [-25, 53], // Southwest coordinates
  [58, 2] // Northeast coordinates
];

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


const HomePage = () => {  

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(2.68);
  const [lat, setLat] = useState(39.79);
  const [zoom, setZoom] = useState(3);
  
  const Draw = new MapboxGLDraw({
    displayControlsDefault: true,
    controls: {
      polygon: true,
      polyline: true,
      marker: true,
      trash: true
    }
  });
  
  const [clientRoutes, setClientRoutes] = useState([]);
  useEffect(() => { 
    fetch(routesOrigin+'?created_by='+user_id)
    .then((res) => res.json())
    .then(setClientRoutes); 
  },[user_id]);
  
  /*
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
  */
  //let polygonsCount = clientPolygons.length;

  //console.log(polygonsCount)


  useEffect(() => {
    loadMap()
  });

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

      map.current.addControl(Draw, 'top-right');
      map.current.resize()      

      map.current.on('move', () => {
        setLng(map.current.getCenter().lng.toFixed(4));
        setLat(map.current.getCenter().lat.toFixed(4));
        setZoom(map.current.getZoom().toFixed(2));
      });  

      map.current.addControl(new MapboxGL.FullscreenControl());
      map.current.addControl(new MapboxGL.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
      }));

      map.current.addControl(new MapboxGLGeocoder({
        accessToken: MapboxGL.accessToken,
        marker: false
      }));

    });

    const updateDrawArea = (e) => { setStorage('currentMapData', Draw.getAll()) }  
    map.current.on('draw.update', updateDrawArea);
    
    const createDrawArea = (e) => { setStorage('currentMapData', Draw.getAll()) }
    map.current.on('draw.create', createDrawArea);
    
    const deleteDrawArea = (e) => { setStorage('currentMapData', Draw.getAll()) }  
    map.current.on('draw.delete', deleteDrawArea);
    
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

  function viewStored(key, type='json'){
    console.log(JSON.parse(localStorage.getItem(key)))
    return true;
  }

  function launchToast(message, doContinue=false){
    alert(message);
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

  function renderRoutesSelector(routes){
    var options = [
      { value: '', label: messages.chooseRoute }
    ]
    for(var i = 0; i < routes.length; i++){
      options.push({ value: routes[i].id.toString(), label: routes[i].name })
    }
    return <Select name="route" options={options}/>
  }

  var subtitle;

  const [modalIsOpen,setIsOpen] = React.useState(false);
  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    subtitle.style.color = '#f00';
  }

  function closeModal(){
    setIsOpen(false);
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


  function getSaveRouteModal(){
    return <Modal
      isOpen={modalIsOpen}
      onAfterOpen={afterOpenModal}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Example Modal"
    >
      <h2 ref={_subtitle => (subtitle = _subtitle)}>Save your route</h2>
      <form noValidate onSubmit={setRouteName}>
        <label>Route Name</label>
        <input type='text'  name='route-name'/>
        <label>Description</label>
        <input type='text'  name='route-name'/>
        <button onClick={closeModal}>Cancel</button>
        <button onClick={saveRoute}>Save</button>
      </form>
    </Modal>
  }

  function saveRoute(){

    // Analizing the data to save :)

      let storedRoute = getStorage('currentMapData');
      if(storedRoute){

        // 1.- Only a Linestring is allowed!! Not two      

          let storedLinesAmount = checkFeaturesAmount(storedRoute, 'LineString');
          if(storedLinesAmount > 1 ){
            if(!launchToast('You are unable to draw two lines for a route. You must delete '+(storedLinesAmount-1)+' lines')) return false
          }else if(storedLinesAmount === 0){
            if(!launchToast('You must draw one route, at least')) return false
          }          

        // 2.- Now you will set the first location (meeting-point)

          let storedPointsAmount = checkFeaturesAmount(storedRoute, 'Point');
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

      launchToast("You gonna save the route!!!!")

      processSave(storedRoute)     

  }

  function postRoute(key, label="Your Route", description="Your route description..."){

    let postRouteData = {
      "name": label,
      "creator": user_id,
      "description": [
        {
          "language": 1,
          "label": label,
          "description": description
        }
      ],
      "map_data" : {
        "data" : getStorage('currentMapData')
      }
    }
    
    postData('http://161.97.167.92:1337/routes', postRouteData )
    .then(data => {
      console.log('Route was posted successful ;)')
      setStorage(key, data )
    });

    let savedKey = getStorage(key)
    return savedKey.id

  }

  function postPlace(parent, key, name="Your Place", description="Your place description...", placeFeatures, markerType=3){

    let postPlaceData = {
      "name": name,
      "creator": user_id,
      "parent_route" : parent,
      "description": [
        {
          "language": 1,
          "label": name,
          "description": description
        }
      ],
      "map_data": {
        "center_lat": 0,
        "center_long": 0,
        "center_zoom": 0,
        "data": JSON.stringify(placeFeatures)
      }
    }    
    
    postData('http://161.97.167.92:1337/my-places', postPlaceData )
    .then(data => {
      console.log('Place '+key+' posted successful ;)')
      setStorage(key, data )
    });

    let savedKey = getStorage(key)
    return true

  }

  function postPolygon(parent, key, name="Your Polygon", description="Your place description...", polygonFeatures){

    let postRouteData = {
      "name": name,
      "creator": user_id,
      "parent_route" : parent,
      "map_data": {
        "id": "string",
        "center_lat": 0,
        "center_long": 0,
        "center_zoom": 0,
        "data": JSON.stringify(polygonFeatures)
      },
    }
    
    postData('http://161.97.167.92:1337/polygons', postRouteData )
    .then(data => {
      console.log('Polygon '+key+' posted successful ;)')
      setStorage(key, data)
    });

    let savedKey = getStorage(key)

    return false;

  }

  function processSave(storedRoute){
    let routeId = postRoute('savedRoute', "New Route", "Your new route first description...")
    if(routeId){
      for(var i=0; i < storedRoute.features.length; i++){
        if(storedRoute.features[i].geometry.type === 'Point'){
          postPlace(routeId, storedRoute.features[i].id, "Your Place", "Your place description...", storedRoute.features[i])
        }else if(storedRoute.features[i].geometry.type === 'Polygon'){
          postPolygon(routeId, storedRoute.features[i].id, "Your Polygon", "Your place description...", storedRoute.features[i])
        }
      }
    }
  }

  const [routeName, setRouteName] = useState('')

  return (
    <>
      <div className="row">
        <div className="col-lg-8 col-md-12">
            <div>
              <div>
                <div className="sidebar">
                  Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
                </div>
                {renderRoutesSelector(clientRoutes)}
                <button>Edit route data</button><button>Editing route</button> 
                <div className="calculation-box">
                  <p>Draw a polygon using the draw tools.</p>
                  <div id="calculated-area"></div>
                </div>
                <div ref={mapContainer} className="map-container" />
              </div>
            </div>
        </div>
        <div className="col-md-12 col-lg-4">
          {getSaveRouteModal()}       
          <button onClick={viewStored('currentMapData')}>[View storage]</button>   
          <button onClick={saveRoute}>Save Route!!</button>
        </div>
      </div>
    </>
  );

};

export default memo(HomePage)