/* eslint-disable */
import React, { useState, useEffect } from 'react'
import { Select, Button, InputText, Textarea, Label, Option, Count } from '@buffetjs/core'
import { LoadingBar } from '@buffetjs/styles'
import { host, testing, mapboxToken } from '../../hob-const.js'
import Modal from 'react-modal'
import axios from 'axios'
import { Carousel } from 'react-responsive-carousel'
import "react-responsive-carousel/lib/styles/carousel.min.css"
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

const username = 'asfsdfsa'//get(auth.getUserInfo(), 'firstname', '')  
const user_id = 13//get(auth.getUserInfo(), 'id', '')

const Editor = () => {

  const [mode, setMode] = useState()
  const [center, setCenter] = useState() // Is the calculated center, related with the routes created
  const [mainCenter, setMainCenter] = useState() // Is the calculated center, related with the routes created

  const [routes, setRoutes] = useState() // The loaded routes content related with this client...  
  const [routeId, setRouteId] = useState()
  const [route, setRoute] = useState()

  const [selectedElement, setSelectedElement] = useState() // The selected route data

  const [button1, setButton1] = useState()
  const [button2, setButton2] = useState()

  const [instructions, setInstructions] = useState()

  const editor = {

    init: () => {
      editor.routes.set()
      editor.instructions.init()
      editor.modes.creation()
      if (!user_id) history.go(0)
      localStorage.setItem('user_id', user_id)
      //setRouteId('224')
    },

    launchOption: (e, type) => {
      jQuery('.mapbox-gl-draw_' + type).click()
      console.log(e.className)
    },

    routes: {

      set: () => {
        // Getting the routes hosted by the client...
        let get = host + '/routes?creator=' + user_id
        axios.get(get).then(editor.routes.process)
      },

      process: (routes) => {

        if (!routes) return

        // Setting center...
        let routesCenter = getCenter(routes.data)
        setCenter(routesCenter)

        // Also storing main center for later if back to no one menu...
        setMainCenter(routesCenter)

        // Setting routes...
        let options = getRoutesList(routes.data)
        setRoutes(options)

        // Setting mode...
        editor.modes.creation()

      },

      switch: () => {
        if (routeId === '0') {
          // Clearing the routes
          setRoute(undefined)
          setCenter(mainCenter)
          setSelectedElement(undefined)
          editor.modes.creation()
        } else {
          // Getting the route...
          let get = host + '/routes/' + routeId
          axios.get(get).then(editor.modes.edition)
        }
      }

    },

    modes: {

      edition: (route) => {
        setMode('edition')
        //setStorage('mode', 'edition')
        //setStorage('route', route.data)
        setRoute(route.data)
        setRouteId(route.data.id)
        let button1_1 = editor.buttons.delete
        let button2_1 = null
        if (route.data.published) {
          button1_1.disabled = true
          button2_1 = editor.buttons.unpublish
        } else {
          button2_1 = editor.buttons.publish
        }
        editor.modes.controls.edition(button1_1, button2_1)
      },

      creation: () => {
        setMode('creation')
        setStorage('mode', 'creation')
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
          editor.modes.setButtons(editor.buttons.delete, editor.buttons.publish)
        },

        edition: (btn1, btn2) => {
          jQuery(editor.modes.controls.create).fadeOut()
          jQuery(editor.modes.controls.edit).fadeIn()
          editor.modes.setButtons(btn1, btn2)
        },

      },

    },

    instructions: {
      init: async () => axios.get(host + '/instructions').then(setInstructions),
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

  const setRouteName = (name) => {
    let r = route
    r.name = name
    setRoute(r)
  }

  const render = {

    chapHeader: (instr, index) => {
      return <div className='row'>
        <div className='col-sm-1 col-md-1 col-lg-1' style={{ textAlign: 'center' }}>
          <img src={host + instr.icon.url} alt=''
            className={'controls-' + index + ' controls-icon'}
            onClick={(e) => editor.launchOption(e, instr.action_class)}
            style={{ cursor: 'pointer', maxHeight: '35px' }} 
          />
        </div>
        <div className='col-10'>
          <Label htmlFor='' className='advisory-label'>
            <span style={{ marginLeft: '10px' }}>{instr.translations[0].label}</span>
          </Label>
        </div>
        <div className='col-1'>
          <Label htmlFor=''
            style={{ cursor: 'pointer' }}
            className='advisory-label'
          >

          </Label>
        </div>
        <div className='row' >
          <div className='col-sm-12 col-md-12 col-lg-12'>
            {render.chapForms(instr, index)}
          </div>
        </div>
      </div>
    },

    chapForms: (instr, index) => {

      switch (index) {
        case 0: {
          if (route) {
            let count = 1
            let active = route !== null
            return (<div className='' style={{ padding: '45px 0' }}>
              {/*<div style={{ display: 'block' }} className={instr.action_class}>{instr.description}</div>*/}
              <Count count={count} isActive={active} />
              <Label htmlFor="input" message="Route name" />
              <InputText type='text' name="input" value={route.name} onChange={(e) => { setRouteName(e.target.value) }} />
            </div>)
          }
        } break

        case 1: {
          if (route) {
            let count = route.places.length
            let active = route.places.length > 1
            return (<Carousel style={{ height: '100px' }}>
              <Count count={count} isActive={active} />
              {route.places.map((place) => {
                return <div className=''><button type='button'>{place.name}</button></div>
              })}
            </Carousel>)
          }
        } break

        case 2: {
          if (route) {
            let count = route.polygons.length
            let active = true
            return (<div style={{ display: 'flex' }}>
              <Count count={count} isActive={active} />
              {route.polygons.map((polygon, index) => {
                return <Option
                  key={'option-.' + index}
                  onMouseOver={() => { console.log('selecting this polygon', polygon) }}
                  onClick={() => { console.log('- Clicking a panel polygon', polygon) }}
                  label={'Alert - ' + (index + 1)} margin="0 10px 6px 0" />
              })}
            </div>)
          }
        } break

        case 3: {
          return (
            <div className='' style={{ fontSize: '0.8rem' }}>
              {JSON.stringify(selectedElement)}
            </div>)
        } break

        case 4: {
          if (route) {
            return <div className='row'>
              <div className='col-sm-6 col-md-6 col-lg-6' style={{ textAlign: 'center' }}><Button {...button1} /></div>
              <div className='col-sm-6 col-md-6 col-lg-6' style={{ textAlign: 'center' }}><Button {...button2} /></div>
            </div>
          }
        } break

      }

    },

    alertModal: (alert, onAccept, onCancel) => {
      return (
        <Modal
          isOpen={true}
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
          <Button
            label={'Dismiss'}
            color={'error'}
            onClick={closeAlert}
          />
        </Modal>
      )
    },

  }

  useEffect(editor.init, [])
  useEffect(editor.routes.switch, [routeId])

  return <div className='row'>
    <div className='col-sm-7 col-md-7 col-lg-7'>
      {center && <MyMap
        mode={mode}
        route={route}
        center={center}
        setMode={setMode}
        routeId={routeId}
        setCenter={setCenter}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
      />}
    </div>
    <div className='col-sm-5 col-md-5 col-lg-5'>

      <div className='row'>

        <div className='col-sm-12 col-md-12 col-lg-12'>

          {routes && <div>
            <Select
              name='selected-route'
              className='primary'
              value={routeId ? routeId : '0'}
              options={routes}
              closeMenuOnSelect={true}
              style={{ width: '97%' }}
              onChange={({ target: { value } }) => { setRouteId(value) }}>
            </Select>
          </div>
          }

          <div className='advisory-box'>
            <ul>
              {instructions && instructions.data.map((instr, index) =>
                <li key={'route-' + index}>{render.chapHeader(instr, index)}</li>
              )}
            </ul>
          </div>
          {/*<LoadingBar style={{ width: '100%', opacity: isLoading ? 99 : 0 }} />*/}
        </div>
      </div>

      <div className='row'>
        <div className='col-sm-12 col-md-12 col-lg-12' style={{ textAlign: 'center' }}>
          {/*qrUrl && <QRCode value={qrUrl} />*/}
        </div>
      </div>

    </div>

  </div>

}

export default Editor
