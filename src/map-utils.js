import MapboxGLDraw from "@mapbox/mapbox-gl-draw";

export function setStorage(key, data, type='json'){
    var newKey = setUserKey(key)
    var ret = ( type === 'json')
        ? localStorage.setItem(newKey, JSON.stringify(data))
        : localStorage.setItem(newKey, data)
    return ret
}

function setUserKey(key){    
    //let user_id = localStorage.getItem('user_id')
    //return user_id+'::'+
    return key
}

export function getStorage(key, type='json', def=''){
    var newKey = setUserKey(key)
    var res = ''
    if(def !== ''){
        res = def
        setStorage(newKey, def, type)
    }else{
        res = (type === 'json')
            ? JSON.parse(localStorage.getItem(newKey))
            : localStorage.getItem(newKey);
    }
    return res
}

export function removeStorage(key){
    return localStorage.removeItem(setUserKey(key));
}

export function getRouteType(data=[], type='Point'){
    for(var i=0; i < data.features.length; i++){
        if( data.features[i].geometry.type === type){
            return data.features[i]
        } 
    }
}

export const Draw = new MapboxGLDraw({
    displayControlsDefault: true,
    drawing: true,
    controls: {
        polygon: true,
        polyline: true,
        marker: true,
        trash: true
    }
});
  
export const placesModalStyle = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(125, 125, 125, 0.75)',
        overflow: 'hidden',
        zIndex: 3,
    },
    content: {
        position: 'absolute',
        top: '70px', left: '25%', right: '25%', bottom: '70px',
        border: '1px solid #ccc',
        background: '#fff',
        overflow: 'hidden',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '4px',
        outline: 'none',
        padding: '40px',
        zIndex: 4,
    }
}

export const alertModalStyle = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(125, 125, 125, 0.75)',
        overflow: 'hidden',
        zIndex: 3,
    },
    content: {
        position: 'absolute',
        top: '35%', left: '30%', right: '30%', bottom: '30%',
        border: '1px solid #ccc',
        background: '#fff',
        overflow: 'hidden',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '4px',
        outline: 'none',
        padding: '40px',
        textAlign: 'center',
        zIndex: 4,
    }
  }

export const messages = {
    chooseRoute : 'Select a route...'
}

// Checking stored LiveMap
export function checkFeaturesAmount(data=[], type='Point'){
    let amount = 0
    for(var i=0; i < data.features.length; i++){
        if( data.features[i].geometry.type === type){
            amount++
        } 
    }
    return amount
}

export function makeId(length) {
    var result           = [];
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * 
 charactersLength)));
   }
   return result.join('');
}

export async function postData(url = '', data = {}) {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: { 'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    }).catch(function(error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export async function putData(url = '', data) {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: { 'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    }).catch(function(error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export async function deleteData(url = '') {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: { 'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }).catch(function(error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export async function getData(url = '') {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: { 'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }).catch(function(error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
}