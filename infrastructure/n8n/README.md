# Self-Hosted n8n Multi-Tenant Infrastructure

This directory contains the production-ready infrastructure code for hosting a scalable, multi-tenant n8n instance capable of serving 500+ restaurants.

## 🏗 Architecture
-   **Orchestrator**: Docker Compose (can practice locally, deploy to swarm/k8s easily).
-   **Execution Mode**: **Queue Mode** (Decoupled Main & Workers).
    -   `n8n-main`: Handles Webhooks, Scheduling, and UI.
    -   `n8n-worker`: Scalable worker nodes that process workflows in the background.
    -   `Redis`: Job queue broker.
-   **Database**: PostgreSQL 16 (Stores both n8n internal data and our multi-tenant schemas).
-   **Proxy**: Traefik (Auto-SSL management and Load Balancing).

## 🚀 Quick Start

### 1. Configuration
Copy the environment template and secure it:
```bash
cp .env.example .env
# EDIT .env with your real domains and passwords!
```

### 2. Launch
```bash
docker-compose up -d
```

### 3. Scaling Workers
When traffic spikes (e.g., Friday nights), scale the workers horizontally:
```bash
docker-compose up -d --scale n8n-worker=5
```
*(This starts 5 concurrent worker containers consuming jobs from Redis)*

## 🔐 Multi-Tenant Strategy

### Database Schema
We use a **Shared Database, Shared Schema** approach with logical isolation via `tenant_id`. See `init-scripts/01-schema.sql`.

### The "Master Workflow" Pattern
Instead of creating 500 workflows, create **ONE** Master Order Router.

1.  **Webhook Node**: Receives ALL requests.
    -   Path: `POST /webhook/order`
    -   Auth: Header Auth (API Key)
2.  **Postgres Node (Lookup)**:
    -   Query: `SELECT * FROM tenants WHERE api_key = $headers["x-api-key"]`
    -   Result: Gets `tenant_id`, `slack_webhook`, `printer_ip`.
3.  **Router/Switch Node**:
    -   Uses logic based on `settings` found in DB.
    -   *Example*: If `settings.has_slack` is true, route to Slack Sub-workflow.
4.  **Action Nodes**:
    -   Perform actions using variables fetched from step 2 (Dynamic Mapping).
    -   *Example*: HTTP Request to `${slack_webhook}` (not hardcoded).

## 🛡 Security Hardening
1.  **Restrict Webhook Access**: Use Traefik middlewares to whitelist IP ranges if possible, or implement Header Authentication in n8n (X-API-KEY).
2.  **Network Isolation**: The `docker-compose` defines an internal `n8n_network`. Redis and Postgres are NOT exposed 
    to the host machine ports, only reachable by n8n containers.
3.  **SSL**: Traefik handles auto-renewal of Let's Encrypt certificates.

## 💻 Hardware Requirements (Estimate for 500 Active Tenants)

| Spec | Recommended | Notes |
| :--- | :--- | :--- |
| **CPU** | 4 - 8 vCPUs | n8n is Node.js based (single threaded per process), so more cores = more workers. |
| **RAM** | 16 GB - 32 GB | Main uses ~1GB. Each Worker can use 500MB - 1GB depending on load. |
| **Disk** | 100GB+ NVMe | Fast I/O is critical for DB/Redis during high order volume. |
