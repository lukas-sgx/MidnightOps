# MidnightOps

MidnightOps is a self-hosted incident management and on-call scheduling platform for DevOps/SRE teams. It centralizes alerts from monitoring systems, creates and tracks incidents, routes notifications to on-call engineers, and provides a real-time web dashboard to manage the full incident lifecycle.

---

## Features

- Alert ingestion via HTTP webhook (e.g. from Prometheus/Alertmanager or custom tools).
- Incident lifecycle: creation, acknowledgment, resolution, basic timeline.
- On-call schedules (who is on call now for each team/service).
- Simple escalation policies based on severity and response timeout.
- Notifications through Slack and email in the MVP.
- React dashboard with real-time updates for active incidents and details.

---

## Tech Stack

**Backend**

- Node.js + TypeScript  
- Express (HTTP API)  
- PostgreSQL (relational data store)  
- Redis (pub/sub + background jobs)  
- WebSockets (Socket.io) for real-time incident updates  

**Frontend**

- React + TypeScript  
- Tailwind CSS  
- React Query (API data fetching)  
- Axios (HTTP client)  

**Infra / Tooling**

- Docker & docker-compose for local development  
- ESLint + Prettier + TypeScript strict mode  
- Jest / Vitest for unit tests  
- GitHub Actions for basic CI (lint, test, build)  

---

## High-level Architecture

- Monitoring tools send alerts to the MidnightOps HTTP webhook.  
- The backend correlates/deduplicates alerts and creates or updates incidents in PostgreSQL.  
- An escalation engine uses Redis-backed jobs to notify on-call users and escalate if nobody acknowledges within the configured delay.  
- The React frontend subscribes to incident events (WebSockets) and displays a live dashboard of current and recent incidents.  

---

## Project Goals (Epitech Hub Context)

- Implement an end-to-end incident flow: **alert → incident → on-call notification → ACK → resolution → short postmortem**.  
- Demonstrate a clean full-stack architecture using **React, Node.js, TypeScript, PostgreSQL, Redis**.  
- Deliver a deployable MVP (Docker) showcasing modern **incident management and SRE/DevOps practices** (on-call, escalation, incident lifecycle).  

---

## Getting Started (MVP Dev Setup)

1. Clone the repository and install dependencies in `backend/` and `frontend/`.  
2. Start PostgreSQL, Redis, backend and frontend using `docker-compose` in the `infra/` folder.  
3. Open the frontend in your browser and create/list incidents through the UI.  

More details (commands, environment variables, API routes) can be added later in `docs/ARCHITECTURE.md` and `docs/API.md`.
