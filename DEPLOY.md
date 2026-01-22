# Deploying Your Platform

This guide covers setting up your codebase on GitHub, deploying the frontend to Vercel, and launching your backend infrastructure on Hetzner.

## 1. Version Control (GitHub)

1.  **Create a Repository**:
    *   Go to [GitHub.com](https://github.com/new).
    *   Name it `ar-menu-platform`.
    *   Set it to **Private**.
    *   Do **not** initialize with README/gitignore (you already have them).

2.  **Push Your Code**:
    *   Open your terminal in the project folder.
    *   Run these commands (replace `YOUR_USERNAME` with your GitHub username):
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/ar-menu-platform.git
        git branch -M main
        git push -u origin main
        ```

## 2. Frontend Hosting (Vercel)

Vercel is the native home for Next.js and handles the global CDN for your restaurant menus.

1.  **Sign Up/Login**: Go to [vercel.com](https://vercel.com) and login with GitHub.
2.  **Import Project**:
    *   Click **"Add New..."** -> **"Project"**.
    *   Select your `ar-menu-platform` repository.
3.  **Configure Environment Variables**:
    *   Copy the values from your local `.env.local` file.
    *   Add them to the Vercel **Environment Variables** section:
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `NEXT_PUBLIC_N8N_WEBHOOK_URL` (You will update this later after setting up Hetzner)
4.  **Deploy**: Click **Deploy**.
    *   Vercel will give you a domain like `ar-menu-platform.vercel.app`. You can use this immediately.

## 3. Backend Infrastructure (Hetzner)

**Why Hetzner?**
For 500+ tenants, you need raw power. A **CPX41** (6 vCPU, 16GB RAM) costs ~$30/mo on Hetzner. The same specs on AWS/Vercel would cost $150+.

### A. Create the Server
1.  Sign up at [Hetzner Cloud](https://console.hetzner.cloud/).
2.  Create a **Project** (e.g., "MenuPlatform").
3.  Click **"Add Server"**:
    *   **Location**: Falkenstein or Helsinki (Cheapest/Best performance).
    *   **Image**: **Ubuntu 24.04** (Standard).
    *   **Type**: **CPX31** (4 vCPU, 8GB RAM) is a perfect starting point. You can upgrade to CPX41 later with one click.
    *   **SSH Key**: Upload your public SSH key (`id_rsa.pub`) to access the server securely.
4.  **Create & Buy**. You will get an IP address (e.g., `123.45.67.89`).

### B. Access & Setup
1.  **SSH into your server**:
    ```bash
    ssh root@123.45.67.89
    ```
2.  **Install Docker & Docker Compose**:
    ```bash
    # Update system
    apt update && apt upgrade -y

    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh

    # Verify
    docker compose version
    ```

### C. Deploy n8n Stack
1.  **Copy your infrastructure files**:
    *   You can use `scp` to copy your `infrastructure` folder to the server:
        ```bash
        scp -r ./infrastructure/n8n root@123.45.67.89:/root/n8n-stack
        ```
2.  **Configure Environment**:
    ```bash
    cd /root/n8n-stack
    cp .env.example .env
    nano .env
    ```
    *   **Domain**: Since you don't have a domain yet, use `nip.io` for magic SSL.
        *   Set `DOMAIN_NAME` to `123.45.67.89.nip.io` (Replace with your actual IP).
        *   This tricks Let's Encrypt into giving you a valid SSL certificate for `n8n.123.45.67.89.nip.io`.
3.  **Launch**:
    ```bash
    docker compose up -d
    ```
4.  **Verify**: Open `https://n8n.123.45.67.89.nip.io` in your browser.

## 4. Connecting the Dots

1.  **Update Supabase**: Since we are using Supabase for the database, ensure your `docker-compose.yml` for n8n points to Supabase *OR* keep the self-hosted Postgres for n8n internal data (Recommended for performance).
2.  **Update Vercel**:
    *   Go back to Vercel Settings.
    *   Update `NEXT_PUBLIC_N8N_WEBHOOK_URL` to your new webhook URL (e.g., `https://n8n.123.45.67.89.nip.io/webhook/order`).
    *   Redeploy the frontend.
