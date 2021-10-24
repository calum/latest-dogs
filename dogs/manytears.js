const cheerio = require('cheerio')
const axios = require('axios').default

const urls = {
    dog: "https://www.manytearsrescue.org/display_all_mtar_dogs.php?counter={counter}",
    image: "https://www.manytearsrescue.org/{image}",
    list: "https://www.manytearsrescue.org/dogslookingforhomes.php",
    dogLink: "https://www.manytearsrescue.org/{link}"
}

/**
 * Return an array of all dogs from the many tears website
 * to the callback function.
 * 
 * Begin the loop with list = [] and counter = 0.
 * 
 * List first link: #container > table:nth-child(2) > tbody > tr:nth-child(2) > td > a
 * Next button: #button_div > form:nth-child(3) > input.strong_bttn
 * 
 */   
function grabManyTearsDogs(list, counter, callback) {
    console.log('Getting the ' + counter + ' dogs from many tears...')
    
    let dogUrl = urls.dog.replace('{counter}', counter)
    axios.get(dogUrl).then(function(response) {
        let $ = cheerio.load(response.data)

        let availability = $('#content > div.center > div.main > div.box > div.panel > table > tbody > tr:nth-child(1) > td > font').text()
        if (availability == "Reserved") {
            return callback(list)
        }

        let newDog = {}
        newDog.name = $('#content > div.center > h2').text()
        newDog.url = dogUrl
        newDog.image = urls.image.replace('{image}', $('#image2 > img').attr('src'))
        newDog.id = $('#content > div.center > div.main > div.box > div.panel > table > tbody > tr:nth-child(1) > td > p:nth-child(3)').children()[0].next.data.replace(':','').trim()
        newDog.type = "manytears"

        list.push(newDog)

        return grabManyTearsDogs(list, ++counter, callback)

    })
}

/**
 * Get the latest  dogs from the homepage
 * 
 */
function getLatestHomepage(callback) {
    console.log("getting latest dogs from the homepage...")

    axios.get(urls.list).then(function(response) {
        let $ = cheerio.load(response.data)

        let table = $('#the_table > tbody').children()

        console.log("looking at " + table.length + " dogs.")

        let dogs = []

        table.each(function () {
            let $ = cheerio.load(this)

            let name = $('tr:nth-child(2) > td > a').text()

            console.log('Grabbing info for ' + name)

            let newDog = {}
            newDog.name = name
            newDog.url = urls.dogLink.replace('{link}', $('a').attr('href'))
            newDog.image = urls.image.replace('{image}', $('img').attr('src'))
            newDog.id = $('a').attr('href').match(/display\_mtar\_dog\.php\?id=(.+)/)[1]
            newDog.type = "manytears"

            dogs.push(newDog)
        })

        return callback(dogs)
    })

}

/**
 * Return a list which has filtered out all reserved dogs.
 */
function removeReserved(allDogs) {
    return []
}

module.exports = {
    grabManyTearsDogs: grabManyTearsDogs,
    getLatestHomepage: getLatestHomepage
}