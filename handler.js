'use strict';
const {grabDogs, addDetails} = require('./dogs/dogs')
const {grabManyTearsDogs, getLatestHomepage} = require('./dogs/manytears')
const data = require('./data')
const {send} = require('./mail')


const favourites = []

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

module.exports.updateManyTearsDogs = async event => {
  const promise = new Promise(function(resolve, reject) {
    grabManyTearsDogs([], 0, function(dogs) {
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

module.exports.updateManyTearsLatestDogs = async event => {
  const promise = new Promise(function(resolve, reject) {
    getLatestHomepage(function(dogs) {
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
    const mailingList = JSON.parse(process.env.mailinglist)
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
        let dogMessage = '<li>'+dog.name+'<a href="{url}"><img src="{img}"></a></li>'

        let dogUrl = baseUrl + dog.url
        let dogImg = baseUrl + dog.image

        if (dog.type == 'manytears') {
          dogUrl = dog.url
          dogImg = dog.image
        }
        
        dogMessage = dogMessage.replace('{url}', dogUrl)
        dogMessage = dogMessage.replace('{img}', dogImg)

        message += dogMessage
        text += ' ' + dogUrl + ' '
      })

      message += '</ul>'

      send(mailingList, subject, text, message, (err, info) => {
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
      } else {
        resolve(item)
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

module.exports.watchFavourites = async event => {
  let changedDogs = []
  for (const id of favourites) {
    let dog = await new Promise(function(resolve, reject) {
      data.getFromId(id, function(err, item) {
        if (err) {
          return reject(err)
        }
        return resolve(item)
      })
    })

    let lastHash = dog.hash
    console.log(`${dog.name} has hash ${lastHash}.`)

    let updatedDog = await new Promise(function(resolve, reject) {
      addDetails(dog, function(err, updated) {
        if (err) {
          return reject(err)
        }
        return resolve(updated)
      })
    })

    let newHash = updatedDog.hash

    if (lastHash != newHash) {
      // send email alert for this dog
      changedDogs.push(updatedDog)
    }
  }

  if (changedDogs.length > 0) {
    // send email and update database
    const baseUrl = 'https://www.dogstrust.org.uk'
    const mailingList = JSON.parse(process.env.mailinglist)

    const names = changedDogs.map(dog => {
      return dog.name
    })

    let subject = `${names.join(' ')} Updated!`

    let message = `<h3>${names.join(' ')} Updated</h3>`

    await new Promise(function(resolve, reject) {
      send(mailingList, subject, subject, message, (err, info) => {
        if (err) {
          reject(err)
        } else {
          resolve(info)
        }
      })
    })

    console.log('EMAIL SENT TO MAILING LIST')

    for(const dog of changedDogs) {
      await new Promise(function(resolve, reject) {
        data.update(dog, function(err, data) {
          if (err) {
            return reject(err)
          }
          return resolve()
        })
      })
    }

    console.log('DATABASE UPDATED')
  }
}