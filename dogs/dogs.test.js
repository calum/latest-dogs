const { grabDogs, addDetails } = require('./dogs')

// grabDogs([], 1, (res) => console.log(res))

addDetails({
    id: '1238152'
}, function(err, dog) {
    console.log(dog)
})