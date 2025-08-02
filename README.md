# AI-Voice-Assistant 

A Next.js Progressive Web App (PWA) that provides offline-first voice assistant capabilities with local speech-to-text, OpenAI integration, and text-to-speech synthesis.

## Features

- 🎙️ **Voice Input**: Real-time speech recognition
- 🤖 **AI Responses**: OpenAI GPT integration
- 🔊 **Audio Output**: Text-to-speech synthesis
- 📱 **PWA Support**: Installable, offline-capable
- ⚡ **Performance Metrics**: Real-time latency tracking
- 🎯 **Sub-1.2s Response Time**: Optimized for speed

# AI Voice Assistant 🎙️

A modern PWA Voice Assistant built with Next.js.

## 🚀 Live Demo
👉 [Deployed-Assistant](https://voice-assistant-pwa.onrender.com/))


## Quick Start

1. **Clone and Install**:
   
   npm install


2. **Add OpenAI API Key**:
   
   cp .env.local.example .env.local
   # Edit .env.local and add your OpenAI API key
   

3. **Run Development Server**:
   
   npm run dev

4. **Open**: http://localhost:3000

## Usage

1. Click the microphone button
2. Speak your question or message
3. Click again to stop recording
4. Wait for AI response and audio playback

## Project Structure


├── app/
│   ├── api/chat/          # OpenAI API integration
│   ├── components/        # React components
│   └── globals.css        # Styles
├── components/ui/         # Reusable UI components
├── lib/                   # Utilities
├── public/
│   ├── workers/          # Web Workers for STT/TTS
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service worker
└── .env.local           # Environment variables


## Technologies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Web Workers** - Background processing
- **Service Workers** - PWA functionality
- **OpenAI API** - AI responses

## License

This project is licensed under the MIT License.

## Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to change.
