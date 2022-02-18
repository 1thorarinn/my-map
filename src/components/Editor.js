/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react'
import { Select, Button, InputText, Textarea, Label, Option, Count } from '@buffetjs/core'
import { Header } from '@buffetjs/custom'
import { LoadingBar, LoadingIndicator } from '@buffetjs/styles'

import { host, testing, mapboxToken } from '../hob-const.js'
import Modal from 'react-modal'
import axios from 'axios'
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import 'react-tabs/style/react-tabs.css'
import jQuery from 'jquery'
import QRCode from 'qrcode.react'
import { setStorage, getStorage, removeStorage, getData, getRoutesList, Draw, placesModalStyle, putData, deleteData, postData, getCenter, alertModalStyle } from '../map-utils.js';

import MapboxGL, { Map, FullscreenControl, GeolocateControl } from 'mapbox-gl'
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder'

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader

import Alert from './Alert'
import Instructions from './Instructions'


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faSave } from '@fortawesome/free-solid-svg-icons'


//import { get, upperFirst } from 'lodash';
//import { auth, LoadingIndicatorPage } from 'strapi-helper-plugin'

MapboxGL.accessToken = mapboxToken

const MapboxLanguage = require('@mapbox/mapbox-gl-language')

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

const username = 'asfsdfsa'//get(auth.getUserInfo(), 'firstname', '')  
const user_id = 13//get(auth.getUserInfo(), 'id', '')

