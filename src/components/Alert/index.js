/* eslint-disable */
import React, { memo } from 'react'
import { Button } from '@buffetjs/core'

import Modal from 'react-modal'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import 'react-tabs/style/react-tabs.css'
import { alertModalStyle } from '../../map-utils.js'

import 'mapbox-gl/dist/mapbox-gl.css'
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css'

const Alert = (modal) => {

  return <div>
    {modal && <Modal
      id={'alert-modal-' + modal.timestamp}
      isOpen={modal.show}
      contentLabel={modal.message}
      style={modal.style || alertModalStyle}
      shouldCloseOnOverlayClick={true}
      ariaHideApp={false}
    >

      <div>

        <div className='row'>
          <div className='col-12'>
            <label style={{ fontSize: '1.8rem' }}>{modal.label}</label>
          </div>
        </div>

        <div className='row' style={{ minHeight: '100px' }}>
          <div className='col-12'>{modal.content}</div>
        </div>

        <div className='row' style={{ }}>
          {modal.options && modal.options.map((option, index) => 
            <div key={'alert-part-'+index} className={'col-' + parseInt(12 / modal.options.length)}>
              <Button
                label={option.label}
                color={option.color || 'primary'}
                onClick={option.onClick}
              />
            </div>          
          )}
        </div>

      </div>

    </Modal>}
  </div>

}

export default memo(Alert)
