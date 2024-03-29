/* eslint-disable */
import React, { useRef, useState, useEffect, memo, useCallback, useMemo, Link } from 'react';

import { Select, Button, InputText, Textarea, Label } from '@buffetjs/core'
import { Header } from '@buffetjs/custom'

import QRCode from 'qrcode.react'
import Modal from 'react-modal'
import Slider from 'react-slick';

import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'react-tabs/style/react-tabs.css'
import MapboxGL, { Map, FullscreenControl, GeolocateControl, accessToken } from 'mapbox-gl'
import jQuery from 'jquery'

import routeIcon from './routeIcon.png'
import placeIcon from './placeIcon.png'
import polygonIcon from './polygonIcon.png'
import dropIcon from './dropIcon.png'

// BuffetJS
import { LoadingBar } from '@buffetjs/styles'

// Fontawsome...
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { setStorage, getStorage, getRouteType, alertModalStyle, getData, Draw, placesModalStyle, putData, deleteData, messages, removeStorage, checkFeaturesAmount, postData, makeId } from './map-utils.js';
import { Toast } from 'bootstrap'



import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader
import { Carousel } from 'react-responsive-carousel'
import './index.css'

MapboxGL.accessToken = 'pk.eyJ1IjoiZHJ1bGxhbiIsImEiOiJja2l4eDBpNWUxOTJtMnRuejE1YWYyYThzIn0.y7nuRLnfl72qFp2Rq06Wlg'
const MapboxLanguage = require('@mapbox/mapbox-gl-language')

const testing = true

const host = 'https://cms.hoponboard.eu'

const defSelected = { type: 'FeatureCollection', features: [] }

const mapBoxDetails = {

  defCenter: {
    lat: 50.79,
    lng: 16.68,
    zoom: 3
  },

  tile: 'mapbox://styles/mapbox/streets-v11?optimize=true',

  style: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    minHeight: '1000px'
  },

  MapboxGLGeocoder: {
    accessToken: MapboxGL.accessToken,
    marker: false
  },

  geolocator: {
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: false
  }

}

