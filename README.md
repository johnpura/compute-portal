# Compute Portal

A small self-service portal for an imaginary AI compute cluster. Researchers
request GPU jobs, an operations dashboard shows utilization, and an admin view
approves or denies pending requests.

## Stack

| Layer     | Technology              | Why it's here                          |
|-----------|-------------------------|----------------------------------------|
| Frontend  | React (Vite)            | Portal, dashboard, and admin UI        |
| Charts    | recharts                | The dashboard's GPU-demand bar chart   |
| Backend   | Flask + SQLAlchemy      | REST API                               |
| Database  | PostgreSQL              | Stores users and jobs                  |
| Runtime   | Docker + docker-compose | Runs all three services together       |

## Run it

You only need Docker installed.

```bash
docker compose up --build
```

Then open **http://localhost:5173**.

The backend seeds a few sample users and jobs on first run, so the dashboard
and tables won't be empty. To wipe the data and start fresh:

```bash
docker compose down -v   # the -v removes the database volume
docker compose up --build
```

## What's where

```
compute-portal/
├── docker-compose.yml      # orchestrates all three services
├── backend/
│   ├── app.py              # Flask app + all REST endpoints
│   ├── models.py           # User and Job tables (SQLAlchemy)
│   ├── db.py               # the shared database object
│   ├── seed.py             # sample data on first run
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.jsx                  # tab shell
    │   ├── api.js                   # fetch wrapper for the backend
    │   └── components/
    │       ├── Portal.jsx           # request form + job list
    │       ├── Dashboard.jsx        # metrics + chart
    │       ├── AdminView.jsx        # approve / deny
    │       └── StatusBadge.jsx      # reusable pill
    └── Dockerfile
```

## API reference

| Method | Path                       | Purpose                         |
|--------|----------------------------|---------------------------------|
| GET    | `/api/health`              | Liveness check                  |
| GET    | `/api/users`               | List users                      |
| GET    | `/api/jobs`                | List jobs (`?status=pending`)   |
| POST   | `/api/jobs`                | Create a job request            |
| GET    | `/api/jobs/<id>`           | Fetch one job                   |
| POST   | `/api/jobs/<id>/approve`   | Approve a pending job           |
| POST   | `/api/jobs/<id>/deny`      | Deny a pending job              |
| GET    | `/api/stats`               | Dashboard summary               |

Quick test from the command line once it's running:

```bash
curl http://localhost:5000/api/stats
```

## Running pieces individually (optional)

You don't need this for the demo, but it's useful while learning.

**Backend only** (needs a local Postgres, or point `DATABASE_URL` at one):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed.py
python app.py
```

**Frontend only** (needs Node 18+):

```bash
cd frontend
npm install
npm run dev
```

## Suggested next steps

- Replace the researcher dropdown with real login/authentication.
- Add a "running → completed" transition with timestamps and real duration.
- Write a few tests (pytest for the API, Vitest for components).
- Deploy the stack to a local Kubernetes cluster with `kind` or `minikube`
  to cover the Kubernetes requirement.
