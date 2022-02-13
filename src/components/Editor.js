/* eslint-disable */
import React, { useState, useEffect } from 'react'
import { Select, Button, InputText, Textarea, Label, Option, Count } from '@buffetjs/core'
import { LoadingBar } from '@buffetjs/styles'
import { host, testing, mapboxToken } from '../hob-const.js'
import Modal from 'react-modal'
import axios from 'axios'
import { Carousel } from 'react-responsive-carousel'
import "react-responsive-carousel/lib/styles/carousel.min.css"
import 'react-tabs/style/react-tabs.css'
import jQuery from 'jquery'
import QRCode from 'qrcode.react'
import { setStorage, getStorage, getData, getRoutesList, Draw, placesModalStyle, putData, deleteData, postData, getCenter } from '../map-utils.js';

import MyMap from './Map'
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
  const [route, setRoute] = useState()
  const [routeId, setRouteId] = useState(0)
  const [routeName, setRouteName] = useState()

  const [selectedElement, setSelectedElement] = useState() // The selected route data
  const [summary, setSummary] = useState(null)

  const [button1, setButton1] = useState()
  const [button2, setButton2] = useState()
  const [qrUrl, setQrUrl] = useState(null) // QRCode for access this client ;)

  const [active, setActive] = useState(-1)
  const [instructions, setInstructions] = useState()

  const editor = {

    init: () => {
      editor.routes.set()
      editor.instructions.init()
      editor.modes.creation()
      if (!user_id) history.go(0)
      localStorage.setItem('user_id', user_id)
      setQrUrl(host)
      //setRouteId('245')
    },

    launchOption: (type, index) => {
      if (type) jQuery('.mapbox-gl-draw_' + type).click()
      jQuery('.control-icon').removeClass('blink-slow')
      jQuery('.control-' + index).addClass('blink-slow')
      render.setActiveFold(index)
    },

    routes: {

      set: () => {
        // Getting the routes hosted by the client...
        let get = host + '/routes?creator=' + user_id
        axios.get(get).then(editor.routes.process)
      },

      process: (routes) => {

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
      },

      reload: () => {
        if (routeId !== '0') {
          // Getting the route...
          let get = host + '/routes/' + routeId
          axios.get(get).then(route => {
            setRoute(route.data)
          })
        }
      }

    },

    modes: {

      edition: (route) => {
        setMode('edition')
        setRoute(route.data)
        setRouteId(route.data.id)
        setRouteName(route.data.name)
        let button1_1 = editor.buttons.delete
        let button2_1 = null
        if (route.data.published) {
          button1_1.disabled = true
          button2_1 = editor.buttons.unpublish
        } else {
          button1_1.disabled = false
          button2_1 = editor.buttons.publish
        }
        editor.modes.controls.edition(button1_1, button2_1)
        jQuery('.control-icon').removeClass('blink-slow')
        jQuery('.control-0').addClass('blink-slow')
        setActive(0)
      },

      creation: () => {
        setMode('creation')
        setStorage('mode', 'creation')
        editor.modes.controls.creation()
        jQuery('.control-icon').removeClass('blink-slow')
        setActive(-1)
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
          //jQuery(editor.modes.controls.create).fadeIn()
          jQuery(editor.modes.controls.create).fadeOut()
          editor.modes.setButtons(editor.buttons.delete, editor.buttons.publish)
        },

        edition: (btn1, btn2) => {
          jQuery(editor.modes.controls.create).fadeOut()
          //jQuery(editor.modes.controls.edit).fadeIn()
          jQuery(editor.modes.controls.edit).fadeOut()
          editor.modes.setButtons(btn1, btn2)
        },

      },

    },

    instructions: {
      init: async () => axios.get(host + '/instructions').then(setInstructions),
    },

    buttons: {

      edit: (funcName) => {
        return {
          label: 'Edit',
          color: 'primary',
          disabled: false,
          visible: true,
          className: 'my-button',
          onClick: (e) => { funcName ? funcName() : route.edit() }
        }
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
        onClick: (e) => { route.publish() }
      },

      unpublish: {
        label: 'Unpublish',
        color: 'success',
        disabled: false,
        visible: true,
        className: 'my-button',
        onClick: (e) => { route.unpublish() }
      }

    },

    actions: {

      deletePolygon: (polygon)=>{
        console.log('- Action delete polygon', polygon)
      }

    }

  }

  const setRouteNameAction = (name) => {
    let r = route
    r.name = name
    setRouteName(name)
    setRoute(r)
  }

  const render = {

    instructionForm: (index) => {

      if (!route) return

      switch (index) {

        case 0: return <div className=''>
          {/*<div style={{ display: 'block' }} className={instr.action_class}>{instr.description}</div>*/}
          <Label htmlFor="input" message="Route name" />
          <InputText type='text' name="input"
            min-length='10'
            max-length='120'
            value={routeName}
            onChange={(e) => setRouteNameAction(e.target.value)} />
        </div>

        case 1: return <Carousel style={{ height: '100px' }}>
          {route.places.map((place) =>
            <div className='row'>
              <div className='col-11' style={{ textAlign: 'left' }}>
                <div style={{ display: 'block' }} className={place.name}>{place.description[0].label}</div>
                <div style={{ display: 'block' }} className={place.name}><img src={host + place.images[0].url} alt='' /></div>
                <div style={{ display: 'block', height: '200px', overflowY: 'scroll' }} className={place.name}>{place.description[0].description}</div>
                <Button {...editor.buttons.edit(console.log)} />
              </div>
            </div>
          )}
        </Carousel >

        case 2: return <div style={{ display: 'flex' }}>
          {route.polygons.map((polygon, index) =>
            <Option
              key={'option-.' + index}
              //onMouseOver={() => { console.log('selecting this polygon', polygon) }}
              onClick={() => editor.actions.deletePolygon(polygon)}
              label={'Alert - ' + (index + 1)} margin="0 10px 6px 0"
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
      let i = index === active ? '-1' : index
      setActive(i)
      jQuery('.control-icon').removeClass('blink-slow')
      jQuery('.control-' + i).addClass('blink-slow')
    },

    alertModal: (message, onAccept, onCancel) => {
      return (
        <Modal
          isOpen={true}
          contentLabel={''}
          style={alertModalStyle}
          shouldCloseOnOverlayClick={true}
        >
          <div style={{ minHeight: '90%', textAlign: 'center' }}>
            <Label htmlFor='input' style={{ color: 'white' }} message={message} />
            <Label htmlFor='input' message={message} />
            <div>{message}</div>
          </div>
          <Button
            label={'OK'}
            color={'warning'}
            onClick={()=>onAccept()}
          />
          <Button
            label={'Dismiss'}
            color={'error'}
            onClick={onCancel()}
          />
        </Modal>
      )
    },

  }

  useEffect(editor.init, [])
  useEffect(editor.routes.switch, [routeId])

  return <div className='row' style={{ padding: '0', overflowX: 'hidden' }}>
    <div className='col-8' style={{ padding: '0' }}>
      {center && <MyMap
        mode={mode}
        route={route}
        center={center}
        routeId={routeId}
        setMode={setMode}
        setCenter={setCenter}
        setActive={setActive}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        editor={editor}
        setSummary={setSummary}
      />}
    </div>
    <div className='col-4' style={{ padding: '0' }}>
      {routes && <div>
        <Select
          name='selected-route'
          className='primary'
          value={routeId ? routeId : '0'}
          options={routes}
          closeMenuOnSelect={true}
          onChange={({ target: { value } }) => setRouteId(value)}>
        </Select>
      </div>}
      <div className=''>
        <ul>
          {instructions && instructions.data.map((instr, index) => {
            let pinga = route ? [
              { count: route !== undefined ? 1 : 0, isActive: route !== null },
              { count: route.places.length, isActive: route.places.length >= 1 },
              { count: route.polygons.length, isActive: true },
              { count: selectedElement !== undefined ? 1 : 0, isActive: selectedElement !== undefined }
            ] : null
            return <li key={'instruction-' + index}>
              <div className='panel' role='tabpanel' aria-expanded={active === index}>
                <button className='panel-label' role='tab' onClick={() => editor.launchOption(instr.action_class, index)}>
                  <div className='row'>
                    <div className='col-1' style={{ textAlign: 'center' }}>
                      <img src={host + instr.icon.url} alt=''
                        className={'control-' + index + ' control-icon'}
                        style={{ cursor: 'pointer', maxHeight: '35px' }}
                      />
                    </div>
                    <div className='col-9'>
                      <Label htmlFor='' className='advisory-label'>
                        <span style={{ marginLeft: '10px' }}>{route !== undefined ? instr.translations[0].title : instr.translations[0].label} </span>
                      </Label>
                    </div>
                    <div className='col-1' style={{ paddingTop: '8px' }}>
                      {route && <Count {...pinga[index]} />}
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
        <div>
          <div className='row'>
            <div className='col-1' style={{ textAlign: 'center' }}>
              {JSON.stringify(summary)}
            </div>
            <div className='col-10'>
              <Label htmlFor='' className='advisory-label'>
              </Label>
            </div>
            <div className='col-1' style={{ paddingTop: '8px' }}>
            </div>
          </div>
        </div>
      </div>
      {/*<LoadingBar style={{ width: '100%', opacity: isLoading ? 99 : 0 }} />*/}
    </div >
  </div >

}

export default Editor
