import MapboxGLDraw from "@mapbox/mapbox-gl-draw";

export function setStorage(key, data, type='json'){
    return ( type === 'json')
        ? localStorage.setItem(key, JSON.stringify(data))
        : localStorage.setItem(key, data)
}

export function getStorage(key, type='json'){
    return (type === 'json')
        ? JSON.parse(localStorage.getItem(key))
        : localStorage.getItem(key);
}

export function removeStorage(key, type='json'){
    return localStorage.removeItem(key);
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
    controls: {
        polygon: true,
        polyline: true,
        marker: true,
        trash: true
    }
});
  
export const customStyles = {
    content : {
        //width                 : '45%',
        top                   : '50%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)'
    }
}

export const messages = {
    chooseRoute : 'Create a route...'
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