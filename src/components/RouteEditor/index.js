/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { InputText, Label } from '@buffetjs/core'
import { LoadingBar } from '@buffetjs/styles'

import { host, testing } from '../../hob-const.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faSave } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

import 'react-tabs/style/react-tabs.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

const RouteEditor = ({ routeId, route, isLoading, render, myRoutes, setLoading, editor }) => {

  const icons = { save: faSave, edit: faPen, loading: faPen }
  const [icon, setIcon] = useState('edit')

  const colors = { default : '#212529', edited : '#ffc107', success : '#60bb26' }
  const [color, setColor] = useState('default')

  const t = (input) => { return input }
  //opacity: isLoading > 0 ? 99 : 0

  const [routeName, setRouteName] = useState()
  const [editingName, setEditingName] = useState(false)
  
  const objRoute =  useMemo(() => {
  
    return {

      load: async () => {
        if(route) setRouteName(route.name)
      },

      editingName: ()=>{
        if(route){
          if(!routeName){
            setRouteName(route.name)
          }
          if(editingName){
            setIcon(editingName ? 'save' : 'edit')
            console.log('editando nombre')
          }else{
            console.log('No editando nombre', routeName)
            let routeNameChanged = routeName !== route.name
            if(routeNameChanged){
              objRoute.update('name', routeName)
            }
          }
        }
      },

      setRouteName: ()=>{
        if(route){
          let routeNameChanged = routeName === route.name
          setColor(routeNameChanged ? 'edited' : 'default')
        }
      },


      update: (type, value) => {
        if (!route) return
        let onChangeName = !editingName && routeName !== route.name;
        if (onChangeName) setLoading()
        setLoading(3000)
        switch (type) {
          case 'name': {
            if (onChangeName) {
              let data = { "name": value }
              axios.put(host + '/routes/' + routeId, data)
                //.then(myRoutes.route.reload)
                .then(editor.routes.get)
                .then(setLoading(0))
            }
          } break;
        }
      }

    }

  },[ route, editingName, setColor, setIcon ])

  useEffect(()=> objRoute.load(), [objRoute, route])
  useEffect(()=> objRoute.editingName(), [editingName])
  useEffect(()=> objRoute.setRouteName(), [routeName])

  return <div className=''>
    <div>
      <div className='row'>
        <div className='col-md-10'>
          <Label htmlFor='input' message={route ? 'Route name' : 'Choose route'} />
        </div>
        <div className='col-md-2' style={{ padding: '3%', cursor: 'pointer', textAlign: 'right' }}>
          {route && (isLoading
            ? render.loaderInd()
            : <FontAwesomeIcon
                icon={icons[icon]}
                color={colors[color]}
                onClick={() => {setEditingName(!editingName)}}
              />
          )}
        </div>
      </div>
      <div className='row'>
        <div className='col-md-12'>
          {route ? ( ! editingName 
            ? render.routeSelector()
            : <InputText type='text' name='input'
                min='10'
                max='120'
                value={routeName} 
                disabled={isLoading}
                placeholder={t('Loading...')}
                onChange={(e) => setRouteName(e.target.value)}
              />
          ) : render.routeSelector()}
          <LoadingBar style={{ width: '100%', opacity: isLoading > 0 ? 99 : 0 }} />
            {route && <div>
              <div className='row'>
                <div className='col-md-12'>
                  <label><b>• {t('Created at')}:</b> {route.created_at}</label>
                </div>
              </div>
              {route.updated_at && 
                <div className='row'>
                  <div className='col-md-12'>
                    <label><b>• {t('Updated at')}:</b> {route.updated_at}</label>
                  </div>
                </div>
              }
              {route.published && 
                <div className='row'>
                  <div className='col-md-12'>
                    <label><b>• Published:</b> {route.published ? 'yes' : 'no'}</label>
                  </div>
                </div>
              }
              </div>
            }
          </div>
        </div>
      </div>
    </div>


}

export default RouteEditor
