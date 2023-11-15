import axios from "axios";
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import AWS from "aws-sdk";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = event.body;
    const parsedBody = JSON.parse(requestBody || "");
    const podcastId = parsedBody.id;
    const podcastName = parsedBody.name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    const podcastUrl = `https://www.listennotes.com/e/p/${podcastId}/`;
    const bucket = process.env.PODCAST_TRANSCRIPTS_S3_BUCKET_NAME || "";

    const podcastResponse = await axios.get(podcastUrl);

    const redirectedUrl = String(podcastResponse.request.res.responseUrl);
    console.log("Podcast URL", podcastUrl);
    console.log("Redirected URL", redirectedUrl);

    const uploadParams = {
      podcastId: podcastId,
      podcastName: podcastName,
      podcastUrl: redirectedUrl,
      bucket: bucket,
    };
    console.log("Upload Params", uploadParams);

    // Create a new Lambda instance
    const lambda = new AWS.Lambda();

    // Invoke the new Lambda function
    const params = {
      FunctionName: "backend-dev-transcriptUpload", // Replace with the actual name of your new Lambda function
      InvocationType: "Event", // This causes the function to execute asynchronously
      Payload: JSON.stringify(uploadParams),
    };

    console.log("Params", params);

    console.log("Invoking Lambda function...");
    try {
      await lambda.invoke(params).promise();
      console.log("Lambda function invoked successfully");
    } catch (error) {
      console.error("Error invoking Lambda function", error);
      throw error;
    }

    // Return a response to API Gateway immediately
    return {
      statusCode: 202,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Transcript of episode-${uploadParams.podcastId}-${uploadParams.podcastName} will be uploaded to s3 bucket ${uploadParams.bucket}`,
      }),
    };
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);

      return {
        statusCode: error.response.status,
        body: JSON.stringify(error.response.data),
      };
    } else if (error.request) {
      console.log(error.request);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "No response received from the server.",
        }),
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "An error occurred while setting up the request.",
        }),
      };
    }
  }
};
