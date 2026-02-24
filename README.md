<div align="center">

<br/>

```
 █████╗ ██╗    ██╗   ██╗ ██████╗ ██╗ ██████╗███████╗
██╔══██╗██║    ██║   ██║██╔═══██╗██║██╔════╝██╔════╝
███████║██║    ██║   ██║██║   ██║██║██║     █████╗  
██╔══██║██║    ╚██╗ ██╔╝██║   ██║██║██║     ██╔══╝  
██║  ██║██║     ╚████╔╝ ╚██████╔╝██║╚██████╗███████╗
╚═╝  ╚═╝╚═╝     ╚═══╝   ╚═════╝ ╚═╝ ╚═════╝╚══════╝
     █████╗ ███████╗███████╗██╗███████╗████████╗ █████╗ ███╗   ██╗████████╗
    ██╔══██╗██╔════╝██╔════╝██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║╚══██╔══╝
    ███████║███████╗███████╗██║███████╗   ██║   ███████║██╔██╗ ██║   ██║   
    ██╔══██║╚════██║╚════██║██║╚════██║   ██║   ██╔══██║██║╚██╗██║   ██║   
    ██║  ██║███████║███████║██║███████║   ██║   ██║  ██║██║ ╚████║   ██║   
    ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚══════╝  ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═╝   
```

# 🎙️ AI Voice Assistant

