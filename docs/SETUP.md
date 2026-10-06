# Local Development Setup Guide

This guide walks you through setting up, configuring, running, and testing the **AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace** locally.

---

## 1. System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu 22.04+ recommended)
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: v18.0.0+ (tested on v22.14.0)
- **npm**: v9.0.0+ (tested on v10.9.2)
- **Git**: 2.30+

---

## 2. Repository Cloning & Structure

```bash
git clone https://github.com/Satya1135/ai-linux-investigation-workspace.git
cd ai-linux-investigation-workspace
```

The workspace directory layout:
```
ai-linux-investigation-workspace/
├── frontend/             # React + Vite + TypeScript frontend
├── backend/              # FastAPI Python backend
├── docs/                 # Engineering and architectural documentation
├── sample-data/          # Sample forensic logs & Linux telemetry
└── scripts/              # Automation and deployment scripts
```

---

## 3. Backend Setup

### Step 3.1: Create & Activate Python Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3.2: Install Backend Dependencies

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Step 3.3: Configure Environment Variables

Copy the environment template:
```bash
cp .env.example .env
```
*(The defaults in `.env.example` are preconfigured for local development.)*

### Step 3.4: Run the Backend Service

```bash
# From workspace root with .venv activated:
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend health in another terminal:
```bash
curl http://localhost:8000/health
# Expected Output: {"status":"ok"}
```

Access interactive API documentation:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. Frontend Setup

### Step 4.1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 4.2: Configure Frontend Environment Variables

```bash
cp .env.example .env
```
Ensure `VITE_API_URL` points to your backend instance (default: `http://localhost:8000`).

### Step 4.3: Start Frontend Dev Server

```bash
npm run dev
```
The application will be live at:
[http://localhost:5173](http://localhost:5173)

---

## 5. Running Tests

### Backend Unit Tests

Run the backend test suite using `pytest`:
```bash
# From repository root with .venv activated:
pytest -v backend/tests
```

All health check tests and ASGI transport tests will execute and validate the `/health` and root endpoints.

### Frontend Typecheck & Build Verification

```bash
cd frontend
npm run build
```
This runs TypeScript checking (`tsc`) followed by Vite production bundling.
