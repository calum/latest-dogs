const { grabDogs, addDetails } = require('./manytears')

grabDogs([], 0, (res) => console.log(res))

// addDetails({
//     id: '1238931'
// }, function(err, dog) {
//     console.log(dog)
// })