const Editor = () => {

  const [mode, setMode] = useState()
  const [center, setCenter] = useState() // Is the calculated center, related with the routes created
  const [mainCenter, setMainCenter] = useState() // Is the calculated center, related with the routes created

  const [route, setRoute] = useState(undefined) // The selected route
  const [routes, setRoutes] = useState(undefined) // The loaded routes content related with this client...  
  const [routeId, setRouteId] = useState(0)
  const [routeName, setRouteName] = useState('')
  const [editingName, setEditingName] = useState(false)

  const [selectedElement, setSelectedElement] = useState() // The selected route data
  const [summary, setSummary] = useState(undefined)

  const [button1, setButton1] = useState(undefined)
  const [button2, setButton2] = useState(undefined)
  const [qrUrl, setQrUrl] = useState(undefined) // QRCode for access this client ;)

  const [active, setActive] = useState(-1)
  const [instructions, setInstructions] = useState(undefined)

  const [focus, setFocus] = useState(mapBoxDetails.defCenter)
  const [modal, setModal] = useState(undefined)

  const [isLoading, setIsLoading] = useState(false)

  if (typeof (window) !== 'undefined') {
    Modal.setAppElement('body')
  }

  // REFERENCES
  const maparea = useRef(undefined)

  // TESTING
  const panojaContent = () => <label>Panoja modal test</label>
  const panojaOk = () => setModal({ show: false })

  const editor = {

    init: async () => {
      if (!user_id) history.go(0)
      setLoading(3000)
      map.init()
      editor.routes.get()
      editor.instructions.init()
      editor.modes.creation()
      localStorage.setItem('user_id', user_id)
      setQrUrl(host)

      // TESTING
      //modalObj.set('Warning', panojaContent, panojaOk)
      //setRouteId(245)

    },

    setOption: (type, index) => {
      if (type) jQuery('.mapbox-gl-draw_' + type).click()
      jQuery('.control-icon').removeClass('blink-slow')
      jQuery('.control-' + index).addClass('blink-slow')
      jQuery('.control-row').addClass('inactived')
      jQuery('#control-row-' + index).removeClass('inactived')
      render.setActiveFold(index)
    },

    routes: {

      origin: host + '/routes?creator=' + user_id,

      // Getting and processing the routes hosted by the client...
      get: () => axios.get(editor.routes.origin).then(editor.routes.set),

      set: (routes) => {

        // Setting center...
        let routesCenter = getCenter(routes.data)
        setCenter(routesCenter)
        map.flyTo(routesCenter)

        // Also storing main center for later if back to no one menu...
        setMainCenter(routesCenter)

        // Setting routes...
        let options = getRoutesList(routes.data)
        setRoutes(options)

        // Setting mode...
        editor.modes.creation()

      },

      switch: (routeId) => {
        setLoading(1500)
        if (routeId === 0) {
          // Clearing the routes
          setRoute(undefined)
          setCenter(mainCenter)
          map.flyTo(mainCenter)
          setSelectedElement(undefined)
          editor.modes.creation()
        } else {
          // Getting the route...
          let get = host + '/routes/' + routeId
          axios.get(get).then(editor.modes.edition)
        }
        setStorage('routeId', routeId)
      },

      reload: () => {
        axios.get(host + '/routes/' + routeId).then(route => {
          setRoutes(route.data)
        })
      },

    },

    modes: {

      edition: (route) => {
        setMode('edition')
        setRoute(route.data)
        setStorage('mode', 'edition')
        drawer.reset()
        myRoutes.load(route.data)
        setRouteId(route.data.id)
        setRouteName(route.data.name)
        let button1_1 = editor.buttons.delete()
        let button2_1 = null
        if (route.data.published) {
          button1_1.disabled = true
          button2_1 = editor.buttons.unpublish()
        } else {
          button1_1.disabled = false
          button2_1 = editor.buttons.publish
        }
        editor.setOption('lines', 0)
        editor.modes.controls.edition(button1_1, button2_1)
      },

      creation: () => {
        setMode('creation')
        drawer.reset()
        setStorage('mode', 'creation')
        editor.setOption('lines', 0)
        editor.modes.controls.creation()
      },

      setButtons: (btn1, btn2) => {
        setButton1(btn1)
        setButton2(btn2)
      },

      showCreationAdvisory: async () => {
        let routeId = getStorage('routeId')
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

      controls: {

        create: '.mapbox-gl-draw_line',

        edit: '.mapbox-gl-draw_point, .mapbox-gl-draw_polygon, .mapbox-gl-draw_trash',

        creation: () => {
          jQuery(editor.modes.controls.edit).fadeOut()
          jQuery(editor.modes.controls.create).fadeIn()
          //jQuery(editor.modes.controls.create).fadeOut()
          editor.modes.setButtons(editor.buttons.delete, editor.buttons.publish)
        },

        edition: (btn1, btn2) => {
          jQuery(editor.modes.controls.create).fadeOut()
          jQuery(editor.modes.controls.edit).fadeIn()
          //jQuery(editor.modes.controls.edit).fadeOut()
          editor.modes.setButtons(btn1, btn2)
        },

      },

    },

    instructions: {
      init: async () => axios.get(host + '/instructions').then(setInstructions),
    },

    buttons: {
      set: (label, color, onClick, visible = true, disabled = false) => {
        let r = { label: label, color: color, disabled: disabled, visible: visible, className: 'my-button' }
        if (onClick !== undefined) r.onClick = onClick
        return r
      },
      edit: (onEdit) => editor.buttons.set('Edit', 'primary', onEdit),
      save: (onSave) => editor.buttons.set('Save', 'success', onSave),
      delete: (onDelete) => editor.buttons.set('Delete', 'delete', onDelete),
      publish: (onPublish) => editor.buttons.set('Publish', 'primary', onPublish),
      unpublish: (onUnpublish) => editor.buttons.set('Unpublish', 'success', onUnpublish)
    },

    actions: {

      deletePolygon: (polygon) => {
        console.log('- Action delete polygon', polygon)
      }

    }

  }

  const map = {

    // Initializing the map...
    init: async () => {
      if (!maparea) return
      let centerNow = center ? center : mapBoxDetails.defCenter
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
    },

    // Load draw settings!!!
    onLoad: () => {
      map.setDraw()
      map.addControls()
      maparea.current.resize() // Resize map to fit the screen...
    },

    // Setting draw controls...
    addControls: () => {
      // Adding controls on the  map...
      maparea.current
        .addControl(Draw, 'top-left')
        .addControl(new MapboxLanguage())
        .addControl(new FullscreenControl())
        //.addControl(new GeolocateControl(mapBoxDetails.geolocator))
        .addControl(new MapboxGLGeocoder(mapBoxDetails.MapboxGLGeocoder))
    },

    // Setting draw actions...
    setDraw: () => {
      // Activate the draw power!!!...

      // COMMON ACTIONS
      maparea.current.on('move', () => map.actions.move())
        .on('click', (e) => map.actions.click(e, Draw.getSelected()))
        // Change the cursor to a pointer when the mouse is over the places layer.
        // Change it back to a pointer when it leaves.
        .on('mouseenter', 'places', () => {
          maparea.current.getCanvas().style.cursor = 'pointer'
        }).on('mouseleave', 'places', () => {
          maparea.current.getCanvas().style.cursor = ''
        })

      // DRAW ACTIONS
      maparea.current.on('draw.select', (e) => draw.select(e, Draw.change()))
      maparea.current.on('draw.add', (e) => draw.add(e, Draw.getAll()))
      maparea.current.on('draw.create', (e) => draw.create(e, Draw.getAll()))
      maparea.current.on('draw.update', (e) => draw.update(e, Draw.getAll()))
      maparea.current.on('draw.delete', (e) => draw.delete(e, Draw.getAll()))

    },

    setRoute: (route) => myRoutes.switch(route),//unused

    flyTo: (center) => {
      if (!center || !maparea.current) return
      setTimeout(() => {
        setCenter(center)
        maparea.current.flyTo({ center: [center.lng, center.lat], zoom: center.zoom })
      }, 123)
    },

    actions: {

      move: () => {
        // The map moveing actions...
        if (!maparea.current) return
        let curFocus = {
          lat: maparea.current.getCenter().lat,
          lng: maparea.current.getCenter().lng,
          zoom: Math.round(maparea.current.getZoom())
        }
        setFocus(curFocus)
      },

      click: (e, selected) => {

        console.log(e, selected.features.lngLat)
        //map.flyTo()

        var summary = {}

        if (selected.features.length === 1) {

          summary = {
            draw: 'draw.click',
            action: 'click',
            id: selected.features[0].id || '',
            type: selected.features[0].geometry.type,
            selected: selected.features[0]
          }

          //setActive(3)
          //setSelectedElement(summary)
          setStorage('selected', selected)

        } else {

          summary = {
            draw: 'draw.click',
            action: 'none',
            id: 'nothing',
            type: 'emptyness',
            selected: null
          }

          //if(active!== 0){ setActive(0) }else{ setActive(-1)}
          //setSelectedElement(undefined)
          removeStorage('selected')

        }

        setSummary(summary)

        render.selectInstr(summary.type)

      },

    },

  }

  const modes = {

    creation: () => {
      //setMode('creation')
      //drawer.controls.creation()
      //editor.creation()
      //setRouteId(0)
      //drawer.reset()
      //map.flyTo(center)
    },

    edition: (route) => {
      setMode('edition')
      drawer.reset()
      drawer.selected(route)
      //myRoutes.getMarkers(route)// PAINTING COMMON POINTERS!!
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

  const myRoutes = {

    init: () => {
      myRoutes.get()
      setQrUrl(host)
    },

    get: () => axios.get(host + '/routes' + '?creator=' + user_id).then(myRoutes.set),

    set: (routes) => {
      myRoutes.getCenter(routes)
      let options = [{ value: '0', label: messages.chooseRoute }]
      if (routes) {
        for (let route of routes) {
          options.push({ value: route.id.toString(), label: route.name })
        }
      }
      setRoutes(options)
    },

    load: (route) => {
      modes.edition(route)
    },

    switch: (routeId) => {
      let get = host + '/routes/' + routeId
      fetch(get)
        .then((route) => route.json())
        .then(modes.edition)
    },

    setMarkers: (route, action = 'asdfasdf') => {
      try {
        let i = 0
        for (let place of route.places) {
          let coords = [
            place.map_data.data.geometry.coordinates[1],
            place.map_data.data.geometry.coordinates[0]
          ]
          let settedAction = action
            .replace('#route_id#', route.id.toString())
            .replace('#step#', (i++).toString())
          myRoutes.getMarker(
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

    setMarker: (placeId, map, lat, lng, iconId, popContent = '<h1>Hello World!</h1>', href = '', element, clickEvent) => {
      try {
        getStorage('marker_' + iconId)
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

    setRoute: (routeId) => {
      console.log('intento setear una ruta : ' + routeId)
    },

    /*getDistanceBetweentwoGeopositions : ()=>{
      let distance = 0
      let points = route.geometry.coordinates
      for(let i=0; i<points.length-1; i++){
        distance += turf.distance(turf.point(points[i]), turf.point(points[i+1]))
      }
      return distance
    },*/

    route: {

      create: () => { },

      update: (type) => {

        getStorage('routeId')
          .then(routeId => {
            if (!route) return
            let onChangeName = !editingName && routeName !== route.name;
            if (onChangeName) setLoading(1500)
            switch (type) {
              case 'name': {
                if (onChangeName) {
                  let data = { "name": routeName }
                  axios.put(host + '/routes/' + routeId, data)
                    .then(myRoutes.route.reload)
                    .then(editor.routes.get)
                }
              } break;

            }

          })

      },

      setRouteNameAction: (name) => {
        let r = route
        r.name = name
        setRouteName(name)
        setRoute(r)
      },

      updateExtra: () => {
        if (!routeUnselected()) {
          setLoading(2000)
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
          setLoading(2000)
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
            console.log('The route ' + routeName + ' was succesfully ' + action + '!')
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
            console.log('The route ' + routeName + ' was succesfully ' + action + '!')
          })

      },

      clean: () => {
        if (!maparea) return
        document.querySelectorAll('.mapElement').forEach((el) => el.remove())
      },

      reload: () => axios.get(host + '/routes/' + routeId).then(route => setRoute(route.data)),

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

      editModal: () => <Modal
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
      ,

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
          console.log('Theres is not data to save about the place');
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

  const drawer = {

    // Clean all the drawer
    reset: () => {
      Draw.deleteAll()
      Draw.trash()
      myRoutes.route.clean()
    },

    // Draw the selected routeData map elements!!!...
    selected: (routeData) => {
      let selected = { type: 'FeatureCollection', features: [] }
      selected.features.push(routeData.map_data.data)
      if (routeData.places !== undefined) {
        for (let place of routeData.places) {
          selected.features.push(place.map_data.data)
        }
      }
      if (routeData.polygons !== undefined) {
        for (let polygon of routeData.polygons) {
          selected.features.push(polygon.map_data.data)
        }
      }
      for (let feature of selected.features) {
        Draw.add(feature)
      }
    },

    setOption: async (type) => jQuery('.mapbox-gl-draw_' + type).click(),

    onCreate: async (mapElement) => {

      let routeId = await getStorage('routeId');
      let mode = await getStorage('mode')

      if (routeId === 0) {

        console.log('Creation mode map action!')

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
                  console.log('Something was wrong with onUpdate creation mode action...')
                } else {

                  console.log('You have created the element id ' + res.map_data.data.id + ' as route with the id ' + res.id)

                  setMode('edition')
                  storeChangeAdvisory(true)

                  if (isLineString) {

                    // Setting main inputs ;)
                    console.log('The element is a LineString')
                    setRouteId(res.id)
                    setRouteName(name)
                    setRouteDescription(description)
                    //setPublishButtonStatus(!true)

                    setRoute(res.map_data.data)
                    console.log('You have created the new route  \n ' + routeName, 'GRETTINGS!', contentGrettings(res.id))

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
          console.log('Burp...')
        }

      } else {
        console.log('route id was ', routeId)
      }
    },

    onEdition: async (mapElement) => {

      let routeId = await getStorage('routeId');
      let mode = await getStorage('mode')

      if (mode === 'edition') {

        console.log('Edition route ' + routeId + ' with mode ' + mode + '!')
        if (drawer.showChangeAdvisory()) {
          if (mapElement.action !== undefined) {
            if (mapElement.action === 'change_coordinates' || mapElement.action === 'move') {
              myRoutes.updateElement(mapElement)
            } else {
              console.log('Uncontrolled action :// !!!' + mapElement.action)
            }
          } else {
            if (mapElement.features[0].geometry.type === 'LineString') {
              let storedLinesAmount = checkFeaturesAmount(route, 'LineString')
              if (storedLinesAmount > 1) {
                console.log('You cannot add more than one route. Delete one!')
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
      } else {
        if (testing) console.log('Uncontrolled action :// !!!' + mapElement.action)
      }

    },

    showChangeAdvisory: () => {
      console.log('showChangeAdvisory', mode, route, routeId)
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

    controls: {

      create: '.mapbox-gl-draw_line',

      edit: '.mapbox-gl-draw_point, .mapbox-gl-draw_polygon, .mapbox-gl-draw_trash',

      delete: '.mapbox-gl-draw_trash',

      creation: () => {
        jQuery(editor.modes.controls.edit).fadeOut()
        jQuery(editor.modes.controls.create).fadeIn()
        editor.modes.setButtons(editor.buttons.delete, editor.buttons.publish)
      },

      edition: (btn1, btn2) => {
        jQuery(editor.modes.controls.create).fadeOut()
        jQuery(editor.modes.controls.edit).fadeIn()
        editor.modes.setButtons(btn1, btn2)
      },

      deletable: (deletable = false) => {
        if (deletable) {
          jQuery(editor.modes.controls.delete).fadeIn()
        } else {
          jQuery(editor.modes.controls.delete).fadeOut()
        }
      }

    },

  }

  const intrConst = async (dtype, element, draw, approved) => {
    let summary = {
      draw: dtype,
      action: element.action,
      id: element.features[0].id,
      type: element.features[0].geometry.type,
      data: element.features[0],
      routeId: await getStorage('routeId'),
      mode: await getStorage('mode'),
      all: draw,
      approved: approved
    }
    setSummary(summary)
  }

  // All the draw actions
  const draw = {

    add: (element, draw) => {
      intrConst('draw.add', element, draw, approved)
    },

    create: async (element, draw, approved = false) => {
      intrConst('draw.create', element, draw, approved)
      /*
      const panojaContent = () => <label>You are in the draw.create movements jejeje what do you do???</label>
      const panojaOk = () => setModal({ show: false })
      modalObj.set('Warning', panojaContent, panojaOk)
      
 
      if (routeId > 0) {
        modalObj.set('Warning', 'Yo cannot paint another route while editing a route...')
      }
 
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
      */
    },

    select: (element, draw, approved = false) => {
      intrConst('draw.select', element, draw, approved)
    },

    update: (element, draw, approved = false) => {
      intrConst('draw.update', element, draw, approved)
      const updateContent = () => <label>Do you want to update this element?</label>
      const updateOk = () => setModal({ show: false })
      //modalObj.set('Warning', updateContent, updateOk)
      /*if(mode=== 'edition'){
        drawer.onEdition(element)
      }else{
        drawer.onCreate(element)
      }*/
    },

    delete: (element, draw, approved = false) => {
      intrConst('draw.delete', element, draw, approved)
      const deleteContent = () => <label>Está seguro de que desea eliminar este contenido?</label>
      const deleteElement = () => {

      }
      modalObj.set('Deleting an object', deleteContent(), deleteElement)
      /*
      if (route.published) {
        console.log('You cannot delete an element while a map is published.\n\nPlease, ubpublish before remove elements')
        return false
      }
 
      var url = ''
      var type = element.features[0].geometry.type
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
 
      let getUrl = url + '?element=' + element.features[0].id
      console.log(getUrl)
      return
      getData(getUrl).then(response => {
        var delUrl = url + '/' + response[0].id
        deleteData(delUrl)
          .then(data => {
            if (data.statusCode === 400) {
              if (testing) console.log('Something was wrong deleting a route element')
            } else {
              Draw.delete()
              Draw.trash()
              if (testing) console.log('The MapElement ' + element.features[0].id + ' with the id ' + data.id + ' was succesfully deleted!!')
            }
          })
      })
      */
    },

  }

  const setLoading = (timeout = 2000) => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), timeout)
  }


  const render = {

    instructionForm: (index) => {

      switch (index) {

        case 0: return <div className=''>
          <div>
            <div className='row'>
              <div className='col-md-10'>
                <Label htmlFor='input' message={routeId > 0 ? 'Route name' : 'Choose route'} />
              </div>
              <div className='col-md-2' style={{ padding: '3%', cursor: 'pointer', textAlign: 'right' }}>
                {routeId > 0 && route && (!isLoading
                  ? <FontAwesomeIcon
                    icon={editingName ? faSave : faPen}
                    color={route.name !== routeName ? '#ffc107' : '#212529'}
                    onClick={() => setEditingName(!editingName)}
                  />
                  : render.loaderInd())}
              </div>
            </div>
            <div className='row'>
              <div className='col-md-12'>
                {routes && !editingName && !isLoading
                  ? routeSelector()
                  : <InputText type='text' name='input'
                    min='10'
                    max='120'
                    value={routeName}
                    disabled={isLoading}
                    placeholder='Loading...'
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                }
                <LoadingBar style={{ width: '100%', opacity: isLoading > 0 ? 99 : 0 }} />
                {route && <div>
                  <div className='row'>
                    <div className='col-md-12'>
                      <label><b>• Created at:</b>
                        {route.created_at}</label>
                    </div>
                  </div>
                  {route.updated_at && <div className='row'>
                    <div className='col-md-12'>
                      <div><b>• Updated at:</b> {route.updated_at}</div>
                    </div>
                  </div>}
                </div>}
              </div>
            </div>
          </div>
        </div>

        case 1: return <Carousel style={{ height: '100px' }}>
          {route && route.places.map((place) =>
            <div className='row'>
              <div className='col-11' style={{ textAlign: 'left' }}>
                <div style={{ display: 'block' }} className={place.name}>{place.description[0].label}</div>
                <div style={{ display: 'block' }} className={place.name}><img src={host + place.images[0].url} alt='' /></div>
                <div style={{ display: 'block', height: '200px', overflowY: 'scroll' }} className={place.name}>{place.description[0].description}</div>
                <Button {...editor.buttons.edit()} />
              </div>
            </div>
          )}
        </Carousel >

        case 2: return <div style={{ display: 'flex' }}>
          {route && route.polygons.map((polygon, index) =>
            <Option
              key={'option-.' + index}
              //onMouseOver={() => { console.log('selecting this polygon', polygon) }}
              onClick={() => draw.delete(polygon)}
              label={'Alert - ' + (index + 1)} margin='0 10px 6px 0'
            />
          )}
        </div>

        case 3: return <div className='' style={{ fontSize: '0.8rem' }}>
          {JSON.stringify(selectedElement)}
        </div>

        case 4: return <div>
          <div className='row'>
            <div className='col-sm-6 col-md-6 col-lg-6' style={{ textAlign: 'center' }}>
              {qrUrl && <QRCode value={qrUrl} />}
            </div>
            <div className='col-sm-6 col-md-6 col-lg-6' style={{ textAlign: 'center' }}>
              {qrUrl && <QRCode value={qrUrl} />}
            </div>
          </div>
          <div className='row'>
            <div className='col-sm-6 col-md-6 col-lg-6' style={{ textAlign: 'center' }}>
              <Button {...button1} />
            </div>
            <div className='col-sm-6 col-md-6 col-lg-6' style={{ textAlign: 'center' }}>
              <Button {...button2} />
            </div>
          </div>
        </div>

      }

    },

    setActiveFold: (index) => {
      let i = index === active && index !== 0 ? '-1' : index
      setActive(i)
    },

    selectInstr: (type) => {
      switch (type) {
        case 'LineString': render.setActiveFold(0); break;
        case 'Point': render.setActiveFold(1); break;
        case 'Polygon': render.setActiveFold(2); break;
        default: render.setActiveFold(-1); break;
      }
    },

    loaderInd: (size) => <LoadingIndicator
      animationTime="0.6s"
      borderWidth="4px"
      borderColor="#f3f3f3"
      borderTopColor="#555555"
      size={size + "px"}
    />


  }

  const modalObj = {

    set: (label, content, onAccept, style) => {
      setModal({
        show: true,
        label: label,
        content: content(),
        style: style || alertModalStyle,
        onAccept: onAccept || console.log('No action! o.o'),
        timestamp: Date.now(),
        options: modalObj.setOptions(onAccept)
      })
      return
    },

    // Setting modal options: minimal is ok (accept close) or cancel (also close :P)
    setOptions: (onAccept) => {
      let opts = []
      if (onAccept) {
        opts.push({
          label: 'Ok',
          color: 'primary',
          onClick: () => onAccept()
        })
      }
      opts.push({
        label: opts === 0 ? 'Ok' : 'Cancel',
        color: opts === 0 ? 'primary' : 'secondary',
        onClick: () => setModal({ show: false })
      })
      return opts
    }

  }

  const routeSelector = () => {
    return <div>
      {routes && routes && <div>
        <Select
          name='selected-route'
          className='primary'
          value={routeId ? routeId : '0'}
          options={routes}
          closeMenuOnSelect={true}
          onChange={({ target: { value } }) => setRouteId(parseInt(value))}>
        </Select>
      </div>}
    </div>
  }

  const setRouteActive = (route,) => {
    let countActive = route ? [
      { count: route !== undefined ? 1 : 0, isActive: route !== null },
      { count: route.places.length, isActive: route.places.length >= 1 },
      { count: route.polygons.length, isActive: true },
      { count: selectedElement !== undefined ? 1 : 0, isActive: selectedElement !== undefined },
      { count: selectedElement !== undefined ? 1 : 0, isActive: selectedElement !== undefined }
    ] : null
    return countActive
  }

  const states = {
    init: async () => editor.init(),
    routeId: () => editor.routes.switch(routeId),
    summary: () => console.log('summary', summary),
    editingName: () => myRoutes.route.update('name')
  }

  useEffect(states.init, [])
  useEffect(states.routeId, [routeId])
  useEffect(states.editingName, [editingName])
  useEffect(states.summary, [summary])

  return <div className='row' style={{ padding: '0', overflowX: 'hidden' }}>
    <div className='col-8' style={{ padding: '0' }}>
      <div>
        <div ref={maparea} className='map-container' />
        <div className='nav-bar'>
          Lat: {focus.lat.toFixed(2)} • Lng: {focus.lng.toFixed(2)} • Zoom: {Math.round(focus.zoom)} • Mode: {mode}{routeId > 0 && ' • Route: ' + routeId}
        </div>
      </div>
    </div>
    <div className='col-4' style={{ padding: '0' }}>
      <div className=''>
        {/*<Header
          className='testeando'
          style={{ width: '100%' }}
          title={{
            label: 'restaurant de Paris',
            cta: {
              icon: 'fa fa-pencil',
              onClick: () => alert('Edit button clicked'),
            },
          }}
          content="Restaurant description"
        />*/}
        {/*<Instructions route={route} instructions={instructions} render={render} active={active} editor={editor}/>*/}
        <ul>
          {instructions && instructions.data.map((instr, index) => {
            let metadata = setRouteActive(route)
            return <li key={'instruction-' + index}>
              <div className='panel' role='tabpanel' aria-expanded={active === index}>
                <button
                  id={'control-row-' + index}
                  className={'panel-label control-row inactived'}
                  role='tab'
                  onClick={() => editor.setOption(instr.action_class, index)}
                >
                  <div className='row'>
                    <div className='col-1' style={{ textAlign: 'center' }}>
                      <img src={host + instr.icon.url} alt=''
                        className={'control-' + index + ' control-icon'}
                        style={{ cursor: 'pointer', maxHeight: '35px' }}
                      />
                    </div>
                    <div className='col-9'>
                      <Label htmlFor='' className='advisory-label'>
                        <span style={{ marginLeft: '10px' }}>
                          {route !== undefined ? instr.translations[0].title : instr.translations[0].label}
                        </span>
                      </Label>
                    </div>
                    <div className='col-1' style={{ paddingTop: '8px' }}>
                      {route && metadata[index].count > 0 && <Count {...metadata[index]} />}
                    </div>
                  </div>
                </button>
                <div className='panel-inner' style={{ display: index === active ? 'block' : 'none' }} aria-hidden={!active !== index}>
                  <div className='panel__content'>
                    <span style={{ marginLeft: '10px' }}>{instr.translations[0].description}</span>
                    {render.instructionForm(index)}
                  </div>
                </div>
              </div>
            </li>
          })}
        </ul>
      </div>
      {modal && <Alert {...modal} />}
    </div >
  </div >

}

export default Editor
