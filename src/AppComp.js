import React, { memo } from 'react'
import 'react-tabs/style/react-tabs.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader

import Editor from './components/Editor/index'
import './index.css'

const HomePage = () => {
  localStorage.setItem('STRAPI_UPDATE_NOTIF', true)
  return <Editor/>
}

export default memo(HomePage)
