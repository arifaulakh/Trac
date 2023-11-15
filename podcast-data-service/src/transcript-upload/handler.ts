import AWS from "aws-sdk";
import axios from "axios";

interface UploadEvent {
  podcastId: string;
  podcastName: string;
  podcastUrl: string;
  bucket: string;
}

export const handler = async (event: UploadEvent): Promise<void> => {
  // Configure the AWS SDK
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  });

  const podcastId = event.podcastId;
  const podcastName = event.podcastName;
  const podcastUrl = event.podcastUrl;
  const bucket = event.bucket;

  let uploadParams: AWS.S3.PutObjectRequest = {
    Bucket: "",
    Key: "",
    Body: "",
    ContentType: "",
  };

  try {
    const deepgramResponse = await axios.post(
      "https://api.deepgram.com/v1/listen?diarize=true&filler_words=false&summarize=v2",
      {
        url: podcastUrl,
      },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          accept: "application/json",
          "content-type": "application/json",
        },
      },
    );

    const deepgramData = deepgramResponse.data;
    const transcript =
      deepgramData.results.channels[0].alternatives[0].transcript.replace(
        /\\"/g,
        '"',
      );

    // Create an S3 instance
    const s3 = new AWS.S3();

    uploadParams = {
      Bucket: bucket,
      Key: `episode-${podcastId}-${podcastName}`,
      Body: transcript,
      ContentType: "text/plain",
    };

    await s3.upload(uploadParams).promise();
    console.log(
      `Successfully uploaded ${uploadParams.Key} to ${uploadParams.Bucket}`,
    );
  } catch (error) {
    console.error(
      `Error uploading ${uploadParams.Key} to ${uploadParams.Bucket}`,
      error,
    );
    throw error;
  }
};
