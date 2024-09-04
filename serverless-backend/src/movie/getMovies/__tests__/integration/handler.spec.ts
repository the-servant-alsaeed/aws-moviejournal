import { faker } from '@faker-js/faker';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, BatchWriteCommand} from "@aws-sdk/lib-dynamodb";
import { STS } from '@aws-sdk/client-sts';

import handler from "../../handler";


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
//const lambdaClient = new LambdaClient();
//const sqsClient = new SQSClient();

// @ts-ignore
let accountId: string;
beforeAll(async () => {
    const sts = new STS({ region: process.env.AWS_REGION });
    const { Account: account } = await sts.getCallerIdentity({});
    accountId = account!;
});

describe('Gets Movies from the DynamoDB Table', () => {
    it('should retrieve movies from the database', async () => {
        // Arrange
        const movieTitle = faker.lorem.words(3);
        const movieID = faker.number.int({min:1 ,max:1000}).toString();
        const posterURL = faker.image.url();
        const plot = faker.lorem.paragraph();

        console.log('TABLE_NAME:', process.env.TABLE_NAME);

        const fakeFav = new BatchWriteCommand({
            RequestItems: {
                [process.env.TABLE_NAME!]: [
                    {
                        PutRequest: {
                            Item: {
                                pk: 'movies',
                                sk: movieID,
                                movieTitle,
                                movieID,
                                posterURL,
                                plot
                            }
                        }
                    }
                ]
            }
        });

        const result = await docClient.send(fakeFav);
        console.log(result);

        // Act
        const queryResponse = await handler();

        // Assert
        expect(queryResponse.statusCode).toEqual(200);
        expect(JSON.parse(queryResponse.body!)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    movieTitle,
                    movieID,
                    posterURL,
                    plot
                })
            ])
        );
    });
});
