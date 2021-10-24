var AWS = require('aws-sdk')
const moment = require('moment')

AWS.config.update({region: 'us-east-1'})

var documentClient = new AWS.DynamoDB.DocumentClient()

/**
 * Returns all items with a 'createdAt' timestamp within 14 minutes.
 */
exports.getLatest = function(callback) {
    let params = {
        TableName: 'dogs-list',
        FilterExpression: 'createdAt > :datetime AND (attribute_not_exists(sent) OR sent = :false)',
        ExpressionAttributeValues: {':datetime': moment().subtract(14, 'minutes').format(), ':false': false}
    }

    documentClient.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            return callback(err)
        }
        console.log('SCAN COMPLETE: ' + data.Count + ' results.')
        let result = {
            count: data.Count,
            items: data.Items
        }

        callback(null, result)
    })
}

/**
 * Return a dog by its ID.
 */
exports.getFromId = function(id, callback) {
    let params = {
        TableName: 'dogs-list',
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {':id': id}
    }

    documentClient.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            return callback(err)
        }
        console.log('SCAN COMPLETE: ' + data.Count + ' results.')
        if (data.Count < 1) {
            return callback(null, null)
        } else {
            return callback(null, data.Items[0])
        }
    })
}

/**
 * Scan the table for item with the oldest lastupdated
 * value.
 */
exports.getOldest = function(callback) {
    let promise = new Promise(function(resolve, reject) {
        let params = {
            TableName: 'dogs-list',
            FilterExpression: 'attribute_not_exists(errored) OR errored = :false',
            ExpressionAttributeValues: {':false': false}
        }
        documentClient.scan(params, function(err, data) {
            if (err) {
                console.log(err)
                return reject(err)
            }
            console.log('SCAN COMPLETE: ' + data.Count + ' results.')
            let results = data.Items
            results.sort((a, b) => {
                if (!a.lastUpdated || !b.lastUpdated) {
                    if (!a.lastUpdated) {
                        return -1
                    } else {
                        return 1
                    }
                }
                if (a.lastUpdated < b.lastUpdated) {
                    return -1
                } else {
                    return 1
                }
            })
            resolve(results[0])
        })
    })
    if (callback) {
        promise
            .then((data) => callback(null, data))
            .catch(err => callback(err))
    } else {
        return promise
    }
}

/**
 * Scan the table for items which have no 'data' field.
 */
exports.needsData = function(callback) {
    let params = {
        TableName: 'dogs-list',
        FilterExpression: '#type = :dogstrust AND attribute_not_exists(enriched) AND (attribute_not_exists(errored) OR errored = :false)',
        ExpressionAttributeValues: {':false': false, ':dogstrust': 'dogs-trust'},
        ExpressionAttributeNames: {'#type': 'type'}
    }

    documentClient.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            return callback(err)
        }
        console.log('SCAN COMPLETE FOR DOGS WITHOUT DATA: ' + data.Count + ' results.')
        let result = data.Items[0]

        callback(null, result)
    })
}

exports.update = function(item, callback) {
    let params = {
        TableName: 'dogs-list',
        Item: {
            id: item.id,
            type: item.type,
            url: item.url,
            image: item.image,
            name: item.name,
            createdAt: item.createdAt,
            enriched: true,
            data: item.data || null,
            lastUpdated: moment().format(),
            hash: item.hash || null,
            sent: item.sent || false,
            errored: item.errored || false
        }
    }
    documentClient.put(params, function(err, data) {
        if (err) {
            callback(err)
        }
        callback(null, data)
    })
}

exports.updateList = function(items, callback) {
    let promises = []
    console.log("Updating " + items.length + " items...")
    items.forEach(item => {
        promises.push(new Promise(function(resolve, reject) {
            let params = {
                TableName: 'dogs-list',
                Item: {
                    id: item.id,
                    type: item.type,
                    url: item.url,
                    image: item.image,
                    name: item.name,
                    createdAt: item.createdAt,
                    enriched: true,
                    data: item.data || null,
                    lastUpdated: moment().format(),
                    hash: item.hash || null,
                    sent: item.sent || false,
                    errored: item.errored || false
                }
            }
            documentClient.put(params, function(err, data) {
                if (err) {
                    reject(err)
                }
                resolve(data)
            })
        }))
    })

    Promise.allSettled(promises).then(results => {
        results.forEach(result => {
            if (result.status == "rejected") {
                console.log("DB INSERT FAILED: " + result.reason)
            } else {
                console.log('DB INSERT: ' + JSON.stringify(result.value))
            }
        })
        callback()
    })
}

exports.insertList = function(items, callback) {
    let promises = []

    items.forEach(item => {
        promises.push(new Promise(function(resolve, reject) {
            let params = {
                TableName: 'dogs-list',
                Item: {
                    id: item.id,
                    url: item.url,
                    image: item.image,
                    name: item.name,
                    type: item.type,
                    createdAt: moment().format()
                },
                ConditionExpression: 'attribute_not_exists(id)'
            }
            documentClient.put(params, function(err, data) {
                if (err) {
                    reject(err)
                }
                resolve(data)
            })
        }))
    })

    Promise.allSettled(promises).then(results => {
        results.forEach(result => {
            if (result.status == "rejected") {
                console.log("DB INSERT FAILED: " + result.reason)
            } else {
                console.log('DB INSERT: ' + JSON.stringify(result.value))
            }
        })
        callback()
    })
}

exports.getAll = function(callback) {
    let params = {
        TableName: 'dogs-list',
        FilterExpression: 'attribute_not_exists(errored) OR errored = :false',
        ExpressionAttributeValues: {':false': false}
    }

    documentClient.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            return callback(err)
        }
        console.log('SCAN COMPLETE: ' + data.Count + ' results.')
        let result = data.Items
        
        callback(null, result)
    })
}