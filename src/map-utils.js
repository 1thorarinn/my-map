import MapboxGLDraw from "@mapbox/mapbox-gl-draw";

const setUserKey = (key) => {
    let user_id = localStorage.getItem('user_id')
    return user_id + '::' + key
}

export const setStorage = (key, data, type = 'json') => {
    let newKey = setUserKey(key)
    let ret = (type === 'json')
        ? localStorage.setItem(newKey, JSON.stringify(data))
        : localStorage.setItem(newKey, data)
    return ret
}

export const getStorage = async (key, type = 'json', def = '') => {
    let newKey = setUserKey(key)
    let res = ''
    if (def !== '') {
        res = def
        setStorage(newKey, def, type)
    } else {
        res = (type === 'json')
            ? JSON.parse(localStorage.getItem(newKey))
            : localStorage.getItem(newKey)
    }
    return res
}

export const removeStorage = (key) => {
    let newKey = setUserKey(key)
    return localStorage.removeItem(setUserKey(newKey));
}

export const getRouteType = (data = [], type = 'Point') => {
    for (let i = 0; i < data.features.length; i++) {
        if (data.features[i].geometry.type === type) {
            return data.features[i]
        }
    }
}

export const Draw = new MapboxGLDraw({
    displayControlsDefault: true,
    drawing: true,
    mode: 'draw_line_string',
    controls: {
        polygon: true,
        polyline: true,
        marker: true,
        trash: true
    },
    styles: [
        // ACTIVE (being drawn)
        // line stroke
        {
            "id": "gl-draw-line",
            "type": "line",
            "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#D20C0C",
                "line-dasharray": [0.2, 2],
                "line-width": 2
            }
        },
        // polygon fill
        {
            "id": "gl-draw-polygon-fill",
            "type": "fill",
            "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
                "fill-color": "#D20C0C",
                "fill-outline-color": "#D20C0C",
                "fill-opacity": 0.1
            }
        },
        // polygon mid points
        {
            'id': 'gl-draw-polygon-midpoint',
            'type': 'circle',
            'filter': ['all',
                ['==', '$type', 'Point'],
                ['==', 'meta', 'midpoint']],
            'paint': {
                'circle-radius': 3,
                'circle-color': '#fbb03b'
            },
        },
        {
            // polygon outline stroke
            // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
            "id": "gl-draw-polygon-stroke-active",
            "type": "line",
            "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#D20C0C",
                "line-dasharray": [0.2, 2],
                "line-width": 2
            }
        },
        // vertex point halos
        {
            "id": "gl-draw-polygon-and-line-vertex-halo-active",
            "type": "circle",
            "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            "paint": {
                "circle-radius": 5,
                "circle-color": "#FFF"
            }
        },
        // vertex points
        {
            "id": "gl-draw-polygon-and-line-vertex-active",
            "type": "circle",
            "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            "paint": {
                "circle-radius": 3,
                "circle-color": "#D20C0C",
            }
        },        

        // INACTIVE (static, already drawn)
        // line stroke
        {
            "id": "gl-draw-line-static",
            "type": "line",
            "filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#000",
                "line-width": 3
            }
        },
        // polygon fill
        {
            "id": "gl-draw-polygon-fill-static",
            "type": "fill",
            "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            "paint": {
                "fill-color": "#000",
                "fill-outline-color": "#000",
                "fill-opacity": 0.1
            }
        },
        // polygon outline
        {
            "id": "gl-draw-polygon-stroke-static",
            "type": "line",
            "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#000",
                "line-width": 3
            }
        }
    ]
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
    chooseRoute: 'Select to edit...'
}

// Checking stored LiveMap
export const checkFeaturesAmount = (data = [], type = 'Point') => {
    let amount = 0
    for (let i = 0; i < data.features.length; i++) {
        if (data.features[i].geometry.type === type) {
            amount++
        }
    }
    return amount
}

export const makeId = (length) => {
    let result = [];
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}

export const postData = async (url = '', data = {}) => {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    }).catch(function (error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export const putData = async (url = '', data) => {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    }).catch(function (error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export const deleteData = async (url = '') => {
    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }).catch(function (error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export const getData = async (url = '') => {

    // Opciones por defecto estan marcadas con un *
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }).catch(function (error) {
        console.log(error);
    });
    return response.json(); // parses JSON response into native JavaScript objects

}