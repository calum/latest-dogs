const { grabDogs, addDetails, getLatestHomepage } = require('./manytears')

getLatestHomepage((res) => console.log(res))

// grabDogs([], 0, (res) => console.log(res))

// addDetails({
//     id: '1238931'
// }, function(err, dog) {
//     console.log(dog)
// })