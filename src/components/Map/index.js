/* eslint-disable */
import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';

import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'react-tabs/style/react-tabs.css'
import MapboxGL, { Map, FullscreenControl, GeolocateControl } from 'mapbox-gl'
import jQuery from 'jquery'
import { setStorage, removeStorage, getStorage, getData, Draw, deleteData, getCenter } from '../../map-utils.js'
import { host, testing, mapboxToken } from '../../hob-const.js'

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader

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

let MyMap = ({ routeId, route, routes, center, mode, setMode, setCenter, selectedElement, setSelectedElement }) => {

  // MAIN
  localStorage.setItem('STRAPI_UPDATE_NOTIF', true)

  // ABOUT CLIENT!
  const username = 'asdfas'//get(auth.getUserInfo(), 'firstname', '')  
  const user_id = 13 //get(auth.getUserInfo(), 'id', '')

  // REFERENCES
  const maparea = useRef(null)
  const [summary, setSummary] = useState(null)
  const [focus, setFocus] = useState(mapBoxDetails.defCenter)

  const map = {

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
      // Load drqw settings!!!
      map.setDraw()
      map.addControls()
      maparea.current.resize() // Resize map to fit the screen...
    },

    addControls: () => {
      // Adding controls on the  map...
      maparea.current
        .addControl(Draw, 'top-left')
        .addControl(new MapboxLanguage())
        .addControl(new FullscreenControl())
        //.addControl(new GeolocateControl(mapBoxDetails.geolocator))
        .addControl(new MapboxGLGeocoder(mapBoxDetails.MapboxGLGeocoder))
    },

    setDraw: () => {
      // Activate the draw power!!!...

      // COMMON ACTIONS
      maparea.current.on('move', () => map.actions.sweep())
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

    },

    setRoute: (route) => { myRoutes.switch(route) },

    flyTo: (center) => {
      if (!center) return
      setCenter(center)
      maparea.current.flyTo({ center: [center.lng, center.lat], zoom: center.zoom })
    },

    actions: {

      sweep: () => {
        // The map sweeping actions...
        if (!maparea.current) return
        let curFocus = {
          lat: maparea.current.getCenter().lat,
          lng: maparea.current.getCenter().lng,
          zoom: Math.round(maparea.current.getZoom())
        }
        setFocus(curFocus)
      },

      click: (e, selected) => {

        var summary = {
          draw: 'click',
          action: '',
          id: '',
          type: 'mapClick',
          selected: null
        }

        if (selected.features.length === 1) {

          summary = {
            draw: 'click',
            action: 'click',
            id: selected.features[0].id || '',
            type: selected.features[0].geometry.type,
            selected: selected.features[0]
          }

        }

        setSelectedElement(selected)
        setStorage('selected', selected)
        console.log(summary)

      },

    },

  }

  const drawer = {

    //
    reset: () => {
      Draw.deleteAll()
      Draw.trash()
      myRoutes.route.clean()
    },

    selected: (routeData) => {
      // Draw the selected routeData map elements!!!...
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

    launchOption: (type) => jQuery('.mapbox-gl-draw_' + type).click(),

    onCreate: (mapElement) => {

      console.log('onCreate', mode, routeId)

      /*if (routeId === '0') {

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
          if (testing) console.log('Burp...')
        }

      }else{
        console.log('route id was ', routeId)
      }*/

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

    onEdition: (mapElement) => {
      if (mode === 'edition') {
        if (testing) console.log('Edition route ' + routeId + ' with mode ' + mode + '!')
        if (drawer.showChangeAdvisory()) {
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
    }

  }

  let process = useCallback((summary) => {
    console.log('mode', route, mode)
    /*switch (mode) {
      case 'edition': {
        drawer.onEdition(summary)
      } break
      default:
      case 'creation': {
        drawer.onCreate(summary)
      } break
    }*/
  },[route, mode])

  // All the draw actions
  const draw = {

    add: (e, draw) => {
      let summary = {
        draw: 'add',
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0],
        all: draw
      }
      process(summary)
    },

    create: (e, draw) => {
      let summary = {
        draw: 'create',
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0],
        all: draw
      }
      process(summary)
      /*
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

    select: (e, draw) => {
      let summary = {
        draw: 'select',
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0],
        all: draw
      }
      process(summary)
    },

    update: (e, draw) => {
      let summary = {
        draw: 'update',
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0],
        all: draw
      }
      process(summary)
      switch (mode) {
        case 'edition': {
          drawer.onEdition(e)
        } break
        default:
        case 'creation': {
          drawer.onCreate(e)
        } break
      }
    },

    delete: (e, draw) => {

      let summary = {
        draw: 'delete',
        action: e.action,
        id: e.features[0].id,
        type: e.features[0].geometry.type,
        data: e.features[0],
        all: draw
      }

      process(summary)

      if (route.published) {
        console.log('You cannot delete an element while a map is published.\n\nPlease, ubpublish before remove elements')
        return false
      }

      var url = ''
      var type = e.features[0].geometry.type
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

      let getUrl = url + '?element=' + e.features[0].id
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
              if (testing) console.log('The MapElement ' + e.features[0].id + ' with the id ' + data.id + ' was succesfully deleted!!')
            }
          })
      })
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
      //myRoutes.setMarkers(route)// PAINTING COMMON POINTERS!!
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

  const states = {

    init: () => { map.init() },

    route: () => {
      // Loar a route or reset draw...
      drawer.reset()
      if (route)
        myRoutes.load(route)

    },

    center: () => {
      // Set new map center
      map.flyTo(center)
    },

    /*
    routeId: (routeId) => { myRoutes.switch(routeId) },

    routes: (routes) => {
      //myRoutes.load(routes)
    },
    */

  }

  useEffect(() => { states.init() }, [])
  useEffect(() => { states.route() }, [route])
  useEffect(() => { states.center() }, [center])
  //useEffect(() => { states.routeId(routeId) }, [routeId])
  //useEffect(() => { states.routes(routes) }, [routes])

  return <div>
    <div ref={maparea} className='map-container' />
    <div className='nav-bar'>
      Lat: {focus.lat.toFixed(2)} • Lng: {focus.lng.toFixed(2)} • Zoom: {Math.round(focus.zoom)} • Mode: {mode}{routeId > 0 && ' • Route: ' + routeId}
    </div>
  </div>

}

export default MyMap






















/*
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
const [qrUrl, setQrUrl] = useState(null) // QRCode for access this client ;)

// New Place data
const [alertModalStatus, console.logModalStatus] = useState(false)
const [alertModalMessage, console.logModalMessage] = useState('')
const [alertModalLabel, console.logModalLabel] = useState('')
const [alertContent, console.logContent] = useState(null)
const [placeId, setPlaceId] = useState(0)
const [placeName, setPlaceName] = useState('')
const [placeLabel, setPlaceLabel] = useState('')
const [placeDescription, setPlaceDescription] = useState('')
const [placeModalStatus, setPlaceModalStatus] = useState(false)

const [routeMarkers, setRouteMarkers] = useState([])

// EDITOR

const [focus, setFocus] = useState(mapBoxDetails.defCenter)

const [markers, setMarkers] = useState(null)

// Buttons

const [instructions, setInstructions] = useState()
//const [button3, setButton3] = useState()


// OTHERS

if (typeof (window) !== 'undefined') { Modal.setAppElement('body') }


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
            </Label>
            <div style={{ display: 'none' }} className={instr.action_class}>{instr.translations[0].description}</div>
          </li>
        })}
      </ul>
    </div>,

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

  switch: (routeId) => {
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

  setRoute: (routeId)=>{
    myRoutes.switch(routeId)
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

      if (!map) return

      document.querySelectorAll('.mapElement').forEach((el) => el.remove())

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
    maparea.current.on('move', () => map.actions.sweep())
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

    maparea.current.on('draw.add', (e) => draw.add(e, Draw.get()))
    maparea.current.on('draw.create', (e) => draw.create(e, Draw.get()))
    maparea.current.on('draw.update', (e) => draw.update(e, Draw.get()))
    maparea.current.on('draw.delete', (e) => draw.delete(e, Draw.get()))

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
    *//*

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
console.log('You cannot delete an element while a map is published.\n\nPlease, ubpublish before remove elements')
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
//maparea.current.flyTo({ center: [center.lng, center.lat], zoom: center.zoom })
},

actions: {

move: () => {
console.log('map.actions.sweep')
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

if (selected && selected.features.length > 0) {

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
}

},

}

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
console.log(message, label)
return doContinue
},

console.log: (message, label = '', content = null) => {
console.logModalMessage(message)
console.logModalLabel(label)
console.logContent(content)
console.logModalStatus(true)
},

closeAlert: (message) => {
console.logModalStatus(false)
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
*/