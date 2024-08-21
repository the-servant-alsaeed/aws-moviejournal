import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, QueryCommand} from "@aws-sdk/lib-dynamodb";
//import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
//const snsClient = new SNSClient({}); SNS client

export default async () => {
    try {
        const command = new QueryCommand({
            TableName: process.env.TABLE_NAME!,
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: {
                ":pk": "movies",
            },
            ProjectionExpression: "movieTitle, movieID, posterURL, plot",
        });

        const response = await docClient.send(command);

        return {
            statusCode: 201,
            body: JSON.stringify(response.Items)
        };
    }catch (error){
        console.log(error)
    }
};
