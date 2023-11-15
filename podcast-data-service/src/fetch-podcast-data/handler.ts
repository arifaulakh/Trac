import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Client } from 'podcast-api';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = event.body;
    const parsedBody = JSON.parse(requestBody || '');
    const episodeId = parsedBody?.episodeId;
    console.log('Episode ID: ', episodeId)

    const client = Client({ apiKey: process.env.PODCAST_API_KEY });

    const response = await client.fetchEpisodeById({
      id: episodeId,
      show_transcript: 1,
    });

    // Get response json data here
    const savedData = response.data;
    const audioUrl = savedData.audio;

    const responseBody = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({audioUrl: audioUrl}),
    };
    return responseBody;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: err.message }),
      };
    } else {
      console.error('An error occurred');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'An error occurred' }),
      };
    }
  }
};
