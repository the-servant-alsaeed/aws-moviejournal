import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import * as console from "node:console";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export default async (event: APIGatewayEvent) => {
    try{
        // CAPTURE THIS INFO
        const userSub = event.requestContext.authorizer!.claims.sub;
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

        return {
            statusCode: 201,
            body: JSON.stringify({ movieTitle, movieID, posterURL, plot})
        };
    } catch (error) {
        console.error("Error adding favorite", error);
        return {
            statusCode: 500,
            body: null
        }
    }
};
