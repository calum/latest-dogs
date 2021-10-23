# Latest Dogs

Sends email alerts whenever new dogs are created on the Dogs Trust website. 

## Configuration

Requires a DYNAMO DB called "dogs-list" and each lambda function requires an IAM role with AmazonDynamoDBFullAccess and AWSLambdaBasicExecutionRole. 

### Environment Variables

#### Email Server

 * host
 * username
 * password 
 * email
 * mailinglist e.g. "[email1, email2]"