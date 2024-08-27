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

        if (response.Items && response.Items.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify(response.Items),
            };
        } else {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No movies found" }),
            };
        }
    }catch (error){
        console.error("Error fetching movies", error);
        return {
            statusCode: 500,
            body: null
        }
    }
};
