import React, { useEffect, useState } from 'react'
import { Select } from '@buffetjs/core';
import { setStorage, getStorage, getRouteType, Draw, customStyles, messages, removeStorage, checkFeaturesAmount, postData } from './map-utils.js';


const host ='http://161.97.167.92:1337';
const routesOrigin = host+'/routes'
const userId = 12

const RouteSelector = () => {

    const [clientRoutes, setClientRoutes] = useState([]);
    useEffect(() => { 
      fetch(routesOrigin+'?created_by='+userId)
        .then((res) => res.json())
        .then(setClientRoutes); 
    },[userId]);
    
    function handleChange(e){
        console.log(e)
        this.props.selectedRoute = e.target.value
    }

    var options = [{ value: '0', color: 'grey', label: messages.chooseRoute }]
    for(var i = 0; i < clientRoutes.length; i++){
      options.push({ value: clientRoutes[i].id.toString(), label: clientRoutes[i].name })
    }
    return <Select
      name="route"
      value={currentRouteId}
      options={options}
      closeMenuOnSelect={true}
      onChange={ (e) => handleChange(e) }
    />

}

export default RouteSelector
