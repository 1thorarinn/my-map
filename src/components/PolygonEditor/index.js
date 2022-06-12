/* eslint-disable */
import React, {  } from 'react';
import { Option } from '@buffetjs/core'
import { host, testing } from '../../hob-const.js'

const PolygonEditor = ({ route }) => {

  return<div style={{ display: 'flex' }}>
    {route && route.polygons.map((polygon, index) =>
      <Option
        key={'option-.' + index}
        //onMouseOver={() => { console.log('selecting this polygon', polygon) }}
        onClick={() => draw.delete(polygon)}
        label={'Alert - ' + (index + 1)} margin='0 10px 6px 0'
      />
    )}
  </div>

}

export default PolygonEditor
