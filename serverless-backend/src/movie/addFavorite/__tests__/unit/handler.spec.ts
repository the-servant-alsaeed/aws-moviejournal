import "aws-sdk-client-mock-jest";

import { APIGatewayEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
    BatchWriteCommand,
    DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
//import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

import handler from "../../handler";

let ddbMock = mockClient(DynamoDBDocumentClient);
//let snsMock = mockClient(SNSClient);

beforeEach(() => {
    ddbMock.reset();
    //snsMock.reset();
});

beforeAll(() => {
    process.env.TABLE_NAME = "MY_TABLE";
});

describe("Add Favorite", () => {
    it("should return an error if the required body is missing", async () => {
        const response = await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: "c418f478-2031-70c7-c492-eb748d3f1eb2"
                    }
                }
            },
            // @ts-ignore
            body: JSON.stringify({
                movieTitle: "Harry Potter",
                movieID: 8,
                plot: "Harry Potter is the GOAT.",
            }),
        } as unknown as APIGatewayEvent);

        // Assert
        expect(response.statusCode).toEqual(422);
        expect(response.body).toEqual(null);
    });

    it("should return a internal server error if creating the favorite failed to add", async () => {
        // Arrange
        ddbMock.on(BatchWriteCommand).rejectsOnce();

        // Act
        const response = await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: "c418f478-2031-70c7-c492-eb748d3f1eb2"
                    }
                }
            },
            // @ts-ignore
            body: JSON.stringify({
                movieTitle: "Harry Potter",
                movieID: 8,
                posterURL: "https://m.media-amazon.com/images/M/MV5BMjE0YjUzNDUtMjc5OS00MTU3LTgxMmUtODhkOThkMzdjNWI4XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg",
                plot: "Harry Potter is the GOAT.",
            }),
        } as unknown as APIGatewayEvent);

        // Assert
        expect(response.statusCode).toEqual(500);
        expect(response.body).toEqual(null);
    });

    it("should write the favorite to the database", async () => {
        // Arrange
        ddbMock.on(BatchWriteCommand).resolvesOnce({});

        // Act
        await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: "c418f478-2031-70c7-c492-eb748d3f1eb2"
                    }
                }
            },
            // @ts-ignore
            body: JSON.stringify({
                movieTitle: "Harry Potter",
                movieID: 8,
                posterURL: "https://m.media-amazon.com/images/M/MV5BMjE0YjUzNDUtMjc5OS00MTU3LTgxMmUtODhkOThkMzdjNWI4XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg",
                plot: "Harry Potter is the GOAT.",
            }),
        } as unknown as APIGatewayEvent);

        // Assert
        expect(ddbMock).toHaveReceivedNthCommandWith(1, BatchWriteCommand, {
            RequestItems: {
                MY_TABLE: [
                    {
                        PutRequest: {
                            Item: {
                                pk: "favorite#c418f478-2031-70c7-c492-eb748d3f1eb2",
                                sk: 8,
                                movieTitle: "Harry Potter",
                                movieID: 8,
                                posterURL: "https://m.media-amazon.com/images/M/MV5BMjE0YjUzNDUtMjc5OS00MTU3LTgxMmUtODhkOThkMzdjNWI4XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg",
                                plot: "Harry Potter is the GOAT.",
                            },
                        },
                    },
                ],
            },
        });
    });

    // it("should publish an event to the SNS topic after successfully creating the user", async () => {
    //     // Arrange
    //     ddbMock.on(BatchWriteCommand).resolvesOnce({});
    //     snsMock.on(PublishCommand).rejectsOnce({});
    //
    //     // Act
    //     await handler({
    //         // @ts-ignore
    //         body: JSON.stringify({
    //             name: "qasim",
    //             email: "qasim@calo.app",
    //             phoneNumber: "+97332211331",
    //         }) as Partial<APIGatewayEvent>,
    //     });

        // Assert
    //     expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 1);
    // });

    it("should return the movie details when adding the favorite is successful", async  () => {
        // Arrange
        ddbMock.on(BatchWriteCommand).resolvesOnce({});

        // Act
        const response = await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: "c418f478-2031-70c7-c492-eb748d3f1eb2"
                    }
                }
            },
            // @ts-ignore
            body: JSON.stringify({
                movieTitle: "Harry Potter",
                movieID: 8,
                posterURL: "https://m.media-amazon.com/images/M/MV5BMjE0YjUzNDUtMjc5OS00MTU3LTgxMmUtODhkOThkMzdjNWI4XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg",
                plot: "Harry Potter is the GOAT.",
            }),
        } as unknown as APIGatewayEvent);

        // Assert
        expect(response.statusCode).toEqual(201);
        expect(JSON.parse(response.body!)).toEqual({
            movieTitle: "Harry Potter",
            movieID: 8,
            posterURL: "https://m.media-amazon.com/images/M/MV5BMjE0YjUzNDUtMjc5OS00MTU3LTgxMmUtODhkOThkMzdjNWI4XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg",
            plot: "Harry Potter is the GOAT.",
        });

    });
});
