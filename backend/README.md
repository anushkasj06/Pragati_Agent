# Meesho Pragati Agent — Backend

Production-ready Node.js + Express orchestration layer for AI-powered seller underwriting.

## Architecture

```
POST /api/loan/evaluate
  ├── Validate (Zod)
  ├── ML Service → FastAPI :5001/score
  ├── Conversation History → MongoDB
  ├── Rules Engine (deterministic)
  ├── LangChain Agent → Meta Llama API
  ├── Translation Fallback → Google Cloud
  ├── Save Decision + Conversation
  └── Return structured response
```

## Tech Stack

- **Runtime:** Node.js 22+, Express.js
- **Database:** MongoDB + Mongoose
- **AI:** LangChain.js + Meta Llama Hosted API (never OpenAI/Ollama/Groq)
- **Translation:** Google Cloud Translation (fallback only)
- **Validation:** Zod
- **Logging:** Winston
- **Security:** Helmet, CORS, Rate Limiter, Compression
- **Docs:** Swagger at `/api-docs`
- **Tests:** Jest

## Quick Start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### With Docker (MongoDB + ML + Backend)

```bash
cd backend
docker compose up --build
```

## Environment Variables

See `.env.example` for all configuration options.

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 3001) |
| `MONGODB_URI` | MongoDB connection string |
| `ML_SERVICE_URL` | FastAPI ML service URL |
| `LLAMA_API_KEY` | Meta Llama API key |
| `LLAMA_MODEL` | Model name (default `Llama-3.3-70B-Instruct`) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger documentation |
| POST | `/api/loan/evaluate` | Full loan evaluation pipeline |

### Example Request

```bash
curl -X POST http://localhost:3001/api/loan/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "seller_id": "SELL001",
    "language": "Hindi",
    "seller_data": {
      "sales_velocity_6m": 102589,
      "sales_growth_rate": 18.58,
      "rto_rate": 14.09,
      "dispatch_sla_compliance": 91.69,
      "avg_customer_rating": 3.9,
      "rating_trend": 0.091,
      "order_cancellation_rate": 7.03,
      "ad_spend_roi": 2.08,
      "account_age_months": 55,
      "total_orders_6m": 5000,
      "catalog_size": 255,
      "prior_loan_default": 0
    }
  }'
```

## Testing

```bash
npm test
```

## Project Structure

```
backend/
├── server.js              # Entry point
├── src/
│   ├── config/            # DB, Llama, Twilio, Logger
│   ├── controllers/       # Route handlers
│   ├── routes/            # Express routers
│   ├── services/          # Business logic
│   ├── models/            # Mongoose schemas
│   ├── middleware/        # Error handling, logging
│   ├── prompts/           # LLM prompt templates
│   └── utils/             # Helpers
├── tests/                 # Jest unit tests
└── logs/                  # Winston log files
```

## License

MIT
