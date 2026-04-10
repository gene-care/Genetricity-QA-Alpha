# Genetricity Q&A Alpha

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in your credentials:
```
MONGODB_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
```

### 3. Start the dev server
```bash
npm run dev
```

This runs two processes in parallel:
- **API server** on `http://localhost:3001` — handles MongoDB and OpenAI calls
- **Vite frontend** on `http://localhost:5173` — the React UI (proxies `/api` to the API server)

Open `http://localhost:5173` in your browser.

---

## Deploying to Vercel

1. Push this project to a GitHub/GitLab repository.
2. Import it in [vercel.com](https://vercel.com).
3. Add environment variables in **Project → Settings → Environment Variables**:
   - `MONGODB_URI`
   - `OPENAI_API_KEY`
4. Deploy — Vercel auto-detects Vite and the `api/` serverless functions.
