import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import * as console from "node:console";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});

export default async (event: APIGatewayEvent) => {
    try{
        // CAPTURE THIS INFO
        const userSub = event.requestContext.authorizer!.claims.sub;
        const userEmail = event.requestContext.authorizer!.claims.email;
        console.log(userSub);
        const favoriteKey = `favorite#${userSub}`;

        const { movieTitle, movieID, posterURL, plot } = JSON.parse(event.body!);
        console.log(event, { movieTitle, movieID, posterURL, plot });

        if (!movieTitle || !movieID || !posterURL || !plot) {
            return {
                statusCode: 422,
                body: null
            };
        }

        const command = new BatchWriteCommand({
            RequestItems: {
                [process.env.TABLE_NAME!]: [
                    {
                        PutRequest: { //storing the entire movie because the movie details will rarely change and that's
                                        // the main advantage to only storing the id then retrieving the details from
                                        // the original getMovies Lambda function.
                            Item: { pk: favoriteKey, sk: movieID, movieTitle, movieID, posterURL, plot}
                        }
                    }
                ]
            }
        });

        await docClient.send(command);

        // SEND A MESSAGE TO THE SNS TOPIC
        const snsPublishCommand = new PublishCommand({
            TopicArn: process.env.SNS_TOPIC!,
            Message: JSON.stringify({ userEmail, movieTitle, movieID, posterURL, plot })
        });

        const response = await snsClient.send(snsPublishCommand);
        console.log({ ...response })
        console.log("SNS message sent");

        return {
            statusCode: 201,
            body: JSON.stringify({ userEmail, movieTitle, movieID, posterURL, plot})
        };
    } catch (error) {
        console.error("Error adding favorite", error);
        return {
            statusCode: 500,
            body: null
        }
    }
};
