import axios from 'axios'
import { host, testing } from '../hob-const.js'

export const call = async ( url, method, onSuccess = undefined, onError = undefined )=>{

    const onErrorStd = (error) => {

      // Error 😨
      if (error.response) {

        /*
          * The request was made and the server responded with a
          * status code that falls out of the range of 2xx
          */
        console.log(error.response.data, error.response.status, error.response.headers )

      } else if (error.request) {

         /*
          * The request was made but no response was received, `error.request`
          * is an instance of XMLHttpRequest in the browser and an instance
          * of http.ClientRequest in Node.js
          */
        console.log(error.request)

      } else {

        // Something happened in setting up the request and triggered an Error
        console.log('Error', error.message, error)

      }

      return error

    }

    const onSuccessStd = (response) => {
      return response
    }

    axios({ url: host+url, method: method })
        .then(onSuccess ? onSuccess : onSuccessStd)
            .catch(onError ? onError : onErrorStd)

}

export const setData = (setter, result) => {
    return setter(result.data)
}