const HomePage = () => {

  // MAIN
  localStorage.setItem('STRAPI_UPDATE_NOTIF', true)

  // ABOUT CLIENT!
  const username = 'asdfas'//get(auth.getUserInfo(), 'firstname', '')  
  const user_id = 13 //get(auth.getUserInfo(), 'id', '')

  // REFERENCES
  const maparea = useRef(null)

  // MAP VIEWPORT STATE
  const [isLoading, setIsLoading] = useState(false)

  // ROUTES
  const [route, setRoute] = useState() // The selected route content
  const [routeId, setRouteId] = useState()
  const [place, setPlace] = useState()
  const [routes, setRoutes] = useState([]) // The loaded routes content related with this client...  
  const [center, setCenter] = useState() // Is the calculated center, related with the routes created
  const [qrUrl, setQrUrl] = useState(null) // QRCode for access this client ;)

  // New Place data
  const [alertModalStatus, setAlertModalStatus] = useState(false)
  const [alertModalMessage, setAlertModalMessage] = useState('')
  const [alertModalLabel, setAlertModalLabel] = useState('')
  const [alertContent, setAlertContent] = useState(null)  
  const [placeId, setPlaceId] = useState(0)
  const [placeName, setPlaceName] = useState('')
  const [placeLabel, setPlaceLabel] = useState('')
  const [placeDescription, setPlaceDescription] = useState('')
  const [placeModalStatus, setPlaceModalStatus] = useState(false)

  const [routeMarkers, setRouteMarkers] = useState([])

  // EDITOR
  const [mode, setMode] = useState()
  const [focus, setFocus] = useState(mapBoxDetails.defCenter)

  const [markers, setMarkers] = useState(null)
  
  // Buttons
  const [button1, setButton1] = useState({ visible: false })
  const [button2, setButton2] = useState({ visible: false })
  const [instructions, setInstructions] = useState()
  //const [button3, setButton3] = useState()
    

  // OTHERS

  if (typeof (window) !== 'undefined') { Modal.setAppElement('body') }

  let init = () => {

    // Get required data
    instr.init()
    map.getApiMarkers()

    // Init map and routes panel
    map.init()
    myRoutes.init()

    // Set view mode
    modes.view()

    if (!user_id) history.go(0)
    localStorage.setItem('user_id', user_id)

  }

  let instr = {

    init: async () => fetch(host + '/instructions').then((res) => res.json()).then(setInstructions),

    render: () =>
      <div className='advisory-box'>
        <ul>
          {instructions && instructions.map((instr, index) => {
            return <li key={'route-' + index} style={{ cursor: 'pointer' }} onClick={() => drawer.launchOption(instr.action_class)} >
              <Label htmlFor='' style={{ cursor: 'pointer' }} className={'advisory'} >
                <img src={host + instr.icon.url} style={{ cursor: 'pointer' }} alt='' />
                <span>
                  {instr.translations[0].label}
                </span>
                {/*<div className="img-wrapper" onClick={()=>{ console.log('.'+instr.action_class)}}>
                    <svg viewport=" 0 0 7 5" width="7" height="5" xmlns="http://www.w3.org/2000/svg"><path d="M0 .469c0 .127.043.237.13.33l3.062 3.28a.407.407 0 0 0 .616 0L6.87.8A.467.467 0 0 0 7 .468a.467.467 0 0 0-.13-.33A.407.407 0 0 0 6.563 0H.438A.407.407 0 0 0 .13.14.467.467 0 0 0 0 .468z" fill-rule="nonzero" fill="#333740"></path></svg>
                  </div>*/}
              </Label>
              <div style={{ display: 'none' }} className={instr.action_class}>{instr.translations[0].description}</div>
            </li>
          })}
        </ul>
      </div>,

  }

  let render = {

    // Render left panel
    leftPan: () =>
      <div>
        <div ref={maparea} className='map-container' />
        <div className='nav-bar'>
          Lat: {focus.lat.toFixed(2)} • Lng: {focus.lng.toFixed(2)} • Zoom: {Math.round(focus.zoom)}
        </div>
      </div>,

    // Render right panel
    rightPan: () =>
      <div>
        <div className='row'>
          <div className='col-6' style={{ textAlign: 'center' }}><Button {...button1} /></div>
          <div className='col-6' style={{ textAlign: 'center' }}><Button {...button2} /></div>
        </div>

        <div className='row'>
          <div className='col-sm-12 col-md-12 col-lg-12'>
            {render.routesSelector(routes)}
            {render.instructions()}
            <LoadingBar style={{ width: '100%', opacity: isLoading ? 99 : 0 }} />
          </div>
        </div>

        <div className='row'>
          <div className='col-sm-12 col-md-12 col-lg-12' style={{ textAlign: 'center' }}>
            {qrUrl && <QRCode value={qrUrl} />}
            <br /><br /><br /><br />
            <div className='nav-bar'>
              • Mode: {mode} • Route: {routeId}
            </div>
          </div>
        </div>

        {/* 
             <div className='col-12'>
                <div className='row route-creator'>
                  <Label htmlFor='route-description'>Description</Label>
                  <Textarea
                    name='route-description'
                    value={routeDescription}
                    className={'description'}
                    placeholder='Set a description...'
                    required={true}
                    style={{ height: '450px', maxHeight: '450px', minHeight: '450px' }}
                    onChange={({ target: { value } }) => { setRouteDescription(value) }}
                  />
                  <span style={{ color: routeDescription ? 'white' : 'red' }}>Please, set a route description...</span>
                </div>
              </div>
            </div>
            {myRoutes.place.editModal()}
            {alertModal()}
          */}

      </div>,

    routesSelector: (routes) =>
      <div>
        {routes && <div>
          {/*<Label htmlFor='' className={'head-advisory'}>{username}, edit your routes!</Label>*/}
          <Select
            name='selected-route'
            className='primary'
            value={routeId}
            options={routes}
            closeMenuOnSelect={true}
            style={{ width: '97%' }}
            onChange={({ target: { value } }) => { setRouteId(value) }}>
          </Select>
        </div>
        }
      </div>,

    initInstructions: async () => fetch(host + '/instructions').then((res) => res.json()).then(setInstructions),

    instructions: () =>
      <div className='advisory-box'>
        <ul>
          {instructions && instructions.map((instr, index) => {
            return <li key={'route-' + index} style={{ cursor: 'pointer' }} onClick={() => drawer.launchOption(instr.action_class)} >
              <Label htmlFor='' style={{ cursor: 'pointer' }} className={'advisory'} >
                <img src={host + instr.icon.url} style={{ cursor: 'pointer' }} alt='' />
                <span>
                  {instr.translations[0].label}
                </span>
                {/*<div className="img-wrapper" onClick={()=>{ console.log('.'+instr.action_class)}}>
                    <svg viewport=" 0 0 7 5" width="7" height="5" xmlns="http://www.w3.org/2000/svg"><path d="M0 .469c0 .127.043.237.13.33l3.062 3.28a.407.407 0 0 0 .616 0L6.87.8A.467.467 0 0 0 7 .468a.467.467 0 0 0-.13-.33A.407.407 0 0 0 6.563 0H.438A.407.407 0 0 0 .13.14.467.467 0 0 0 0 .468z" fill-rule="nonzero" fill="#333740"></path></svg>
                  </div>*/}
              </Label>
              <div style={{ display: 'none' }} className={instr.action_class}>{instr.translations[0].description}</div>
            </li>
          })}
        </ul>
      </div>,

  }

  let map = {

    init: async () => {
      await getStorage('center').then(center => {
        let centerNow = center ? center : mapBoxDetails.defCenter
        if (!maparea) return
        let mapInit = {
          center: [centerNow.lng, centerNow.lat],
          container: maparea.current || '',
          containerStyle: mapBoxDetails.style,
          style: mapBoxDetails.tile,
          zoom: centerNow.zoom,
          minZoom: 4,
          maxZoom: 18
        }
        maparea.current = new Map(mapInit)
        maparea.current.on('load', map.onLoad())
      })
    },

    getApiMarkers: () => {
      fetch(host + '/map-markers')
        .then((markers) => markers.json())
        .then(markers => {
          setStorage('markers', markers)
          for (let marker of markers) {
            setStorage('marker_' + marker.id, marker)
          }
          setMarkers(markers)
        })
        .catch(e => { console.error(e) })
    },

    onLoad: () => {
      map.setDraw()
      map.addControls()
      maparea.current.resize()
    },

    setDraw: () => {

      // COMMON ACTIONS
      maparea.current.on('move', () => map.actions.move())
        .on('click', (e) => map.actions.click(e, Draw.getSelected()))
        .on('mouseenter', 'places', () => {
          // Change the cursor to a pointer when the mouse is over the places layer.
          maparea.current.getCanvas().style.cursor = 'pointer'
        }).on('mouseleave', 'places', () => {
          // Change it back to a pointer when it leaves.
          maparea.current.getCanvas().style.cursor = ''
        })

      // DRAW ACTIONS
      maparea.current.on('draw.select', (e) => draw.select(e, Draw.change()))
      
      maparea.current.on('draw.add', (e) => draw.add(e, Draw.getAll()))
      maparea.current.on('draw.create', (e) => draw.create(e, Draw.getAll()))
      maparea.current.on('draw.update', (e) => draw.update(e, Draw.getAll()))
      maparea.current.on('draw.delete', (e) => draw.delete(e, Draw.getAll()))

      /*maparea.current.on('click', 'places', (e) => {
        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;
         
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
         
        new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
        });
      */

    },

    addControls: () => {
      maparea.current
        .addControl(Draw, 'top-left')
        .addControl(new MapboxLanguage())
        .addControl(new FullscreenControl())
        .addControl(new GeolocateControl(mapBoxDetails.geolocator))
        .addControl(new MapboxGLGeocoder(mapBoxDetails.MapboxGLGeocoder))
    },

    onDelete: (mapElement) => {

      if (routeIsPublished) {
        setAlert('You cannot delete an element while a map is published.\n\nPlease, ubpublish before remove elements')
        return false
      }

      var url = ''
      var type = mapElement.features[0].geometry.type
      switch (type) {
        case 'Point':
          url = host + '/my-places'
          break
        case 'Polygon':
          url = host + '/polygons'
          break
        case 'LineString':
          url = host + '/routes'
          break
        default: break
      }

      if (type === 'Point') {
        if (!window.confirm('ALERT:\nIf you delete this Place you will lose all the related content.\n\nDo you want to continue?')) {
          return false
        }
      }

      if (type === 'LineString') {
        if (!window.confirm('ALERT:\nIf you delete this route you will must to put a new one.\n\nConsider first to edit the existent one.\n\nDo you want to continue?')) {
          return false
        }
      }

      let getUrl = url + '?element=' + mapElement.features[0].id
      getData(getUrl).then(response => {
        var delUrl = url + '/' + response[0].id
        deleteData(delUrl)
          .then(data => {
            if (data.statusCode === 400) {
              if (testing) console.log('Something was wrong deleting a route element')
            } else {
              Draw.delete()
              Draw.trash()
              if (testing) console.log('The MapElement ' + mapElement.features[0].id + ' with the id ' + data.id + ' was succesfully deleted!!')
            }
          })
      })
    },

    setMapData: (features) => {

      let focus = getStorage('focus')

      let lat = mapBoxDetails.defCenter.lat
      let lng = mapBoxDetails.defCenter.lng
      let zoom = mapBoxDetails.defCenter.zoom

      if (focus) {
        lat = getStorage('focus').lat
        lng = getStorage('focus').lng
        zoom = getStorage('focus').zoom
      }

      return {
        'center_lat': lat,
        'center_long': lng,
        'center_zoom': zoom,
        'data': features,
      }

    },

    flyTo: (center) => {
      if (!center) return
      maparea.current.flyTo({ center: [center.lng, center.lat], zoom: center.zoom })
    },

    actions: {

      move: () => {
        console.log('map.actions.move')
        let focus = {
          lat: maparea.current.getCenter().lat,
          lng: maparea.current.getCenter().lng,
          zoom: Math.round(maparea.current.getZoom())
        }
        setFocus(focus)
        setStorage('focus', focus)
      },

      click: (e, selected) => {
        console.log('map.actions.click', e, selected.features)
        if (selected.features.length > 0) {
          let summary = {
            action: 'click',
            type: selected.features[0].geometry.type,
            id: selected.features[0].id,
            data: selected.features[0]
          }
          console.log('map.select', summary)
          setStorage('selectedElement', summary)
        } else {
          // Click on the map and unhold selected element from memory!!!
          setStorage('selectedElement', null)
        }

        /*if (selected && selected.features.length > 0) {

          getData(host + '/my-places' + '?element=' + selected.features[0].id)
            .then(data => {
              if (data.lenght > 0) {
                setPlace({
                  id: data[0].element,
                  name: data[0].name,
                  description: data[0].description[0].description
                })
              } else {
                setPlaceModalStatus(true)
              }

            })
        }*/
      },

    }

  }

  // All the draw actions
  let draw = {

    add: (e, draw) => {
      console.log('draw.add', e, draw)
      let summary = {
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0]
      }
      console.log('draw.add', summary)
    },

    create: (e, draw) => {
      console.log('draw.create', e, draw)
      let summary = {
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0]
      }
      console.log('draw.create', summary)
    },

    select: (e, draw) => {
      console.log('draw.selected', e, draw)
      let summary = {
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0]
      }
      console.log('draw.selected', summary)
    },

    update: (e, draw) => {
      console.log('mode', mode)
      if (mode === 'edition')
        modes.edition(e)
      else
        modes.creation(e)

      /*console.log('draw.update.' + mode, e, draw)
      let summary = {
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0]
      }
      console.log('drawer.update.' + mode, summary)*/
    },

    delete: (e, draw) => {
      let summary = {
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0]
      }
      console.log('drawer.delete', summary)
    },

  }

  let drawer = {

    //
    reset: () => {
      removeStorage('currentRoute')
      myRoutes.route.clean()
      Draw.deleteAll()
      Draw.trash()
    },

    selected: (response) => {
      drawer.reset()
      let selected = defSelected
      Draw.add(response.map_data.data)
      selected.features.push(response.map_data.data)
      if (response.places !== undefined) {
        for (let place of response.places) {
          let data = place.map_data.data
          Draw.add(data)
          selected.features.push(data)
        }
      }
      if (response.polygons !== undefined) {
        for (let polygon of response.polygons) {
          let data = polygon.map_data.data
          Draw.add(data)
          selected.features.push(data)
        }
      }
    },

    create: (mapElement) => {
      let route = parseInt(getStorage('routeId', 'string'))
      let type = mapElement.features[0].geometry.type
      if (type === 'Polygon') {
        postData(host + '/polygons', {
          'name': 'Polygon route ' + mapElement.features[0].id,
          'creator': user_id,
          'parent_route': route,
          'element': mapElement.features[0].id,
          'map_data': map.setMapData(mapElement.features[0])
        })
          .then(result => {
            if (result.statusCode === 400) {
              if (testing) console.log('Something was wrong creating a Polygon')
            } else {
              if (testing) console.log('The Polygon ' + mapElement.features[0].id + ' with the id ' + result.id + ' to the route ' + route + ' was succesfully created!!')
            }
          })
      } else if (type === 'Point') {
        // XXX: Call to a Places modal...
        resetPlace(true);
        setStorage('tmpPoint', mapElement.features[0], 'json')
      }
    },

    launchOption: (type) => jQuery('.mapbox-gl-draw_' + type).click(),

    onUpdate: (mapElement) => {
      switch (mode) {
        case 'view': {
          //onCreate(mapElement)
        } break
        case 'creation': {
          drawer.onCreate(mapElement)
        } break
        case 'edition': {
          drawer.onEdition(mapElement)
        } break
      }
    },

    onCreate: (mapElement) => {

      if (routeId === 0) {

        if (testing) console.log('Creation mode map action!')

        if (showCreationAdvisory()) {

          if (mapElement.type === 'drawer.create') {

            let name = (getStorage('routeName', 'string')) ? getStorage('routeName', 'string') : 'New route'
            //var label         = (getStorage('routeLabel', 'string')) ? getStorage('routeLabel', 'string') : 'New route label'
            let description = (getStorage('routeDescription', 'string')) ? getStorage('routeDescription', 'string') : 'New route description...'
            let isLineString = mapElement.features[0].geometry.type === 'LineString'
            let type = mapElement.features[0].geometry.type

            postData(host + '/routes', {
              'name': name,
              'creator': user_id,
              'element': mapElement.features[0].id,
              'description': [{
                'language': 1,
                'label': name,//label,
                'description': description
              }],
              'map_data': map.setMapData(isLineString ? mapElement.features[0] : '')
            })
              .then(res => {

                if (res.statusCode === 400) {
                  if (testing) console.log('Something was wrong with onUpdate creation mode action...')
                } else {

                  if (testing) console.log('You have created the element id ' + res.map_data.data.id + ' as route with the id ' + res.id)

                  setMode('edition')
                  storeChangeAdvisory(true)

                  if (isLineString) {

                    // Setting main inputs ;)
                    if (testing) console.log('The element is a LineString')
                    setRouteId(res.id)
                    setRouteName(name)
                    setRouteDescription(description)
                    //setPublishButtonStatus(!true)

                    setRoute(res.map_data.data)
                    setAlert('You have created the new route  \n ' + routeName, 'GRETTINGS!', contentGrettings(res.id))

                  } else {

                    if (type === 'Point') {
                      if (testing) console.log('The element is a Point')
                      //XXX: The point requires a modal to save the textual data
                      resetPlace(true);
                      setStorage('tmpPoint', mapElement.features[0], 'json')
                    } else if (type === 'Polygon') {
                      if (testing) console.log('The element is a Polygon')
                      polygon.post(mapElement.features[0], newId)
                    }

                  }

                  setPublishable()

                }

              })

          }

        } else {
          if (testing) console.log('Burp...')
        }

      }

    },

    onEdition: (mapElement) => {
      if (routeId !== 0) {
        if (testing) console.log('Edition route mode ' + routeId + ' action!')
        if (showChangeAdvisory()) {
          if (mapElement.action !== undefined) {
            if (mapElement.action === 'change_coordinates' || mapElement.action === 'move') {
              myRoutes.updateElement(mapElement)
            } else {
              if (testing) console.log('Uncontrolled action :// !!!' + mapElement.action)
            }
          } else {
            if (mapElement.features[0].geometry.type === 'LineString') {
              let storedLinesAmount = checkFeaturesAmount(route, 'LineString')
              if (storedLinesAmount > 1) {
                setAlert('You cannot add more than one route. Delete one!')
                return false
              }
            }
            switch (mapElement.type) {
              case 'drawer.create':
                map.createMapElement(mapElement)
                break
              case 'drawer.update':
                myRoutes.updateElement(mapElement)
                break
              case 'drawer.delete':
                map.onDelete(mapElement)
                break
              default:
                if (testing) console.log('Uncontrolled action :// !!!' + mapElement.action)
                break
            }
          }
        }
      }
    },

    controls: {

      create: '.mapbox-gl-draw_line',

      edit: '.mapbox-gl-draw_point, .mapbox-gl-draw_polygon,.mapbox-gl-draw_trash',

      creation: () => {
        jQuery(drawer.controls.edit).fadeOut()
        jQuery(drawer.controls.create).fadeIn()
      },

      edition: () => {
        jQuery(drawer.controls.create).fadeOut()
        jQuery(drawer.controls.edit).fadeIn()
      },

      view: () => {
        jQuery(drawer.controls.edit).fadeOut()
        jQuery(drawer.controls.create).fadeIn()
      }

    },

  }

  let myRoutes = {

    init: () => {
      myRoutes.get()
      setQrUrl(host)
    },

    get: () => {
      fetch(host + '/routes' + '?creator=' + user_id)
        .then((routes) => routes.json())
        .then(myRoutes.process)
        .catch(error => { console.error(error) })
    },

    process: (routes) => {
      myRoutes.getCenter(routes)
      let options = [{ value: '0', label: messages.chooseRoute }]
      if (routes) {
        for (let route of routes) {
          options.push({ value: route.id.toString(), label: route.name })
        }
      }
      setRoutes(options)
    },

    switch: () => {
      fetch(host + '/routes' + '/' + routeId)
        .then((res) => res.json())
        .then(modes.edition)
        .catch(modes.view)
    },

    getCenter: (routes, zoom = 9) => {
      let lat = 0, lng = 0, i = 0
      for (let route of routes) {
        let coordinates = route.map_data.data.geometry.coordinates
        for (let coordinate of coordinates) {
          lat = lat + parseFloat(coordinate[1])
          lng = lng + parseFloat(coordinate[0])
          ++i
        }
      }
      let res = { lat: lat / i, lng: lng / i }
      lat = 0
      lng = 0
      i = 0
      for (let route of routes) {
        let places = route.places
        for (let place of places) {
          lat = lat + parseFloat(place.map_data.center_lat)
          lng = lng + parseFloat(place.map_data.center_long)
          ++i
        }
      }
      let res2 = { lat: lat / i, lng: lng / i }
      let return_ = { lat: (res.lat + res2.lat) / 2 + 0.15, lng: (res.lng + res2.lng) / 2 + 0.6, zoom: zoom }
      setStorage('center', return_)
      setCenter(return_)
    },

    setMarkers: (route, action = 'asdfasdf') => {
      try {
        let i = 0
        for (let place of route.places) {
          let coords = [place.map_data.data.geometry.coordinates[1], place.map_data.data.geometry.coordinates[0]]
          let settedAction = action
            .replace('#route_id#', route.id.toString())
            .replace('#step#', (i++).toString())
          myRoutes.setMarker(
            place.id,
            map,
            coords[0],
            coords[1],
            place.map_marker,
            place.name,
            settedAction,
            place.element,
            null)
        }
      } catch (e) {
        console.log('error 179', e)
        //setTimeout(() => history.replace('/map/navigate/' + route.id), 1000)
      }
    },

    setMarker: (placeId, map, lat, lng, icon, popContent = '<h1>Hello World!</h1>', href = '', element, clickEvent) => {
      try {
        getStorage('marker_' + icon)
          .then(icon => {

            let height = 43
            let width = 33
            let el = document.createElement('div')
            el.style.backgroundImage = 'url("' + host + '/' + icon.icon.url + '")'
            el.id = 'marker_' + placeId
            el.className = 'mapElement icon ' + element
            el.style.width = `${width}px`
            el.style.height = `${height}px`
            el.style.backgroundSize = '100%'
            if (clickEvent) el.addEventListener('click', () => { clickEvent() })
            if (popContent) {
              let pop = new MapboxGL.Popup({ closeOnClick: true })
                .setLngLat([lng, lat])
                .setHTML(popContent)
                .addTo(maparea.current)
              new MapboxGL.Marker(el).setLngLat([lng, lat]).addTo(maparea.current).setPopup(pop)
              jQuery('.mapboxgl-popup-close-button').click()
            } else {
              new MapboxGL.Marker(el).setLngLat([lng, lat]).addTo(maparea.current)
            }

          })
          .catch(e => {
            console.log('error 659', e)
          })

      } catch (e) {
        console.log('error 663', e)
      }
    },

    updateElement: (mapElement) => {
      let url = ''
      let type = mapElement.features[0].geometry.type
      let id = mapElement.features[0].id
      switch (type) {
        case 'Point':
          url = host + '/my-places'
          break
        case 'Polygon':
          url = host + '/polygons'
          break
        default:
        case 'LineString':
          url = host + '/routes'
          break
      }
      let urlGet = url + '?element=' + id
      getData(urlGet)
        .then(response => {
          if (response.statusCode === 400) {
            if (testing) console.log('Something was wrong with updateElement action...')
          } else {
            if (testing) console.log('The updateElement first response')
            if (testing) console.log(response)

            if (testing) console.log('You got the desired element ' + id)
            let putUrl = url + '/' + response[0].id

            putData(putUrl, { 'map_data': map.setMapData(mapElement.features[0]) })
              .then(data => {
                if (data.statusCode === 400) {
                  if (testing) console.log('Something was wrong with updateElement action...')
                } else {
                  let res = (type === 'LineString') ? id : id
                  if (testing) console.log('The Element ' + id + ' with the id ' + res + ' was succesfully updated!!')
                }
              })
          }
        })
    },

    route: {

      create: () => { },

      update: () => { },

      updateExtra: () => {
        if (!routeUnselected()) {
          setIsLoading(true)
          if (routeName !== '' && routeDescription !== '') {//&& routeLabel !== ''
            putData(host + '/routes' + '/' + routeId, {
              'name': routeName,
              'description': [{
                'language': 1,
                'label': routeName,
                'description': routeDescription
              }]
            })
              .then()
          }
          setIsLoading(false)
        }
      },

      delete: () => {
        if (window.confirm('ALERT:\nIf you delete the route this will delete on cascade all the related content.\n\nDo you want continue??')) {
          let route_id = getStorage('routeId', 'string')
          getData(host + '/routes' + '/' + route_id)
            .then(result => {
              deleteData(host + '/routes' + '/' + route_id)
                .then(result2 => {
                  if (result2.statusCode === 400) {
                    if (testing) console.log('Something was wrong deleting places on route delete cascade')
                    return false
                  } else {
                    resetTocreation()
                    for (let place of result.places) {
                      deleteData(host + '/my-places' + '/' + place.id).then(result3 => {
                        if (result3.statusCode === 400) {
                          if (testing) console.log('Something was wrong deleting places on route delete cascade')
                        } else {
                          if (testing) console.log('The Place with  was succesfully deleted')
                        }
                      })
                    }
                    for (let polygon of result.polygons) {
                      deleteData(host + '/polygons' + '/' + polygon.id).then(result4 => {
                        if (result4.statusCode === 400) {
                          if (testing) console.log('Something was wrong deleting places on route delete cascade')
                        } else {
                          if (testing) console.log('The Polygon  was succesfully deleted')
                        }
                      })
                    }
                    return true
                  }
                })
            })
        } else {
          return false
        }
      },

      publish: () => {

        if (testing) console.log('togglePublished: Is published: ' + routeIsPublished)
        if (routeIsPublished) {
          if (testing) console.log('Unpublishing??')
          if (window.confirm('ALERT:\nIf you continue the route will disapear from the app after next app data upgrade\n\nDo you wanna unpublish the route?')) {
            setRouteIsPublished(false)
          } else {
            return false
          }
        } else {

          if (validatePublishing()) {
            if (testing) console.log('Publishing??')
            if (window.confirm('ALERT:\nIf you continue the route will appear from the app after next app data upgrade\n\nDo you wanna publish the route?')) {
              setRouteIsPublished(true)
            } else {
              return false
            }
          } else {
            return false
          }
        }

        putData(host + '/routes' + '/' + routeId, { published: !routeIsPublished })
          .then(data => {
            let action = ((!routeIsPublished) ? 'published' : 'unpublished')
            setAlert('The route ' + routeName + ' was succesfully ' + action + '!')
          })

      },

      unpublish: () => {

        if (testing) console.log('togglePublished: Is published: ' + routeIsPublished)
        if (routeIsPublished) {
          if (testing) console.log('Unpublishing??')
          if (window.confirm('ALERT:\nIf you continue the route will disapear from the app after next app data upgrade\n\nDo you wanna unpublish the route?')) {
            setRouteIsPublished(false)
          } else {
            return false
          }
        } else {

          if (validatePublishing()) {
            if (testing) console.log('Publishing??')
            if (window.confirm('ALERT:\nIf you continue the route will appear from the app after next app data upgrade\n\nDo you wanna publish the route?')) {
              setRouteIsPublished(true)
            } else {
              return false
            }
          } else {
            return false
          }
        }

        putData(host + '/routes' + '/' + routeId, { published: !routeIsPublished })
          .then(data => {
            let action = ((!routeIsPublished) ? 'published' : 'unpublished')
            setAlert('The route ' + routeName + ' was succesfully ' + action + '!')
          })

      },

      clean: () => {

        if (!map) return

        document.querySelectorAll('.mapElement').forEach((el) => el.remove())
        /*
        if (polyline.layer !== '') {
          // @ts-ignore: Object is possibly 'null'. 
          if (map.getLayer(polyline.layer)) {
            map.removeLayer(polyline.layer).removeSource(polyline.source)
            setPolyline({ source: 'route', layer: '' })
          }
        }
 
        if (polygons.length > 0) {
 
          for (let i = 0; i < polygons.length; i++) {
 
            //if(document.getElementById(polygons[i].layer)) 
            // @ts-ignore: Object is possibly 'null'.   
            if (map.getLayer(polygons[i].layer)) {
              // @ts-ignore: Object is possibly 'null'.   
              map.removeLayer(polygons[i].layer)
              delete polygons[i].layer
            }
 
            // @ts-ignore: Object is possibly 'null'.
            if (map.getLayer(polygons[i].layer2)) {
              // @ts-ignore: Object is possibly 'null'.   
              map.removeLayer(polygons[i].layer2)
              delete polygons[i].layer2
              map.removeSource(polygons[i].source)
            }
 
          }
 
          setPolygons([])
 
        }
        */

      },

      render: {

        routeForm: () => <div>
          <div className='row'>
            <Label htmlFor='route-name'>Edit name</Label>
            <InputText
              type='text'
              name='route-name'
              value={routeName}
              placeholder='Set the route name...'
              required={true}
              onChange={({ target: { value } }) => { setRouteName(value) }}
            />
            <Button
              label={'Save'}
              type='submit'
              onClick={savePlace}
            />
          </div>
          <div className='row'>
            <span style={{ opacity: routeName ? 0 : 1 }}>Please, set a route name...</span>
          </div>
        </div>
        ,

      }

    },

    place: {

      create: () => { },

      cancel: () => { },

      cancel: () => {
        let mapElement = getStorage('tmpPoint', 'json')
        if (mapElement) {
          if (placeId === 0) {
            if (testing) console.log('You are aborting to save the Place')
            Draw.delete(mapElement.id)
          } else {
            place.reset()
          }
        } else {
          place.reset()
        }
      },

      editModal: () => {
        return (
          <Modal
            isOpen={false}
            style={placesModalStyle}
            contentLabel='Save your place'
          >
            <div className='table'>
              <div className='row'>
                <Label htmlFor='place-name'><h2>Set the place data</h2></Label>
              </div>
              <div className='row'>
                <Label htmlFor='place-name'>Edit Place Name</Label>
                <InputText
                  type='text'
                  name='place-name'
                  className='my-input'
                  value={placeName}
                  placeholder='Set here the Place Name for this route...'
                  required={true}
                  style={{ width: '171%' }}
                  onChange={({ target: { value } }) => { storePlaceName(value) }}
                />
              </div>
              <div className='row'>
                <span style={{ color: placeName ? 'white' : 'red' }}>Please, set a place name...</span>
              </div>
              <div className='row'>
                <Label htmlFor='place-description'>Description</Label>
                <Textarea
                  name='route-description'
                  className={'description'}
                  placeholder='Set here the description for this place...'
                  required={true}
                  style={{ maxHeight: '261px', height: '261px' }}
                  onChange={({ target: { value } }) => { storePlaceDescription(value) }}
                  value={placeDescription}
                />
              </div>
              <div className='row'>
                <span style={{ color: placeDescription ? 'white' : 'red' }}>Please, set a place label...</span>
              </div>
              <div className='row'>
                <LoadingBar style={{ width: '100%', opacity: isLoading ? 99 : 0 }} />
                <div className='col-6' style={{ textAlign: 'center', marginTop: '20px' }}>
                  <Button
                    label={'Save'}
                    type='submit'
                    onClick={savePlace}
                    className='my-button'
                  />
                </div>
                <div className='col-6' style={{ textAlign: 'center', marginTop: '20px' }}>
                  <Button
                    label={'Cancel'}
                    color={'delete'}
                    onClick={place.cancel}
                    className='my-button'
                  />
                </div>
              </div>
            </div>
          </Modal>
        )
      },

      savePlace: (event) => {
        event.preventDefault()
        let mapElement = getStorage('tmpPoint', 'json')
        if (mapElement !== '') {//Undo
          if (placeName === '' && placeDescription === '') {//&& placeLabel === '' 
            return false
          } else {
            myRoutes.place.postPlace(mapElement)
          }
        } else {
          setAlert('Theres is not data to save about the place');
          Draw.trash()
          setPlaceModalStatus(false)
        }
      },

      resetPlace: (status) => {
        setPlaceModalStatus(status)
        if (!status) {
          setStorage('place_id', 0)
          setStorage('place_name', '')
          setStorage('place_label', '')
          setStorage('place_description', '')
        }
      },

      postPlace: (placeFeatures) => {
        if (!placeFeatures) return false
        postData(host + '/my-places', {
          'name': placeName,
          'creator': user_id,
          'parent_route': routeId,
          'element': placeFeatures.id,
          'description': [{
            'language': 1,
            'label': placeName,// 'New route label',
            'description': placeDescription
          }],
          'map_data': map.setMapData(placeFeatures)
        })
          .then(data => {
            if (data.statusCode === 400) {
              if (testing) console.log('Something was wrong with creating a Place...')
            } else {
              if (testing) console.log('Place ' + placeFeatures.id + ' posted successful ;)')
              resetPlace(false)
            }
          })
      },

    },

    polygon: {

      post: (polygonFeatures, i) => {

        postData(host + '/polygons', {
          'name': routeName + ' Warning ' + routeId + '-' + i.toString(),
          'creator': user_id,
          'parent_route': routeId,
          'element': polygonFeatures.id,
          'map_data': map.setMapData(polygonFeatures)
        })
          .then(data => {
            if (data.statusCode === 400) {
              if (testing) console.log('Something was wrong creating a Polygon')
            } else {
              if (testing) console.log('Polygon ' + data.id + ' posted successful ;)')
            }
          })

      },
    }

  }

  let modes = {

    view: () => {
      setMode('view')
      editor.view()
      drawer.controls.view()

      setRouteId(0)
      if (routeId !== undefined) drawer.reset()
      map.flyTo(center)
    },

    creation: () => {
      setMode('creation')
      drawer.controls.creation()
      editor.creation()

      setRouteId(0)

      drawer.reset()
      map.flyTo(center)
    },

    edition: (route) => {
      setMode('edition')
      drawer.controls.edition()
      editor.edition(route)

      drawer.selected(route)
      myRoutes.setMarkers(route)// PAINTING COMMON POINTERS!!

      let routeCenter = { lat: route.map_data.center_lat, lng: route.map_data.center_long, zoom: route.map_data.center_zoom }
      map.flyTo(routeCenter)
    },

    showCreationAdvisory: () => {
      if (routeId === 0) {
        if (window.confirm('Do you want to create a new route?')) {
          //storeCreationAdvisory(Date.now())
          return true
        } else {
          Draw.trash()
          return false
        }
      }
      return true
    },

  }

  let editor = {

    view: () => {
      setButton1(editor.buttons.delete)
      setButton2(editor.buttons.publish)
    },

    edition: (route) => {
      let button1_1 = editor.buttons.delete
      let button2_1 = null
      if (route.published) {
        button1_1.disabled = true
        button2_1 = editor.buttons.unpublish
      } else {
        button2_1 = editor.buttons.publish
      }
      setButton1(button1_1)
      setButton2(button2_1)
    },

    creation: () => {
      setButton1(editor.buttons.delete)
      setButton2(editor.buttons.publish)
    },

    buttons: {

      edit: {
        label: 'Edit',
        color: 'edit',
        disabled: true,
        visible: true,
        className: 'my-button',
        onClick: (e) => { route.edit() }
      },

      save: {
        label: 'Save',
        color: 'primary',
        disabled: true,
        visible: true,
        className: 'my-button',
        onClick: (e) => { route.save() }
      },

      delete: {
        label: 'Delete',
        color: 'delete',
        disabled: true,
        visible: true,
        className: 'my-button',
        onClick: (e) => { route.delete() }
      },

      publish: {
        label: 'Publish',
        color: 'success',
        disabled: true,
        visible: true,
        className: 'my-button',
        onClick: (e) => { route.togglePublished() }
      },

      unpublish: {
        label: 'Unpublish',
        color: 'success',
        disabled: false,
        visible: true,
        className: 'my-button',
        onClick: (e) => { route.publish() }
      }

    },

  }

  let others = {

    contentGrettings: (id) => {
      return (<Link to={'/admin/plugins/content-manager/collectionType/application::myRoutes.routes/' + id} className='btn btn-primary'>Add media</Link>)
    },

    validatePublishing: () => {
      if (testing) console.log('validatePublishing attempt... is route! ;))')
      getData(host + '/routes' + '/' + routeId)
        .then(result => {

          if (result.places.length === 0) {
            funs.launchToast('To publish a good quality route, please set at least a Place...')
            return false
          } else {
            for (let place of result.places) {
              if (place.description === '' || place.images.length === 0) {
                funs.launchToast('Please set your Place images, markers and descriptions before publish the route...')
                return false
              }
            }
          }

        })
      return true
    },

    resetPublishButton: () => {
      setPublishButtonStatus(false)
      setPublishButtonLabel(createText)
    },

    setPublishable: () => {
      setPublishButtonStatus(true)
      setPublishButtonLabel('Publish')
      storePublishButtonColor('primary')
    },

    setUnpublishable: () => {
      setPublishButtonStatus(true)
      setPublishButtonLabel('Unpublish')
      storePublishButtonColor('success')
    },

    showChangeAdvisory: () => {
      console.log('routeId', routeId)
      //let adv = getStorage('routeChangesAdvisory', 'string')
      //if (!adv) {
      //  if (window.confirm('Do you want to edit this route?')) {
      //    setStorage('routeChangesAdvisory', true)
      //    return true
      //  } else {
      //    return false
      //  }
      //}
      //return true
    },

    launchToast: (message, doContinue = false, label) => {
      setAlert(message, label)
      return doContinue
    },

    setAlert: (message, label = '', content = null) => {
      setAlertModalMessage(message)
      setAlertModalLabel(label)
      setAlertContent(content)
      setAlertModalStatus(true)
    },

    closeAlert: (message) => {
      setAlertModalStatus(false)
    },

    alertModal: () => {
      return (
        <Modal
          isOpen={false}
          contentLabel={''}
          style={alertModalStyle}
          shouldCloseOnOverlayClick={true}
        >
          <div style={{ minHeight: '90%', textAlign: 'center' }}>
            <Label htmlFor='input' style={{ color: 'white' }} message={''} />
            <Label htmlFor='input' message={''} />
            <div>{''}</div>
          </div>
          <Button
            label={'OK'}
            color={'warning'}
            onClick={closeAlert}
          />
        </Modal>
      )
    },

    renderCarrousel: () => {
      return (
        <div>
          <h2> Single Item</h2>
          <Carousel>
            <div>
              <h3>1</h3>
            </div>
            <div>
              <h3>2</h3>
            </div>
          </Carousel>
        </div>
      )
    },

  }

  useEffect(init, [])
  useEffect(myRoutes.switch, [routeId])
  useEffect(() => { map.flyTo(center) }, [center])

  return <div>
    <div className='row'>
      <div className='col-sm-8 col-md-8 col-lg-8'>
        {render.leftPan()}
      </div>
      <div className='col-sm-4 col-md-4 col-lg-4'>
        {routes && render.rightPan()}
      </div>
    </div>
  </div>

}

export default memo(HomePage)
