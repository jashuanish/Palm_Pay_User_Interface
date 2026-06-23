# 🖐️ PalmPay — The Future of Invisible Payments

> Biometric payments powered by palm vein intelligence.
> **No phone. No QR. No card. No cash — just your palm.**

PalmPay turns the human palm into a universal payment identity. This is a
fully interactive, production-grade product demo: enroll a palm, authenticate
against a vault, shop in a futuristic store, pay with a wave, watch an AI fraud
engine score behaviour, and pitch the whole thing in investor mode.

![Hero](https://img.shields.io/badge/status-demo--ready-00FFA3?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-14-00E5FF?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5-7B61FF?style=flat-square)

---

## ✨ What's inside

A complete multi-page experience — every page is live and interactive:

| # | Page | Route | Highlights |
|---|------|-------|-----------|
| 1 | **Landing** | `/` | Animated palm mesh, scroll-driven payment journey, old-world vs new-world comparison |
| 2 | **Palm Registration** | `/register` | 4-step enrollment: capture → vein extraction → neural encoding → wallet creation |
| 3 | **Authentication Terminal** | `/authenticate` | Upload a palm, watch the pipeline run, get identified with a 98.72% match + match visualization |
| 4 | **Wallet Dashboard** | `/wallet` | Premium palm card, animated counters, spend charts, auth history, security gauge |
| 5 | **Transaction Simulator** | `/store` | Futuristic store, live cart, "Place Palm to Pay" → the most satisfying success screen |
| 6 | **Merchant Terminal** | `/merchant` | POS keypad, request payment, live transaction feed |
| 7 | **AI Fraud Detection** | `/fraud` | Behavioural risk scoring (₹200 normal vs ₹5000 attempt), risk gauge, anomaly timeline |
| 8 | **Security Center** | `/security` | AES-256, biometric templates, liveness, ZK identity, live encryption demo |
| 9 | **Analytics** | `/analytics` | BI dashboard — growth, accuracy (FAR/FRR), latency, top merchants |
| 10 | **System Architecture** | `/architecture` | Animated 8-stage pipeline with flowing data |
| 11 | **Investor Mode** | `/investor` | YC-style pitch: TAM, Amazon One comparison, advantages, roadmap |

---

## 🎨 Design language

- **Dark luxury** theme on `#05070A`
- **Glassmorphism** surfaces, soft shadows, floating cards
- **Aurora gradients** and cinematic blur layers everywhere
- Brand palette: Primary `#00E5FF` · Secondary `#7B61FF` · Accent `#00FFA3`
- **Everything animates** — page transitions, scroll reveals, count-ups, spring micro-interactions
- Fully **responsive** (mobile → desktop) and respects `prefers-reduced-motion`

---

## 🛠️ Tech stack

**Frontend (this app — runs standalone):**
- [Next.js 14](https://nextjs.org) (App Router) + **TypeScript**
- [Tailwind CSS](https://tailwindcss.com) — custom design system
- [Framer Motion](https://www.framer.com/motion/) — all animations
- [Zustand](https://github.com/pmndrs/zustand) — wallet / cart state
- [Recharts](https://recharts.org) — charts
- [Lucide React](https://lucide.dev) — icons
- Web Audio API — synthesised success/scan sounds (no audio assets)

**Optional backend (mirrors the demo data as REST):**
- [FastAPI](https://fastapi.tiangolo.com) — see [`backend/`](./backend)
- Designed to be backed by **Supabase** in production

> The frontend ships with realistic built-in mock data (50 users, transactions,
> merchants, auth logs, fraud alerts) so it runs with **zero backend setup**.

---

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev

# 3. Open the app
#    http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

### Two ways to use it
Both **`/register`** and **`/authenticate`** have a mode toggle:

- **Live (Real-time camera)** — *default*. Real palm biometrics from your webcam (see below).
- **Scripted Demo** — the cinematic upload-driven walkthrough (no camera needed).

### Try the live biometric flow
1. **`/register`** → *Live Enroll* → **Enable Camera** → position your palm in the guide →
   capture strong samples → name your identity → get Palm ID / Wallet ID / Biometric Token.
2. **`/authenticate`** → *Live Login* → **Enable Camera** → scan your palm →
   if it matches an enrolled template you get **ACCESS GRANTED** with a confidence score.
3. **`/store`** → add items → **Place Palm to Pay** → 🎉 · **`/wallet`** reflects the payment.

---

## 🔬 Real-time palm biometrics (how it works)

The live flow runs the **exact image-processing pipeline from `palmpaymodel_training.ipynb`**,
ported op-for-op to **OpenCV.js** (the same OpenCV C++ core compiled to WASM — identical results
to the Python `cv2` notebook). Everything runs **on-device in the browser** — no server, no upload.

**Pipeline (`lib/opencv/pipeline.ts`) — mirrors the notebook's `preprocess_image`:**
```
capture (webcam 640×480, grayscale)
  → segment_hand     (GaussianBlur 5×5 → threshold 20 → MORPH_CLOSE 5×5)
  → largest contour  (RETR_EXTERNAL, max area)  → palm centre (moments)
  → ROI crop 220px around centre → resize 224×224     (centre-crop fallback for webcam backgrounds)
  → medianBlur 5
  → CLAHE (clip 3.0, tiles 8×8)
  → unsharp (addWeighted 1.5 / −0.5)
  → normalize MIN-MAX 0..255
  → gamma 1.5  →  enhanced 224×224 ROI
```

**Matching (`lib/opencv/matcher.ts`):** MobileNetV2 embeddings on the enhanced ROI,
compared with cosine similarity. Enrollment keeps the strongest samples per identity;
login takes the best match across samples and grants access when similarity clears the
threshold and beats the runner-up.

- **Storage:** enrolled templates persist in `localStorage` (embeddings only — never raw images).
- **Lazy & light:** the 11MB OpenCV.js (`public/vendor/opencv.js`, self-hosted, no CDN) loads
  **only when you start the camera**, so every other page stays instant.
- **Verify the engine headless:** `node scripts/cvtest.cjs` exercises the full pipeline + matcher
  (prints `SAME` vs `DIFF` similarity — same palm should dominate).

> **Honesty note:** real palm-vein systems use near-infrared sensors. A standard RGB webcam can't
> see sub-dermal veins, so the live demo matches the palm's surface texture/creases via the same
> pipeline. Matching thresholds (`MIN_SIMILARITY`, `MARGIN` in `matcher.ts`) are tuned conservatively and
> are easy to adjust for your lighting/camera.

---

## 🧩 Optional FastAPI backend

A lightweight FastAPI service that exposes the same data as real endpoints
(`/api/users`, `/api/transactions`, `/api/metrics`, `POST /api/authenticate`, …):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Docs at http://localhost:8000/docs
```

See [`backend/README.md`](./backend/README.md) for details and the Supabase notes.

---

## 📁 Project structure

```
palmpay/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Landing
│   ├── register/             # Palm registration wizard
│   ├── authenticate/         # Authentication terminal
│   ├── wallet/               # Wallet dashboard
│   ├── store/                # Transaction simulator
│   ├── merchant/             # Merchant POS terminal
│   ├── fraud/                # AI fraud detection
│   ├── security/             # Security center
│   ├── analytics/            # Analytics dashboard
│   ├── architecture/         # Live system architecture
│   ├── investor/             # Investor pitch mode
│   ├── layout.tsx            # Root layout + fonts
│   └── globals.css           # Design system
├── components/
│   ├── landing/              # Hero, WhyPalmPay, PaymentJourney, FeatureGrid, ...
│   ├── layout/               # Navbar, Footer, PageShell
│   ├── charts/               # Themed Recharts wrappers
│   ├── ui/                   # GlassCard, GlowButton, Counter, Reveal, RadialGauge, ...
│   ├── WebcamScanner.tsx     # Live webcam capture + palm positioning guide
│   ├── LiveEnroll.tsx        # Real biometric enrollment (best-of samples)
│   ├── LiveLogin.tsx         # Real biometric login (match → grant access)
│   ├── BiometricModeToggle.tsx # Live vs Scripted-demo switch
│   ├── PalmMesh.tsx          # Animated palm + vein network
│   ├── NeuralNet.tsx         # Neural network visualization
│   ├── PalmUploader.tsx      # Image upload + vein scan overlay
│   ├── ProcessingStages.tsx  # Sequential pipeline animation
│   ├── MatchVisualizer.tsx   # Query ↔ vault correspondence
│   ├── PaymentFlow.tsx       # Place-palm-to-pay → success
│   ├── Confetti.tsx          # Energy particle burst
│   └── PalmCard.tsx          # Premium wallet card
├── lib/
│   ├── opencv/
│   │   ├── loader.ts         # Loads self-hosted OpenCV.js (WASM)
│   │   ├── useOpenCV.ts      # Lazy React hook for the engine
│   │   ├── pipeline.ts       # Exact notebook pipeline (ROI → CLAHE → … → gamma)
│   │   └── matcher.ts        # Embedding similarity matching
│   ├── biometricStore.ts     # Enrolled templates (localStorage + Zustand)
│   ├── mockData.ts           # 50 users + transactions + merchants + logs + fraud
│   ├── store.ts              # Zustand store (wallet/cart)
│   ├── nav.ts                # Navigation config
│   ├── sound.ts              # Web Audio synthesised SFX
│   ├── types.ts              # Shared types
│   └── utils.ts              # cn, inr, count helpers, seeded RNG
├── public/vendor/opencv.js   # Self-hosted OpenCV.js (WASM, ~11MB)
├── scripts/cvtest.cjs        # Headless pipeline/matcher verification
├── backend/                  # Optional FastAPI service (scripted-demo data)
└── ...config files
```

---

## 📝 Notes

- This is a **concept demo**. In the live flow, palm frames are processed
  **entirely on-device** — only irreversible embeddings are saved (to
  `localStorage`); raw images never leave the browser and are never uploaded.
- Demo data is generated from a fixed seed so it's identical on every load
  (no hydration mismatches).
- Currency is **INR (₹)**.

---

*Built as a movie-grade product experience — designed to feel like a real
billion-dollar fintech, not a prototype.*
