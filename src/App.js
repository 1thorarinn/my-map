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

const dataOrigin = 'http://161.97.167.92:1337/routes'
const mapTile = 'mapbox://styles/mapbox/streets-v11'
const user_id = 12;


var bounds = [
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
  const [clientRoutes, setClientRoutes] = useState([]);

  const Draw = new MapboxGLDraw({
    displayControlsDefault: true,
    controls: {
      polygon: true,
      polyline: true,
      marker: true,
      trash: true
    }
  });

  
  useEffect(() => { 
    fetch(dataOrigin+'?created_by='+user_id)
    .then((res) => res.json())
    .then(setClientRoutes); 
  },[user_id]);


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
        accessToken: MapboxGL.accessToken
      }));

    });

    const updateDrawArea = (e) => { parseMapContent(e, Draw.getAll()) }  
    map.current.on('draw.update', updateDrawArea);
    
    const createDrawArea = (e) => { parseMapContent(e, Draw.getAll()) }
    map.current.on('draw.create', createDrawArea);
    
    const deleteDrawArea = (e) => { parseMapContent(e, Draw.getAll()) }  
    map.current.on('draw.delete', deleteDrawArea);
    
  }

  function parseMapContent(event, data){
    //console.log(event)
    localStorage.setItem('userNewRoute', JSON.stringify(data))
  }



  function checkLineExist(e){
    console.log(e)
    for(var i=0; i < e.features.length; i++){
      if( e.features[i].geometry.type === 'LineString') return true
    }
    return false
  }

  function renderRoutesSelector(routes){
    var options = [
      { value: '', label: 'Choose a route...' }
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
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
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

  function viewStored(){
    console.log(JSON.parse(localStorage.getItem('userNewRoute')))
  }

  function getStored(){
    return JSON.parse(localStorage.getItem('userNewRoute'))
  }

  function saveRoute(){

    // Preparing data to be saved

    // 1.- Only a Linestring is allowed!! Not two

    alert('pinga')

    postData('http://161.97.167.92:1337/routes', {
        "description": [
          {
              "label": "sdfgsd",
              "language": 1,
              "description": "sdfgsdg"
          }
        ],
        "name": "ghxfghfsdhsdfg",
        "creator": user_id,
        "map_data" : {
          "data" : getStored()
        }

      }
    )
    .then(data => {
      console.log(data); // JSON data parsed by `data.json()` call
    });

    closeModal()  

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
                <div class="calculation-box">
                  <p>Draw a polygon using the draw tools.</p>
                  <div id="calculated-area"></div>
                </div>
                <div ref={mapContainer} className="map-container" />
              </div>
            </div>
        </div>
        <div className="col-md-12 col-lg-4">
          {getSaveRouteModal()}       
          <button onClick={viewStored}>[View storage]</button>   
          <button onClick={saveRoute}>Save Route!!</button>
        </div>
      </div>
    </>
  );

};

export default memo(HomePage)