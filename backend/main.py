"""
PalmPay — optional FastAPI service.

Mirrors the frontend's demo data as real REST endpoints. The Next.js app runs
fully standalone with built-in mock data, so this service is optional — it
exists to demonstrate the production architecture (FastAPI + Supabase) and to
let you point the frontend at a live API if you wish.

Run:
    uvicorn main:app --reload --port 8000
Docs:
    http://localhost:8000/docs
"""
from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="PalmPay API",
    description="Biometric payments powered by palm vein intelligence.",
    version="1.0.0",
)

# Allow the Next.js dev server (and anything, for the demo) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# Deterministic demo data (seeded → stable across restarts)
# --------------------------------------------------------------------------- #
RNG = random.Random(20260622)

FIRST = ["Aarav", "Vivaan", "Aditya", "Diya", "Ananya", "Ishaan", "Kabir",
         "Meera", "Riya", "Arjun", "Saanvi", "Anika", "Vihaan", "Myra",
         "Aryan", "Kiara", "Rohan", "Tara", "Dev", "Naina", "Karan", "Zara"]
LAST = ["Sharma", "Verma", "Iyer", "Nair", "Reddy", "Mehta", "Kapoor",
        "Singh", "Patel", "Gupta", "Bose", "Khanna", "Malhotra", "Rao"]
CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai",
          "Gurugram", "Ahmedabad", "Kolkata", "Jaipur"]
TIERS = ["Standard", "Plus", "Elite"]
MERCHANT_NAMES = ["Blue Tokai Coffee", "Aurora Mart", "Nova Electronics",
                  "Pulse Pharmacy", "Halo Fashion", "Orbit Books",
                  "Quantum Cafe", "Vertex Grocers", "Lumen Bistro",
                  "Atlas Fuel", "Echo Bakery", "Prism Salon"]
CATEGORIES = ["Coffee", "Groceries", "Electronics", "Pharmacy", "Fashion",
              "Books", "Dining", "Fuel", "Transit"]


def _hex(n: int) -> str:
    return "".join(RNG.choice("0123456789ABCDEF") for _ in range(n))


# ----- Models -----
class User(BaseModel):
    id: str
    name: str
    email: str
    palmId: str
    walletId: str
    balance: int
    avgSpend: int
    securityScore: int
    tier: str
    city: str
    matchConfidence: float


class Transaction(BaseModel):
    id: str
    userId: str
    userName: str
    merchant: str
    category: str
    amount: int
    status: str
    minutesAgo: int
    confidence: float


class Merchant(BaseModel):
    id: str
    name: str
    category: str
    city: str
    volume: int
    terminals: int
    rating: float


class FraudAlert(BaseModel):
    id: str
    userName: str
    reason: str
    amount: int
    usualAmount: int
    riskScore: int
    severity: str
    status: str


def _make_user(i: int) -> User:
    name = f"{RNG.choice(FIRST)} {RNG.choice(LAST)}"
    return User(
        id=f"u_{i:03d}",
        name=name,
        email=f"{name.lower().replace(' ', '.')}@palm.id",
        palmId=f"PLM-{_hex(4)}-{_hex(4)}",
        walletId=f"WLT-{_hex(6)}",
        balance=round(2400 + RNG.random() * 88000),
        avgSpend=round(180 + RNG.random() * 520),
        securityScore=round(82 + RNG.random() * 17),
        tier=RNG.choice(TIERS),
        city=RNG.choice(CITIES),
        matchConfidence=round(94 + RNG.random() * 5.9, 2),
    )


USERS: List[User] = [_make_user(i + 1) for i in range(50)]
USERS[0] = USERS[0].model_copy(update={
    "name": "Aarav Sharma", "palmId": "PLM-7F3A-9C21", "walletId": "WLT-4B8E1D",
    "balance": 48250, "avgSpend": 210, "securityScore": 98, "tier": "Elite",
    "city": "Bengaluru", "matchConfidence": 98.72,
})

