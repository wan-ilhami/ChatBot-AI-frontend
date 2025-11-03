# ChatBot AI Assistant Frontend

A modern React-based chat interface for the ChatBot AI Assistant, helping users find ZUS Coffee outlets, explore products, and perform calculations.

---

## 🚀 Live Demo
[**View Live App**](https://chatbot-ai-two-red.vercel.app/)  

---

## Setup & Run Instructions

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Verify Backend is Running

Ensure the FastAPI backend is running on `http://localhost:8000`:

```bash
python -m uvicorn app.backend:app --host 0.0.0.0 --port 8000
```

### Step 4: Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Step 5: Build for Production

```bash
npm run build
```

Output files will be in the `dist/` folder.

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────┐
│    React Chat Interface (Vite)      │
│  (App.jsx + Tailwind CSS)           │
├─────────────────────────────────────┤
│  State Management (React Hooks)     │
│  - Messages & conversation history  │
│  - UI state (loading, panels, etc)  │
│  - Agent activity tracking          │
├─────────────────────────────────────┤
│    API Communication Layer          │
│  (Fetch API to FastAPI backend)     │
├─────────────────────────────────────┤
│  Browser Storage (localStorage)     │
│  - Persist conversation history     │
│  - Session-based user ID            │
└─────────────────────────────────────┘
```

### Core Components

**1. Chat Interface (App.jsx)**
- Single React component managing entire chat UI
- Message rendering with timestamps and metadata
- Command autocomplete and quick actions
- Responsive layout for desktop and mobile

**2. State Management (React Hooks)**
- `useState` for messages, input, loading, API status
- `useRef` for auto-scrolling and input focus
- `useEffect` for side effects (save, scroll, health checks)

**3. API Integration**
- Fetch-based HTTP client to backend at `http://localhost:8000`
- POST `/chat` for sending messages
- POST `/health` for API status monitoring
- Error handling with user-friendly messages

**4. Browser Storage**
- localStorage for conversation persistence
- Per-user storage with unique user_id
- Auto-save on every message update

**5. UI Components**
- Message bubbles (user vs bot)
- Loading indicator with spinner
- Command autocomplete dropdown
- Quick action buttons
- Agent Activity Panel (sidebar)
- API health status indicators

---

## Key Trade-offs

### ✅ Chosen: Single Component Architecture

**Why:** Simple, fast development, easy to understand
**Trade-off:** Component becomes large (600+ lines), harder to test individual parts
**Alternative:** Break into smaller components (MessageList, InputBox, AgentPanel, etc)

### ✅ Chosen: React Hooks (useState/useEffect)

**Why:** Built-in, no external state library needed, sufficient for this scale
**Trade-off:** Can lead to "callback hell" in complex scenarios, prop drilling if components split
**Alternative:** Redux, Zustand, or Jotai for complex state management

### ✅ Chosen: localStorage for Persistence

**Why:** No backend database needed, works offline, simple API
**Trade-off:** Limited storage (~5-10MB per domain), not shared across devices, data lost if cache cleared
**Alternative:** IndexedDB for more storage, or backend database for cloud sync

### ✅ Chosen: Fetch API (No External HTTP Library)

**Why:** Native browser API, minimal dependencies, good enough for simple REST calls
**Trade-off:** More verbose error handling, no request interceptors or caching
**Alternative:** Axios or TanStack Query for advanced features

### ✅ Chosen: Tailwind CSS (Utility Classes)

**Why:** Fast styling, great dark mode support, responsive utilities built-in
**Trade-off:** HTML becomes cluttered with class names, harder to read
**Alternative:** CSS Modules or Styled Components for scoped styling

### ✅ Chosen: Vite as Build Tool

**Why:** Fast HMR (Hot Module Replacement), modern ES modules, minimal config
**Trade-off:** Smaller ecosystem than Webpack, less community packages
**Alternative:** Create React App or Webpack for more stability/docs

### ✅ Chosen: Real-time Agent Activity Panel

**Why:** Provides transparency into AI processing, helps debug issues
**Trade-off:** Adds UI complexity, requires tracking multiple state variables, visual clutter
**Alternative:** Hide by default or only show in dev mode

### ✅ Chosen: Query Enhancement in Frontend

**Why:** Fast local processing, improves search results without backend changes
**Trade-off:** Hardcoded patterns, doesn't scale to new query types
**Alternative:** Move to backend for more flexibility

### ✅ Chosen: localStorage for User ID

**Why:** Persists across sessions without user login
**Trade-off:** Same user on different browsers = different IDs, device-specific
**Alternative:** User authentication system for cross-device support

### ✅ Chosen: Command Autocomplete on Keystroke

**Why:** Provides helpful UX, discoverable feature
**Trade-off:** Extra re-renders, minor performance impact
**Alternative:** Show commands only on explicit trigger (e.g., `/` key)

---

## Folder Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main chat component
│   ├── App.css              # Component styles
│   ├── index.css            # Global styles
│   ├── main.jsx             # React entry point
│   └── assets/              # Static assets
├── public/                  # Static files
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind config
├── eslint.config.js         # Linting rules
└── README.md                # This file
```

---

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

**Version:** 2.0.0  
**Framework:** React 18 + Vite + Tailwind CSS  
**Backend:** FastAPI (http://localhost:8000)