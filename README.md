# MyFace

MyFace is a free social media platform where people can post videos and images, write comments, and give likes on different posts.

## Features

- User authentication (register, login, logout, password reset)
- Create posts with text, images, and videos
- Like and unlike posts
- Comment on posts
- Real-time feed displaying all posts

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Storage**: LocalStack (S3 for media, DynamoDB for data)

## Architecture

Media uploads go directly from the browser to S3 via presigned URLs — the Next.js server only generates the URL, it never processes the file. This keeps the serverless function lightweight.

- **DynamoDB tables**: `MyFaceUsers`, `MyFacePosts`, `MyFaceComments`, `MyFaceLikes`, `MyFaceSessions`

## Getting Started

### Prerequisites

- Node.js 20+
- LocalStack running with S3 and DynamoDB

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

4. Set your LocalStack endpoint in `.env`:

```
LOCALSTACK_ENDPOINT=<your-localstack-endpoint-url>
```

5. Run the database migration to create DynamoDB tables and configure S3:

```bash
npm run migrate
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run migrate` | Run DynamoDB migrations and S3 setup |
| `npm run lint` | Run ESLint |


###1
