const cheerio = require('cheerio')
const axios = require('axios').default
const crypto = require('crypto')

const urls = {
    list: "https://www.dogstrust.org.uk/rehoming/dogs/filters/~~~~~n~/page/{page}",
    dog: "https://www.dogstrust.org.uk/rehoming/dogs/dog/filters/~~~~~n~/{id}"
}

/**
 * Return an array of all dogs from the dogs trust website
 * to the callback function.
 */
function grabDogs(list, page, callback) {
    console.log('Page ' + page)
    axios.get(urls.list.replace('{page}', page))
        .then(function(response) {
            let $ = cheerio.load(response.data)
            $('.grid__element').each(function(i, elem) {
                let newDog = {}
                newDog.name = $(this).children('h3').text().trim()
                newDog.url = $(this).attr('href')
                newDog.image = $(this).find('.img-responsive').attr('src')
                newDog.id = newDog.url.match(/\/(\d+?)\//)[1] || newDog.url

                list.push(newDog)
            })
            if ($('.btn--next').length) {
                return grabDogs(list, ++page, callback)
            } 
            else {
                return callback(list)
            }
        })
}

/**
 * Add details to a dog object and return the enriched dog
 * to the callback function.
 * @param {Object} dog 
 * @param {function} callback 
 */
function addDetails(dog, callback) {
    let dogPage = urls.dog.replace('{id}', dog.id)

    axios.get(dogPage, {maxRedirects: 0})
        .then(function(response) {
            let $ = cheerio.load(response.data)

            let data = {}
            data.centre = $('.dog-meta__label:contains(Centre)').next().text().trim() || 'NA'
            data.breed = $('.dog-meta__label:contains(Breed)').next().text().trim() || 'NA'
            data.age = $('.dog-meta__label:contains(Age)').next().text().trim() || 'NA'
            data.sex = $('.dog-meta__label:contains(Sex)').next().text().trim() || 'NA'
            
            data.reserved = false
            
            if ($('.label--reserved').length) {
                data.reserved = true
            }

            data.attributes = []
            $('.dog-attributes').find('span').each((index, attribute) => {
                data.attributes.push($(attribute).text().trim())
            })

            dog.data = data

            // calculate hash of page
            var shasum = crypto.createHash('sha1')
            shasum.update($('.dog-profile > .panel > .panel-body').html())
            dog.hash = shasum.digest('base64')
            
            callback(null, dog)
        }).catch(err => {
            console.log('Dog has been removed.')
            callback(err)
        })
}

/**
 * Return a list which has filtered out all reserved dogs.
 * @param {Array} allDogs 
 */
function removeReserved(allDogs) {
    return []
}

module.exports = {
    grabDogs: grabDogs,
    addDetails: addDetails
}