TRANSACTIONS: List[Transaction] = []
for _ in range(60):
    u = RNG.choice(USERS)
    roll = RNG.random()
    status = ("flagged" if roll > 0.93 else "declined" if roll > 0.88
              else "pending" if roll > 0.83 else "success")
    TRANSACTIONS.append(Transaction(
        id=f"tx_{_hex(8).lower()}", userId=u.id, userName=u.name,
        merchant=RNG.choice(MERCHANT_NAMES), category=RNG.choice(CATEGORIES),
        amount=round(60 + RNG.random() * 4200), status=status,
        minutesAgo=round(RNG.random() * 60 * 36),
        confidence=round(95 + RNG.random() * 4.9, 2),
    ))
TRANSACTIONS.sort(key=lambda t: t.minutesAgo)

MERCHANTS: List[Merchant] = [
    Merchant(id=f"m_{i+1:02d}", name=n, category=RNG.choice(CATEGORIES),
             city=RNG.choice(CITIES), volume=round(120000 + RNG.random() * 4200000),
             terminals=round(2 + RNG.random() * 40), rating=round(4 + RNG.random() * 0.9, 1))
    for i, n in enumerate(MERCHANT_NAMES)
]

FRAUD_ALERTS: List[FraudAlert] = [
    FraudAlert(id="fr_a1", userName="Aarav Sharma",
               reason="Spend 23.8x above 30-day average", amount=5000,
               usualAmount=210, riskScore=92, severity="high", status="flagged"),
    FraudAlert(id="fr_b2", userName="Meera Nair",
               reason="Impossible travel - 2 cities in 9 min", amount=1840,
               usualAmount=460, riskScore=97, severity="critical", status="blocked"),
    FraudAlert(id="fr_c3", userName="Rohan Mehta",
               reason="New merchant + off-hours pattern", amount=2200,
               usualAmount=700, riskScore=64, severity="medium", status="flagged"),
]

METRICS = {
    "usersEnrolled": 248930, "transactions": 5128740, "successRate": 99.4,
    "far": 0.0008, "frr": 0.42, "authAccuracy": 99.31, "avgPaymentMs": 740,
    "uptime": 99.99, "merchants": 14280, "countries": 9,
}


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "palmpay", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/users", response_model=List[User])
def list_users(limit: int = 50):
    return USERS[:limit]


@app.get("/api/users/{user_id}", response_model=User)
def get_user(user_id: str):
    for u in USERS:
        if u.id == user_id:
            return u
    raise HTTPException(404, "User not found")


@app.get("/api/transactions", response_model=List[Transaction])
def list_transactions(limit: int = 60, status: Optional[str] = None):
    data = TRANSACTIONS if status is None else [t for t in TRANSACTIONS if t.status == status]
    return data[:limit]


@app.get("/api/merchants", response_model=List[Merchant])
def list_merchants():
    return MERCHANTS


@app.get("/api/fraud-alerts", response_model=List[FraudAlert])
def list_fraud_alerts():
    return FRAUD_ALERTS


@app.get("/api/metrics")
def metrics():
    return METRICS


class AuthRequest(BaseModel):
    # In production this would be an encrypted biometric template, never an image.
    template: Optional[str] = None


@app.post("/api/authenticate")
def authenticate(_: AuthRequest):
    """Mock palm match — always resolves to the primary demo user."""
    u = USERS[0]
    return {
        "identified": True,
        "user": u,
        "confidence": u.matchConfidence,
        "featureSimilarity": 97.4,
        "embeddingDistance": 0.031,
        "stages": ["preprocessing", "feature_extraction", "embedding",
                   "database_search", "confidence_scoring"],
    }


class PayRequest(BaseModel):
    userId: str
    merchant: str
    amount: int


@app.post("/api/pay")
def pay(req: PayRequest):
    risk = 92 if req.amount > 3000 else round(RNG.random() * 40)
    return {
        "approved": risk < 70,
        "transactionId": f"tx_{_hex(8).lower()}",
        "amount": req.amount,
        "merchant": req.merchant,
        "riskScore": risk,
        "confidence": 98.72,
        "method": "palm_vein_biometric",
    }
