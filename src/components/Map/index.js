/* eslint-disable */
import React, { useRef, useState, useEffect, memo } from 'react';

import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'react-tabs/style/react-tabs.css'
import MapboxGL, { Map, FullscreenControl, GeolocateControl } from 'mapbox-gl'
import jQuery from 'jquery'
import { setStorage, removeStorage, getStorage, getData, Draw, deleteData, getCenter } from '../../map-utils.js';

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader

MapboxGL.accessToken = 'pk.eyJ1IjoiZHJ1bGxhbiIsImEiOiJja2l4eDBpNWUxOTJtMnRuejE1YWYyYThzIn0.y7nuRLnfl72qFp2Rq06Wlg'

const MapboxLanguage = require('@mapbox/mapbox-gl-language')

const testing = true

const host = 'https://cms.hoponboard.eu'

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

const MyMap = ({ routeId, route, routes, center, mode, setMode, setCenter }) => {

  // MAIN
  localStorage.setItem('STRAPI_UPDATE_NOTIF', true)

  // ABOUT CLIENT!
  const username = 'asdfas'//get(auth.getUserInfo(), 'firstname', '')  
  const user_id = 13 //get(auth.getUserInfo(), 'id', '')

  // REFERENCES
  const maparea = useRef(null)

  const [focus, setFocus] = useState(mapBoxDetails.defCenter)

  useEffect(()=>{states.init()}, [])
  //useEffect(() => { states.routeId(routeId) }, [routeId])
  useEffect(() => { states.route(route) }, [route])
  useEffect(() => { states.center(center) }, [center])
  useEffect(() => { console.log(routes) }, [routes])

  const states = {

    init: ()=>{
      map.init()
    },

    routeId: (routeId)=>{
      myRoutes.switch(routeId)
    },

    route: (route)=>{

      console.log('drawer reset¡¡¡', route)

      if (route) {
        myRoutes.load(route)
      } else {

        drawer.reset()
      }
    },

    routes:(routes)=>{
      myRoutes.load(routes)
    },

    center: (center)=>{
      map.flyTo(center) 
    }

  }

  let map = {

    init: async () => {
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
    },

    onLoad: () => {
      map.setDraw(true)
      map.addControls()
      maparea.current.resize()
    },

    addControls: () => {
      maparea.current
        .addControl(Draw, 'top-left')
        .addControl(new MapboxLanguage())
        .addControl(new FullscreenControl())
        //.addControl(new GeolocateControl(mapBoxDetails.geolocator))
        .addControl(new MapboxGLGeocoder(mapBoxDetails.MapboxGLGeocoder))
    },

    setDraw: (common) => {

      if (common) {

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

      } else {

        // DRAW ACTIONS
        maparea.current.on('draw.select', (e) => draw.select(e, Draw.change()))

        maparea.current.on('draw.add', (e) => draw.add(e, Draw.getAll()))
        maparea.current.on('draw.create', (e) => draw.create(e, Draw.getAll()))
        maparea.current.on('draw.update', (e) => draw.update(e, Draw.getAll()))
        maparea.current.on('draw.delete', (e) => draw.delete(e, Draw.getAll()))

      }

    },

    setRoute: (route) => {
      console.log('setting:' + route)
      myRoutes.switch(route)
    },

    /*
    
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

      },

    }
    */

    flyTo: (center) => {
      if (!center) return
      setCenter(center)
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

        console.log('lamode', mode)

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

    },

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
      Draw.deleteAll()
      Draw.trash()
      myRoutes.route.clean()
    },

    selected: (routeData) => {

      let selected = { type: 'FeatureCollection', features: [] }
      Draw.add(routeData.map_data.data)
      selected.features.push(routeData.map_data.data)
      if (routeData.places !== undefined) {
        for (let place of routeData.places) {
          let data = place.map_data.data
          Draw.add(data)
          selected.features.push(data)
        }
      }
      if (routeData.polygons !== undefined) {
        for (let polygon of routeData.polygons) {
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

  let modes = {

    view: () => {
      //setMode('view')
      //editor.view()
      //drawer.controls.view()

      //setRouteId(0)
      //if (routeId !== undefined) drawer.reset()
      //map.flyTo(center)
    },

    creation: () => {
      //setMode('creation')
      //drawer.controls.creation()
      //editor.creation()
      //setRouteId(0)
      //drawer.reset()
      //map.flyTo(center)
    },

    edition: (route) => {
      drawer.reset()
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

    load: (route) => {
      modes.edition(route)
    },

    switch: (routeId) => {
      let get = host + '/routes/' + routeId
      fetch(get)
        .then((route) => route.json())
        .then(modes.edition)
        .catch(error => { console.error(error) })
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
          let coords = [
            place.map_data.data.geometry.coordinates[1],
            place.map_data.data.geometry.coordinates[0]
          ]
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
        if (!maparea) return
        document.querySelectorAll('.mapElement').forEach((el) => el.remove())
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

  return <div>
    <div ref={maparea} className='map-container' />
    <div className='nav-bar'>
      Lat: {focus.lat.toFixed(2)} • Lng: {focus.lng.toFixed(2)} • Zoom: {Math.round(focus.zoom)}
    </div>
  </div>

}

export default memo(MyMap)
