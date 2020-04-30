'use strict';
const {grabDogs, addDetails} = require('./dogs/dogs')
const data = require('./data')
const {send} = require('./mail')

module.exports.updateDogs = async event => {
  const promise = new Promise(function(resolve, reject) {
    grabDogs([], 1, function(dogs) {
      console.log(dogs)
      data.insertList(dogs, (err, data) => {
        if (err) {
          reject(err)
        }
      
        resolve()
      })
    })
  })

  return promise
}

module.exports.sendEmail = async event => {
  const promise = new Promise(function(resolve, reject) {
    data.getLatest((err, results) => {
      if (err) {
        console.log(err)
        return reject(err)
      }

      if (results.count < 1) {
        console.log('No new dogs')
        return resolve()
      }

      // Parse the results into an email structure
      const baseUrl = 'https://www.dogstrust.org.uk'

      let subject = 'Latest Dogs Alert: ' + results.count + ' dogs added.'

      let message = '<h3>New Dogs</h3>'
      let text = 'new dogs: '

      message += '<ul>'

      results.items.forEach(dog => {
        let dogMessage = '<li><a href="{url}"><img src="{img}"></a></li>'

        let dogUrl = baseUrl + dog.url
        let dogImg = baseUrl + dog.image
        
        dogMessage = dogMessage.replace('{url}', dogUrl)
        dogMessage = dogMessage.replace('{img}', dogImg)

        message += dogMessage
        text += ' ' + dogUrl + ' '
      })

      message += '</ul>'

      send(['calumforster.play@gmail.com', 'carolinetharia@hotmail.co.uk'], subject, text, message, (err, info) => {
        if (err) {
          reject(err)
        } else {
          resolve(info)
        }
      })
    })
  })
  
  return promise
}

module.exports.enrichDogs = async event => {
  const promise = new Promise(function(resolve, reject) {
    data.needsData(function(err, item) {
      if (err) {
        console.log(err)
        return reject(err)
      }

      if (!item) {
        console.log('NO ITEM TO ENRICH')
        console.log('UPDATING OLDEST ENTRY INSTEAD')
        data.getOldest((err, item) => {
          if (err) {
            reject(err)
          } else {
            resolve(item)
          }
        })
      }
    })
  }).then(item => {
    // process this item inside another promise
    return new Promise(function(resolve, reject) {
      addDetails(item, function(err, enrichedDog) {
        if (err) {
          console.error(err)
          item.errored = true
        }
    
        if (!enrichedDog) {
          enrichedDog = item
        }
    
        // update the dog in the database
        data.update(enrichedDog, function(err, result) {
          if (err) {
            console.error(err)
            return reject(err)
          }
          console.log("Updated " + enrichedDog.name)
          resolve(result)
        })
      })
    })
  })
  return promise
}

module.exports.getDogs = async event => {
  const promise = new Promise(function(resolve, reject) {

    data.getAll((err, dogs) => {
      let response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(dogs)
      }
  
      resolve(response)
    })
  })
  return promise
}