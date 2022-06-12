/* eslint-disable */
import React, {  } from 'react';
import 'react-tabs/style/react-tabs.css'
import { setStorage, getStorage, Draw } from '../../map-utils.js'
import { host, testing } from '../../hob-const.js'
import { Carousel } from 'react-responsive-carousel'
import { call, setData } from '../Utils.js'

import 'react-responsive-carousel/lib/styles/carousel.min.css' // requires a loader

const Places = ({ route }) => {

  //const setPlace = (index)=>{
  //  console.log('https://cms.hoponboard.eu/admin/plugins/content-manager/collectionType/application::my-places.my-places/'+index)
  //}

  const place  = {

    getA: async (element) => {
      
      const onSuccess = (result) => {
        return setData(setPlace, result)
      }

      call('/my-places?element=' + element, onSuccess)

    },

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

    editModal: (place) => {        
      modalObj.set(
        'Set the place data',
        () => myRoutes.place.editForm(place),
        () => { console.log('- Saving the place'); },
        placesModalStyle
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

  }

  return <Carousel showThumbs={false} style={{ height: '100px' }}>
    {route && route.places.map((place) => {         

      return <div key={'place_'+place.id} /*onClick={()=>{setPlace(place.id)}}*/>

        <div className='row'>
          <div className='col-md-12' style={{ padding: '3%', cursor: 'pointer', textAlign: 'left' }}>
            {place.description[0].label}
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12' style={{ padding: '3%', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'block' }} className={'place-'+place.id}>
              {place.images
                ? <img src={host + place.images[0].url} alt='' onClick={(e)=>{
                  console.log('Add picture modal or call to file uploader!!!')}
                }/>
                : 'Add images'
              }
            </div>
          </div>
        </div>

        <div className='row' onClick={()=>{console.log('edit description')}}>
          <div className='col-md-12' style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'block', height: '200px', overflowY: 'scroll' }}>
              {place.description[0].description}
            </div>
          </div>
        </div>
      
      </div>

    })}
  </Carousel >

}

export default Places