**A Modern Offline-First AI Assistant with Voice, Chat & Beyond**  
_Real-time Speech-to-Text · GPT Integration · Text-to-Speech · Chat Interface · Sub-1.2s Response_

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI_GPT-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![PWA](https://img.shields.io/badge/PWA_Ready-10B981?style=for-the-badge&logo=googlechrome&logoColor=white)](#)
[![Voice](https://img.shields.io/badge/Voice_Enabled-FF4F00?style=for-the-badge&logo=googlepodcasts&logoColor=white)](#)
[![Chat](https://img.shields.io/badge/Chat_Interface-1D9BF0?style=for-the-badge&logo=chatbot&logoColor=white)](#)

<br/>

[![MIT License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-10B981?style=flat-square)](CONTRIBUTING.md)
[![Status](https://img.shields.io/badge/Status-Active-10B981?style=flat-square)](#)

<br/>

> **⚡ Live Demo →** [Launch AI Voice Assistant](#) _(add your deployed URL here)_

<br/>

---

</div>

## 🧠 What Is This?

**AI Voice Assistant** is a Next.js Progressive Web App that brings a **full-featured AI assistant** directly to your browser — powered by OpenAI GPT and built around a seamless voice-first experience, with text chat, real-time transcription, and spoken responses all in one.

No native app. No backend servers. No friction.

```
🎙️ Voice Mode          💬 Chat Mode
──────────────         ────────────
Mic Input              Text Input
    ↓                      ↓
STT Worker             Direct Input
    └──────────┬────────────┘
               ↓
       🤖 OpenAI GPT
               ↓
    ┌──────────┴──────────┐
    ↓                     ↓
🔊 TTS Worker         💬 Chat Display
Audio Playback        Text Response

     All processing: sub-1.2s end-to-end
```

Built for developers and power users who want a **fast, installable, offline-capable** AI assistant — voice or chat, your choice, without the bloat.

<br/>

---

## ✨ Feature Breakdown

<table>
<tr>
<td width="50%">

### 🎙️ Voice Input
- Real-time Speech Recognition via Web Speech API  
- Low-latency audio capture pipeline  
- Web Worker offloading — zero UI thread blocking  
- Smart start/stop toggle interface  

</td>
<td width="50%">

### 🤖 AI Processing
- OpenAI GPT via serverless API route  
- Secure server-side key handling  
- Efficient token-aware request architecture  
- Response streamed to TTS pipeline  

</td>
</tr>
<tr>
<td width="50%">

### 🔊 Audio Output
- Web Speech Synthesis (TTS)  
- Natural voice playback  
- Fully background-processed  
- Configurable voice & rate settings  

</td>
<td width="50%">

### 📱 Progressive Web App
- Installable on desktop & mobile  
- Offline capability via Service Worker  
- Aggressive asset caching strategy  
- Manifest-configured PWA metadata  

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Performance
- **Sub-1.2s** end-to-end latency target  
- Real-time latency tracking (displayed in UI)  
- Optimized Next.js 15 App Router rendering  
- Minimal reflow, paint-optimized pipeline  

</td>
<td width="50%">

### 🏗️ Architecture
- TypeScript throughout — fully type-safe  
- Clean separation of concerns  
- Serverless-friendly deployment  
- Scalable component structure  

</td>
<td width="50%">

### 💬 Chat Interface
- Text-based input alongside voice  
- Persistent conversation display  
- Message history & context passing  
- Seamless voice ↔ chat switching  

</td>
</tr>
</table>

<br/>

---

## 📁 Project Structure

```
ai-voice-assistant/
│
├── app/
│   ├── api/
│   │   └── chat/               # 🤖 OpenAI API route (serverless)
│   │       └── route.ts
│   ├── components/             # 🧩 Feature components
│   │   ├── VoiceButton.tsx
│   │   ├── ResponseDisplay.tsx
│   │   └── LatencyTracker.tsx
│   ├── layout.tsx              # App shell & metadata
│   ├── page.tsx                # Entry page
│   └── globals.css             # Global + Tailwind styles
│
├── components/
│   └── ui/                     # 🎨 Reusable UI primitives
│
├── lib/                        # 🛠️ Utilities & helpers
│
├── public/
│   ├── workers/
│   │   ├── stt.worker.js       # 🎙️ Speech-to-Text Web Worker
│   │   └── tts.worker.js       # 🔊 Text-to-Speech Web Worker
│   ├── manifest.json           # 📱 PWA manifest
│   └── sw.js                   # ⚙️  Service Worker
│
├── .env.local                  # 🔐 Environment variables (not committed)
├── .env.local.example          # 📋 Env template
├── next.config.ts              # ⚙️  Next.js config
└── tsconfig.json
```

<br/>

---

## ⚡ Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | `v18+`  |
| npm         | `v8+`   |
| OpenAI API Key | [Get one here →](https://platform.openai.com/api-keys) |

<br/>

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/ai-voice-assistant.git
cd ai-voice-assistant
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your key:

```env
# .env.local
OPENAI_API_KEY=sk-your_openai_api_key_here
```

> 🔒 **Never commit `.env.local` to version control.**

### 4️⃣ Start the Development Server

```bash
npm run dev
```

Open your browser at:

```
http://localhost:3000
```

<br/>

---

## 🎯 How to Use

**🎙️ Voice Mode**
```
1.  Open the app in a modern browser (Chrome recommended for full STT support)
2.  Click the 🎙️  microphone button to start recording
3.  Speak your query naturally
4.  Click again to stop recording
5.  Watch the latency counter as the AI processes your request
6.  Listen as the response is spoken back to you via TTS
```

**💬 Chat Mode**
```
1.  Type your message in the chat input box
2.  Press Enter or click Send
3.  Read the AI response in the conversation thread
4.  Optionally click 🔊 to have the response read aloud
```

> 💡 **Tip:** Install as a PWA from your browser's address bar for a native app-like experience on any device.

<br/>

---

## 🧪 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| End-to-end latency | **< 1.2s** | STT → API → TTS |
| STT processing | **< 200ms** | Web Worker, off main thread |
| OpenAI API response | **< 800ms** | Serverless edge route |
| TTS synthesis start | **< 100ms** | Native browser synthesis |
| PWA install size | **< 500KB** | Cached assets |

<br/>

---

## 🔮 Roadmap

- [ ] 🧠 **Conversation memory** — contextual multi-turn dialogue  
- [ ] 🌍 **Multi-language support** — STT & TTS in 10+ languages  
- [ ] 🔐 **Secure session handling** — auth-gated usage  
- [ ] 📊 **Conversation analytics** — history, usage stats, export  
- [ ] 🎨 **Voice themes** — custom TTS voice selection  
- [ ] 🌙 **Dark / Light mode toggle**  
- [ ] 📡 **Streaming responses** — token-by-token TTS output  

<br/>

---

## 🤝 Contributing

Contributions are welcome and appreciated!

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit with conventional commits
git commit -m "feat: add amazing feature"

# 4. Push to your fork
git push origin feature/amazing-feature

# 5. Open a Pull Request 🚀
```

Please follow [conventional commits](https://www.conventionalcommits.org/) and keep PRs focused.

<br/>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License — free to use, modify, and distribute.
Attribution appreciated but not required.
```

<br/>

---

<div align="center">

**Built by [Pendalwar Sainath](https://github.com/your-username)**  
_Systems-focused Full-Stack Developer · AI & Performance Enthusiast_

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/your-profile)
[![Portfolio](https://img.shields.io/badge/Portfolio-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://your-portfolio.dev)

<br/>

_If this project helped you, consider leaving a ⭐ — it means a lot!_

<br/>

---

<sub>Made with precision · Optimized for performance · Built to last</sub>

</div>
