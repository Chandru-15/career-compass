# Career Compass

Career Compass is an AI-powered career guidance platform designed to help students and early-career job seekers manage different parts of their career journey in one place.

It combines resume analysis, explainable job matching, skills development, application tracking, and personalised AI career guidance.

## Features

### Resume Analysis
- Extracts education, experience, and skills from uploaded resumes.
- Uses Azure Document Intelligence for document text extraction.
- Uses Azure OpenAI for structured enrichment and resume feedback.
- Falls back to baseline parsed information if AI enrichment is unavailable.

### Explainable Job Matching
- Compares a user's skills against job requirements.
- Uses deterministic matching logic instead of asking an LLM to generate a fit percentage.
- Keeps the score consistent, explainable, and reproducible.

### Skills Roadmap
- Identifies skill gaps for a target role.
- Allows users to track skills they already have, skills in progress, and skills they still need to learn.

### Application Tracking
- Tracks applications through stages such as Applied, Interview, Offer, Accepted, and Rejected.

### AI Career Assistant
- Provides personalised interview preparation and career guidance.
- Uses relevant profile context and conversation history.
- Supports different modes such as interview preparation and career-roadmap guidance.

## Architecture

```text
React + TypeScript Frontend
            |
            | REST API
            v
Node.js + Express Backend
            |
            +------ Supabase PostgreSQL
            |
            +------ Azure Blob Storage
            |
            +------ Azure Document Intelligence
            |
            +------ Azure OpenAI
```

Privileged cloud integrations are handled by the backend so credentials such as Azure API keys are not exposed to the browser.

## Resume Processing Flow

```text
Resume Upload
     |
     v
Express Backend
     |
     +--> Azure Blob Storage
     |       Stores the original resume file
     |
     +--> Supabase PostgreSQL
     |       Stores file metadata and extracted data
     |
     +--> Azure Document Intelligence
     |       Extracts machine-readable text
     |
     +--> Deterministic Resume Parser
     |       Produces a baseline structured result
     |
     +--> Azure OpenAI
             Provides optional structured enrichment
             and resume feedback
```

The AI enrichment layer is designed to degrade gracefully.

If Azure OpenAI is unavailable after document extraction succeeds, Career Compass can still return the baseline parsed result instead of failing the entire workflow.

## Job Matching

The job-fit percentage is intentionally calculated using deterministic skill-matching logic.

The system:

1. Normalises the user's skills.
2. Normalises the job's required skills.
3. Finds the overlap between both sets of skills.
4. Calculates the fit score from that comparison.

This keeps the result:

- Consistent
- Explainable
- Reproducible

Generative AI is used where generation adds value, such as:

- Resume feedback
- Interview preparation
- Career guidance
- Career-roadmap recommendations

For the prototype, job listings are sourced from a bundled MyCareersFuture dataset rather than a live MyCareersFuture API.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- TanStack React Query

### Backend
- Node.js
- Express

### Database and Cloud
- PostgreSQL / Supabase
- Azure OpenAI
- Azure Document Intelligence
- Azure Blob Storage

## Testing

The project includes automated frontend and backend tests covering areas such as:

- Job matching and filtering
- Resume parsing
- Resume context handling
- Authentication behaviour
- Interview date handling
- Skills roadmap logic
- API validation
- Database behaviour
- Persistence checks

Additional integration, cloud, and security checks are included in the backend scripts.

### Frontend Tests

```bash
cd frontend
npm install
npm test
npm run typecheck
npm run build
```

### Backend Tests

```bash
cd backend
npm install
npm test
npm run test:integration
npm run test:cloud
npm run check:secrets
```

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/career-compass.git
cd career-compass
```

### 2. Configure environment variables

The project contains example environment files:

```text
backend/.env.example
frontend/.env.example
```

Create local `.env` files from the examples and provide your own Azure and Supabase credentials.

Do not commit real credentials to the repository.

### 3. Start the backend

```bash
cd backend
npm install
npm start
```

The backend runs on:

```text
http://localhost:3001
```

### 4. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run locally and communicate with the Express backend through REST APIs.

## Environment Variables

Example backend configuration:

```env
PORT=3001
AUTH_MODE=demo

AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=career-compass-chat
AZURE_OPENAI_API_VERSION=2024-10-21

AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=

AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=resumes

SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

All sensitive values should be stored only in the local `.env` file.

## Demo Authentication

The current version uses a simplified single-user demo authentication mode.

This was designed for project demonstration and local testing.

A production deployment would require:

- Proper identity authentication
- Backend token validation
- User-specific authorisation
- Production-ready session handling

## Design Decisions

### Deterministic Job Matching
The job-fit score is calculated using explicit skill-matching logic rather than being generated by an LLM.

This makes the result easier to explain and ensures the same input produces the same output.

### Backend-Only Cloud Integrations
Azure and privileged Supabase operations are handled through the backend instead of directly from the React frontend.

This prevents sensitive credentials from being exposed in browser code.

### Graceful AI Failure Handling
Azure OpenAI is used as an enrichment layer rather than the only source of resume information.

If AI enrichment fails, successfully extracted baseline resume data can still be returned to the user.

### Separation of File Storage and Structured Data
Resume files are stored in Azure Blob Storage, while structured metadata and application data are stored in Supabase PostgreSQL.

This keeps binary file storage separate from relational application data.

## Future Improvements

If I were extending Career Compass further, I would focus on:

- Production authentication and authorisation
- CI/CD integration so automated tests run on every pull request
- Live job-source integration instead of a bundled dataset
- Stronger AI evaluation and monitoring
- More advanced job-ranking and recommendation logic
- Improved observability and logging
- Production deployment and scaling

## Project Outcome

Career Compass was developed as part of the Techfest Hackathon and finished 6th out of 120 teams.

The project gave me hands-on experience combining full-stack software engineering with applied AI, including:

- Frontend and backend development
- REST API design
- PostgreSQL persistence
- Cloud service integration
- AI prompting and grounding
- Failure handling
- Testing
- Product design