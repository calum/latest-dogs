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
        FilterExpression: 'createdAt > :datetime',
        ExpressionAttributeValues: {':datetime': moment().subtract(14, 'minutes').format()}
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
 * Scan the table for items which have no 'data' field.
 */
exports.needsData = function(callback) {
    let params = {
        TableName: 'dogs-list',
        FilterExpression: 'attribute_not_exists(enriched)',
    }

    documentClient.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            return callback(err)
        }
        console.log('SCAN COMPLETE: ' + data.Count + ' results.')
        let result = data.Items[0]

        callback(null, result)
    })
}

exports.update = function(item, callback) {
    let params = {
        TableName: 'dogs-list',
        Item: {
            id: item.id,
            url: item.url,
            image: item.image,
            name: item.name,
            createdAt: item.createdAt,
            enriched: true,
            data: item.data
        }
    }
    documentClient.put(params, function(err, data) {
        if (err) {
            callback(err)
        }
        callback(null, data)
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
                console.log('DB INSERT: ' + result.value)
            }
        })
        callback()
    })


}