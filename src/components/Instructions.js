/* eslint-disable */
import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Select, Button, InputText, Textarea, Label, Option, Count } from '@buffetjs/core'
import { LoadingBar } from '@buffetjs/styles'
import MapboxGLGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'react-tabs/style/react-tabs.css'
import MapboxGL, { Map, FullscreenControl, GeolocateControl } from 'mapbox-gl'
import jQuery from 'jquery'
import { setStorage, removeStorage, getStorage, getData, Draw, deleteData, getCenter } from '../map-utils.js'
import { host, testing, mapboxToken } from '../hob-const.js'

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader


const Instructions = ({ instructions, route, editor, render, active }) => {

  const setRouteActive = (route) => {
    let countActive = route ? [
      { count: route !== undefined ? 1 : 0, isActive: route !== null },
      { count: route.places.length, isActive: route.places.length >= 1 },
      { count: route.polygons.length, isActive: true },
      { count: selectedElement !== undefined ? 1 : 0, isActive: selectedElement !== undefined },
      { count: selectedElement !== undefined ? 1 : 0, isActive: selectedElement !== undefined }
    ] : null
    return countActive
  }
  

  return <ul>
  {instructions && instructions.data.map((instr, index) => {
    let metadata = setRouteActive(route)
    return <li key={'instruction-' + index}>
      <div className='panel' role='tabpanel' aria-expanded={active === index}>
        <button className='panel-label' role='tab' onClick={() => editor.setOption(instr.action_class, index)}>
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

}

export default Instructions
