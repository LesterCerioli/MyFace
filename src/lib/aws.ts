import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const LOCALSTACK_ENDPOINT = process.env.LOCALSTACK_ENDPOINT!;

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: LOCALSTACK_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const dynamoClient = new DynamoDBClient({
  region: "us-east-1",
  endpoint: LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const S3_BUCKET = "tests";

export { s3Client, dynamoClient, docClient, S3_BUCKET };
