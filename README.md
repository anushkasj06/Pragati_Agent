# Meesho Pragati Agent

A monorepo MERN-stack application with an ML inference service, orchestrated via Docker Compose.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  ML Model   │
│  React :3000│     │ Express:3001│     │ FastAPI:5001│
└─────────────┘     └─────────────┘     └─────────────┘
```

| Service   | Stack                          | Port |
|-----------|--------------------------------|------|
| frontend  | React, Vite, Tailwind CSS      | 3000 |
| backend   | Node.js, Express, LangChain.js | 3001 |
| ml-model  | Python, FastAPI                 | 5001 |

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

## Quick Start

```bash
# Clone and enter the repo
cd meesho-pragati-agent

# Start all services
docker compose up --build
```

| URL                          | Description          |
|------------------------------|----------------------|
| http://localhost:3000        | Frontend UI          |
| http://localhost:3001/health | Backend health check |
| http://localhost:5001/health | ML model health check|
| http://localhost:5001/docs   | ML model API docs    |

## Project Structure

```
meesho-pragati-agent/
├── docker-compose.yml
├── README.md
├── .gitignore
├── frontend/          # React + Tailwind CSS
├── backend/           # Express + LangChain.js
└── ml-model/          # FastAPI inference service
```

## Local Development

### ML Model

```bash
cd ml-model
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5001
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable      | Default                  | Description              |
|---------------|--------------------------|--------------------------|
| `PORT`        | `3001`                   | Server port              |
| `ML_MODEL_URL`| `http://localhost:5001`  | ML model service URL     |
| `OPENAI_API_KEY` | —                     | OpenAI key for LangChain |

### Frontend

| Variable        | Default               | Description        |
|-----------------|-----------------------|--------------------|
| `VITE_API_URL`  | `http://localhost:3001` | Backend API base URL |

## API Overview

### Backend

- `GET /health` — Health check
- `POST /api/chat` — Chat with LangChain agent (proxies to ML model when needed)

### ML Model

- `GET /health` — Health check
- `POST /predict` — Run inference on input text

## License

MIT
