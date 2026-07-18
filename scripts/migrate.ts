import "dotenv/config";
import { DynamoDBClient, CreateTableCommand, ListTablesCommand, type CreateTableCommandInput } from "@aws-sdk/client-dynamodb";
import { S3Client, PutBucketCorsCommand, PutBucketPolicyCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.LOCALSTACK_ENDPOINT!;

const dynamoClient = new DynamoDBClient({
  region: "us-east-1",
  endpoint,
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const tables: CreateTableCommandInput[] = [
  {
    TableName: "MyFaceUsers",
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "username", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UsernameIndex",
        KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "EmailIndex",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "MyFacePosts",
    KeySchema: [{ AttributeName: "postId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "postId", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "createdAt", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserIdCreatedAtIndex",
        KeySchema: [
          { AttributeName: "userId", KeyType: "HASH" },
          { AttributeName: "createdAt", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "MyFaceComments",
    KeySchema: [{ AttributeName: "commentId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "commentId", AttributeType: "S" },
      { AttributeName: "postId", AttributeType: "S" },
      { AttributeName: "createdAt", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "PostIdCreatedAtIndex",
        KeySchema: [
          { AttributeName: "postId", KeyType: "HASH" },
          { AttributeName: "createdAt", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "MyFaceLikes",
    KeySchema: [
      { AttributeName: "postId", KeyType: "HASH" },
      { AttributeName: "userId", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "postId", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "MyFaceSessions",
    KeySchema: [{ AttributeName: "sessionToken", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "sessionToken", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  },
];

async function migrate() {
  try {
    const { TableNames } = await dynamoClient.send(new ListTablesCommand({}));
    console.log("Existing tables:", TableNames);

    for (const table of tables) {
      if (TableNames?.includes(table.TableName!)) {
        console.log(`Table ${table.TableName} already exists, skipping.`);
        continue;
      }
      console.log(`Creating table ${table.TableName}...`);
      await dynamoClient.send(new CreateTableCommand(table));
      console.log(`Table ${table.TableName} created successfully.`);
    }

    const bucket = "tests";
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`Bucket ${bucket} already exists.`);
    } catch {
      console.log(`Creating bucket ${bucket}...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`Bucket ${bucket} created.`);
    }

    console.log("Configuring CORS on bucket tests...");
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    console.log("CORS configured successfully.");

    console.log("Setting public read bucket policy...");
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "PublicReadGetObject",
              Effect: "Allow",
              Principal: "*",
              Action: "s3:GetObject",
              Resource: `arn:aws:s3:::${bucket}/*`,
            },
          ],
        }),
      })
    );
    console.log("Bucket policy set successfully.");

    console.log("Migration complete.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
