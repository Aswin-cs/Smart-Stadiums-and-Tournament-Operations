# Smart Stadiums & Tournament Operations

Smart Stadiums & Tournament Operations is a web application built with Next.js, React, and Mongoose. It features user authentication via Next-Auth and integrates Google Generative AI capabilities.

## Features

- **Next.js Framework**: Utilizing the App Router and React for a modern, responsive user interface.
- **AI-Powered Route Navigation**: Smart, AI-driven navigation systems to guide attendees seamlessly through the stadium.
- **Multilingual AI Assistance**: Real-time, AI-powered multilingual support to assist international fans and attendees.
- **AI Crowd Management**: Intelligent crowd monitoring and management to ensure safety, optimize flow, and reduce congestion.
- **Authentication**: Secure user login and session management powered by Next-Auth.
- **Database**: MongoDB integration using Mongoose for reliable data modeling and storage.
- **Testing**: Comprehensive testing setup with Jest and React Testing Library.

## App Structure

The application is built using the Next.js App Router paradigm, organizing code into distinct logical segments:

- `app/fan/`: Contains routes and pages specifically tailored for stadium attendees and fans.
- `app/organiser/`: Contains routes and dashboards for event organizers and staff.
- `app/api/`: Holds the backend API routes, including Next-Auth configurations and AI service endpoints.
- `app/components/`: Reusable React components shared across different pages and features.
- `app/lib/`: Utility functions, database connection helpers, and third-party service integrations.
- `models/`: Mongoose schemas defining the data structure for users, rate limits, and other core entities.

## Getting Started

### Prerequisites

Ensure you have Node.js installed on your machine. You will also need a MongoDB database and relevant API keys for Next-Auth and Google Generative AI.

### Installation

1. Clone the repository and navigate into the project directory.

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory based on the project requirements (e.g., MongoDB URI, Next-Auth secret, Google AI API key).

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Runs the built app in production mode.
- `npm run lint`: Runs ESLint to catch syntax and style issues.
- `npm run test`: Runs the Jest test suite.
- `npm run coverage`: Runs tests and generates a coverage report.

## Technologies Used

- Next.js
- React
- Mongoose
- Next-Auth
- Google Generative AI
- Zod
- FontAwesome
- Jest
