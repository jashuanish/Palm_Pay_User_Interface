# PalmPay — FastAPI service (optional)

The PalmPay frontend runs **fully standalone** with built-in mock data, so you
do **not** need this service to demo the app. It's included to demonstrate the
intended production architecture and to let you serve the same data over a real
REST API.

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- Interactive docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health |
| GET | `/api/users?limit=50` | All enrolled users |
| GET | `/api/users/{id}` | A single user |
| GET | `/api/transactions?status=success` | Transaction ledger |
| GET | `/api/merchants` | Merchant directory |
| GET | `/api/fraud-alerts` | Fraud alerts |
| GET | `/api/metrics` | Aggregate analytics metrics |
| POST | `/api/authenticate` | Mock palm match → identified user + confidence |
| POST | `/api/pay` | Mock charge → approval + risk score |

## Wiring the frontend to this API (optional)

The frontend currently reads from `lib/mockData.ts`. To back it with this
service instead, add a fetch layer keyed off an env var, e.g.:

```ts
// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL;
export async function getMetrics() {
  if (!BASE) return import('./mockData').then(m => m.METRICS); // fallback
  return fetch(`${BASE}/api/metrics`).then(r => r.json());
}
```

Then set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`.

## Supabase in production

In production, the in-memory demo data would be replaced by **Supabase**:

- `users`, `transactions`, `merchants`, `auth_logs`, `fraud_alerts` tables
- Biometric **templates are never stored as images** — only irreversible,
  AES-256-sealed 512-d vectors, with row-level security (RLS) enabled.
- Auth/match endpoints would call a vector-search index (e.g. pgvector) over
  the encrypted templates.
