import { faker } from '@faker-js/faker';
import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, ListEventSourceMappingsCommand, UpdateEventSourceMappingCommand } from '@aws-sdk/client-lambda';
import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { STS } from '@aws-sdk/client-sts';

import handler from "../../handler";
// import {toString} from "serverless-iam-roles-per-function";
import { getQueueUrlByArn, lambdaFunctions } from '../../../../../tests/config';


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient();
const sqsClient = new SQSClient();

// @ts-ignore
let accountId: string;
beforeAll(async () => {
    const sts = new STS({ region: process.env.AWS_REGION });
    const { Account: account } = await sts.getCallerIdentity({});
    accountId = account!;
});

describe('Add Favorite to the DynamoDB Table', () => {
    it('should store the favorite in the database', async () => {
        // Arrange
        const userSub = "c418f478-2031-70c7-c492-eb748d3f1eb2";
        const movieTitle = faker.lorem.words(3);
        const movieID = faker.number.int({min: 1, max: 1000}).toString();
        const posterURL = faker.image.url();
        const plot = faker.lorem.paragraph();
        console.log('TABLE_NAME:', process.env.TABLE_NAME);

        // Act
        const response = await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: userSub
                    }
                }
            },
            body: JSON.stringify({
                movieTitle,
                movieID,
                posterURL,
                plot
            })
        } as unknown as APIGatewayEvent);

        // Assert
        expect(response.statusCode).toEqual(201);
        expect(JSON.parse(response.body!)).toEqual({
            movieTitle,
            movieID,
            posterURL,
            plot
        });

        // ASSERT THAT THE DATABASE HAS THE ACTUAL FAVORITE
        const command = new GetCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                pk: `favorite#${userSub}`,
                sk: movieID
            }
        });

        const {Item: movie} = await docClient.send(command);
        expect(movie).toBeDefined();
        expect(movie).toMatchObject({
            movieTitle,
            movieID,
            posterURL,
            plot
        });
    });

    it.only('should send an SNS message to the send email SQS queue', async () => {
        //Arrange
        const userEmail = faker.internet.email();
        const userSub = "c418f478-2031-70c7-c492-eb748d3f1eb2";
        const movieTitle = faker.lorem.words(3);
        const movieID = faker.number.int({min: 1, max: 1000}).toString();
        const posterURL = faker.image.url();
        const plot = faker.lorem.paragraph();

        // Turn of ESM to the SQS
        const listESMCommand = new ListEventSourceMappingsCommand({
            FunctionName: lambdaFunctions.sendFavoriteEmail
        });
        const {EventSourceMappings} = await lambdaClient.send(listESMCommand);

        console.log(EventSourceMappings);

        let updateESM = new UpdateEventSourceMappingCommand({
            UUID: EventSourceMappings![0].UUID,
            Enabled: false
        });
        await lambdaClient.send(updateESM);

        // Act
        await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: userSub,
                        email: userEmail
                    }
                    }
                },
            body: JSON.stringify({
                userEmail,
                movieTitle,
                movieID,
                posterURL,
                plot
            })
        } as unknown as APIGatewayEvent);

        await new Promise((resolve) => setTimeout(() => resolve(''), 20_000));

        // Assert
        // POLL THE SQS QUEUE
        const queueUrl = getQueueUrlByArn(accountId, EventSourceMappings![0].EventSourceArn!);
        const getSQSMessagesCommand = new ReceiveMessageCommand({
            QueueUrl: queueUrl
        });
        const {Messages: messages} = await sqsClient.send(getSQSMessagesCommand);

        expect(JSON.parse(messages![0].Body!)).toEqual({
            userEmail,
            movieID,
            movieTitle,
            posterURL,
            plot
        });

        // Clean up
        updateESM = new UpdateEventSourceMappingCommand({
            UUID: EventSourceMappings![0].UUID,
            Enabled: true
        });
        await lambdaClient.send(updateESM);
    })
});
