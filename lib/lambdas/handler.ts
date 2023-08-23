import {APIGatewayProxyStructuredResultV2, APIGatewayProxyWebsocketEventV2} from "aws-lambda";
import {handleConnect} from "./handleConnect";
import {handleDisconnect} from "./handleDisconnect";
import {handleDefault} from "./handleDefault";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export async function handler(event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    if (!process.env.TOPICS_TABLE) {
        console.error('TOPICS_TABLE not configured.')
        
        return {
            statusCode: 502,
            body: JSON.stringify('Bad Gateway'),
        }
    }
    
    const { TOPICS_TABLE } = process.env;
    
    try {
        const { connectionId } = event.requestContext;
        
        switch (event.requestContext.routeKey) {
            case '$connect':
                await handleConnect(connectionId);
                break;
            case '$disconnect':
                await handleDisconnect(
                    connectionId,
                    TOPICS_TABLE,
                    ddbDocClient
                );
                break;
            case '$default':
                await handleDefault(connectionId);
                break;
        }
        
        return { statusCode: 200 };
    } catch (error: any) {
        console.error(error.message);
        
        return {
            statusCode: 500,
            body: JSON.stringify(error.message),
        }
    }
}