import "aws-sdk-client-mock-jest";

import { APIGatewayEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
    QueryCommand,
    DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

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

describe("Get Favorites", () => {
    it("should return an message if there are no favorites", async () => {
        // Arrange
        ddbMock.on(QueryCommand).resolves({
            Items: []
        });

        // Act
        const response = await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: "c418f478-2031-70c7-c492-eb748d3f1eb2"
                    }
                }
            },
        } as unknown as APIGatewayEvent);

        // Assert
        expect(response!.statusCode).toEqual(200);
        expect(response!.body).toEqual(JSON.stringify({ message: "No favorites found" }));
    });

    it("should return a internal server error if retrieving the favorites fails", async () => {
        //Arrange
        ddbMock.on(QueryCommand).rejectsOnce();

        // Act
        const response = await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: "c418f478-2031-70c7-c492-eb748d3f1eb2"
                    }
                }
            },
        } as unknown as APIGatewayEvent);

        // Assert
        expect(response!.statusCode).toEqual(500);
        expect(response!.body).toEqual(null);
    });

    it("should return the movie details when fetching is successful", async  () => {
        // Arrange
        ddbMock.on(QueryCommand).resolvesOnce({
            Items:[{
                movieTitle: "Harry Potter",
                movieID: 8,
                posterURL: "https://m.media-amazon.com/images/M/MV5BMjE0YjUzNDUtMjc5OS00MTU3LTgxMmUtODhkOThkMzdjNWI4XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg",
                plot: "Harry Potter is the GOAT.",
            }],
        });

        // Act
        const response = await handler({
            requestContext: {
                authorizer: {
                    claims: {
                        sub: "c418f478-2031-70c7-c492-eb748d3f1eb2"
                    }
                }
            }
        } as unknown as APIGatewayEvent);

        // Assert
        expect(response!.statusCode).toEqual(200);
        expect(JSON.parse(response.body!)).toEqual([{
            movieTitle: "Harry Potter",
            movieID: 8,
            posterURL: "https://m.media-amazon.com/images/M/MV5BMjE0YjUzNDUtMjc5OS00MTU3LTgxMmUtODhkOThkMzdjNWI4XkEyXkFqcGdeQXVyMTA3MzQ4MTc0._V1_SX300.jpg",
            plot: "Harry Potter is the GOAT.",
        }]);
    });
});
