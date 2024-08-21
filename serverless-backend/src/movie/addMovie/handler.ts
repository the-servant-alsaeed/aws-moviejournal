import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export default async (event: APIGatewayEvent) => {
    // CAPTURE THIS INFO
    const { movieTitle, movieID, posterURL, plot } = JSON.parse(event.body!);
    console.log(event, { movieTitle, movieID, posterURL, plot });

    const command = new BatchWriteCommand({
        RequestItems: {
            [process.env.TABLE_NAME!]: [
                {
                    PutRequest: {
                        Item: { pk: 'movies', sk: movieID, movieTitle, movieID, posterURL, plot}
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
};
