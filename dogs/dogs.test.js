const { grabDogs, addDetails } = require('./dogs')

//grabDogs([], 1, (res) => console.log(res))

addDetails({
    id: '1238201'
}, function(err, dog) {
    console.log(dog)
})