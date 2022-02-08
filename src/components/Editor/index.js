/* eslint-disable */
import React, { useState, useEffect, memo } from 'react'
import { Select, Button, InputText, Textarea, Label } from '@buffetjs/core'
import { LoadingBar } from '@buffetjs/styles'

import Modal from 'react-modal'

import 'react-tabs/style/react-tabs.css'
import jQuery from 'jquery'

import { setStorage, getStorage, getData, getRoutesList, Draw, placesModalStyle, putData, deleteData, postData, getCenter } from '../../map-utils.js';

import MyMap from '../../components/Map'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader

//import { get, upperFirst } from 'lodash';
//import { auth, LoadingIndicatorPage } from 'strapi-helper-plugin'

const testing = true
const host = 'https://cms.hoponboard.eu'

const username = 'asfsdfsa'//get(auth.getUserInfo(), 'firstname', '')  
const user_id = 13//get(auth.getUserInfo(), 'id', '')

const Editor = () => {

  const [mode, setMode] = useState()
  const [mainCenter, setMainCenter] = useState() // Is the calculated center, related with the routes created
  const [center, setCenter] = useState() // Is the calculated center, related with the routes created

  const [route, setRoute] = useState()
  const [routeId, setRouteId] = useState()
  const [routes, setRoutes] = useState() // The loaded routes content related with this client...  

  const [button1, setButton1] = useState({ visible: false })
  const [button2, setButton2] = useState({ visible: false })

  const [instructions, setInstructions] = useState()

  useEffect(() => { editor.init() }, [])
  useEffect(() => { editor.routes.switch(routeId) }, [routeId])

  let editor = {

    init: () => {
      editor.routes.getAll()
      editor.instructions.init()
      editor.modes.creation()
      if (!user_id) history.go(0)
      localStorage.setItem('user_id', user_id)
    },

    launchOption: (type) => {
      jQuery('.mapbox-gl-draw_' + type).click()
    },

    routes: {

      getAll: () => {
        // Getting the routes hosted by the client...
        let get = host + '/routes?creator=' + user_id
        fetch(get).then((routes) => routes.json()).then(editor.routes.process)
      },

      switch: (routeId) => {
        if (routeId === '0') {
          // Clearing the routes
          setRoute(undefined)
          setCenter(mainCenter)
          editor.modes.creation()
        } else {
          // Getting the route...
          let get = host + '/routes/' + routeId
          fetch(get).then((route) => route.json()).then(route=>{
            setRoute(route)
            setStorage('routeId', parseInt(routeId))
            editor.modes.edition(route)
          })
        }
      },

      process: (routes) => {

        // Setting center...
        let routesCenter = getCenter(routes)
        setStorage('center', routesCenter)
        setCenter(routesCenter)

        // Also storing main center for later if back to no one menu...
        setMainCenter(routesCenter)

        // Setting routes...
        let options = getRoutesList(routes)
        setRoutes(options)

        // Setting mode...
        editor.modes.creation()

        //return { center: routesCenter, routes: options }

      },

    },

    modes: {

      edition: (route) => {
        setMode('edition')
        setStorage('mode', 'edition')
        setStorage('route', route)
        let button1_1 = editor.buttons.delete
        let button2_1 = null
        if (route.published) {
          button1_1.disabled = true
          button2_1 = editor.buttons.unpublish
        } else {
          button2_1 = editor.buttons.publish
        }
        editor.modes.setButtons(button1_1, button2_1)
        editor.modes.controls.edition()
      },

      creation: () => {
        setMode('creation')
        setStorage('mode', 'creation')
        editor.modes.setButtons(editor.buttons.delete, editor.buttons.publish)
        editor.modes.controls.creation()
      },

      setButtons: (btn1, btn2) => {
        setButton1(btn1)
        setButton2(btn2)
      },

      showCreationAdvisory: () => {
        if (routeId === '0') {
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
  
        edit: '.mapbox-gl-draw_point, .mapbox-gl-draw_polygon,.mapbox-gl-draw_trash',
  
        creation: () => {
          jQuery(editor.modes.controls.edit).fadeOut()
          jQuery(editor.modes.controls.create).fadeIn()
        },
  
        edition: () => {
          jQuery(editor.modes.controls.create).fadeOut()
          jQuery(editor.modes.controls.edit).fadeIn()
        },
  
      },

    },

    instructions: {
      init: async () => fetch(host + '/instructions').then((res) => res.json()).then(setInstructions),
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

  let myRoutes = {

    init: () => {
      myRoutes.get()
      //setQrUrl(host)
    },

    get: () => {
      let get = host + '/routes?creator=' + user_id
      fetch(get)
        .then((routes) => routes.json())
        .then(myRoutes.process)
        .catch(error => { console.error(error) })
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

  return <div className='row'>
    <div className='col-sm-8 col-md-8 col-lg-8'>
      {center && <MyMap
        mode={mode}
        route={route}
        center={center}
        setMode={setMode}
        routeId={routeId}
        setCenter={setCenter}
      />}
    </div>
    <div className='col-sm-4 col-md-4 col-lg-4'>
      <div>
        <div className='row'>
          <div className='col-6' style={{ textAlign: 'center' }}><Button {...button1} /></div>
          <div className='col-6' style={{ textAlign: 'center' }}><Button {...button2} /></div>
        </div>

        <div className='row'>
          <div className='col-sm-12 col-md-12 col-lg-12'>

            {routes && <div>
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

            <div className='advisory-box'>
              <ul>
                {instructions && instructions.map((instr, index) => {
                  return <li key={'route-' + index} style={{ cursor: 'pointer' }} onClick={() => editor.launchOption(instr.action_class)} >
                    <Label htmlFor='' style={{ cursor: 'pointer' }} className={'advisory'} >
                      <img src={host + instr.icon.url} style={{ cursor: 'pointer', maxHeight: '35px' }} alt='' />
                      <span style={{marginLeft: '10px'}}>
                        {instr.translations[0].label}
                      </span>
                    </Label>
                    <div style={{ display: 'none' }} className={instr.action_class}>{instr.translations[0].description}</div>
                  </li>
                })}
              </ul>
            </div>
            {/*<LoadingBar style={{ width: '100%', opacity: isLoading ? 99 : 0 }} />*/}
          </div>
        </div>

        <div className='row'>
          <div className='col-sm-12 col-md-12 col-lg-12' style={{ textAlign: 'center' }}>
            {/*qrUrl && <QRCode value={qrUrl} />*/}
            <br /><br /><br /><br />
            • Mode: {mode} • Route: {routeId} • center: {JSON.stringify(center)}
          </div>
        </div>

      </div>
    </div>
  </div>

}

export default memo(Editor)
