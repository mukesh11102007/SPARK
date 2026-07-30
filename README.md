# SPARK Studio 🚀

**Small Platform for Agile Rapid Kreation**

A collaborative, AI-powered browser IDE for building and sharing "Small Software" — purpose-built tools that are as easy to share as a Google Doc.

## Tech Stack
- **Frontend**: React.js + Vite + React Flow
- **AI Brain**: Google Gemini 2.5 Flash API
- **Voice Input**: Web Speech API
- **Execution**: StackBlitz WebContainers
- **Realtime DB**: Supabase (Realtime Canvas Sync)
- **Deployment**: Vercel via n8n Webhook Automation
- **Automations**: n8n (Watchdog, Deployment, Error-Alert, Version-Control)

## Features
- 🎨 **VS Code-style IDE UI** — Activity Bar, Explorer Sidebar, Canvas Editor, Terminal Panel
- 🤖 **Intent-to-App** — Describe a component via text or voice; Gemini generates the code and adds it to your canvas
- 🗺️ **React Flow Canvas** — Visual, node-based project architecture. Add, connect, and delete components
- 🚀 **One-click Share** — Deploy your project and get a shareable link instantly
- 🐶 **Watchdog AI** — Automatically detects runtime errors and triggers an n8n webhook for AI-patching
- 🔔 **Error Alerts** — If Watchdog fails, a Discord/Telegram alert is triggered via n8n
- 👥 **Teammate Invites** — Invite collaborators to your workspace
- 🎨 **Theme Switcher** — Antigravity Dark, VS Code Classic, Light Mode

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## n8n Webhook Configuration

Update `src/services/AutomationService.js` with your live n8n webhook URLs:

```js
const WEBHOOK_URLS = {
  watchdog:       'YOUR_WATCHDOG_WEBHOOK_URL',
  deployment:     'YOUR_DEPLOYMENT_WEBHOOK_URL',
  errorAlert:     'YOUR_ERROR_ALERT_WEBHOOK_URL',
  versionControl: 'YOUR_VERSION_CONTROL_WEBHOOK_URL',
};
```

## Environment Variables

Create a `.env` file at the root:

```
VITE_SUPABASE_URL=https://vhajjswtxlrvpnbosdgm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```
