# Fahad AI Avatar

A voice-enabled AI avatar with vision capabilities powered by Google Gemini. Talk to Fahad naturally - he can see you through your webcam and respond intelligently using his comprehensive background and expertise.

## Features

- 🎤 **Voice Conversation**: Natural speech recognition and text-to-speech
- 📹 **Vision Capabilities**: Camera always enabled - Fahad can see you through webcam (Google Gemini 2.0 Flash)
- 💬 **Natural Responses**: Fahad responds like a human friend with his personality
- 🎭 **Animated 3D Avatar**: Realistic lipsync with Oculus Visemes and subtle animations
- 🔄 **Speech Interruption**: Interrupt Fahad anytime by speaking - he'll stop and listen
- 🧠 **Comprehensive Persona**: Fahad has detailed knowledge about his education, experience, projects, and skills
- 🎨 **Professional Appearance**: Contemporary 3D avatar with well-groomed anchor beard and modern hairstyle

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys

Create a `.env.local` file (copy from `.env.example`):

```bash
# Google Gemini API Configuration (For vision chat when camera is on - FREE with generous quota!)
# Get your free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Tavily Search API Configuration
# Used to fetch Fahad's personality from fahadimdad.com
TAVILY_API_KEY=your_tavily_api_key_here
```

**Get API Keys:**
- Google Gemini (FREE): https://aistudio.google.com/app/apikey
- Tavily Search (FREE): https://tavily.com

**Optional APIs:**
```bash
# ElevenLabs API Configuration (For text-to-speech)
# Falls back to Web Speech API if not configured
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

### 3. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Click anywhere** to start the conversation
2. **Camera & Microphone**: Always enabled by default
3. **Talk naturally** - Fahad will respond with voice
4. **Interrupt anytime** - Just start speaking and Fahad will stop and listen

## Persona & Behavior

### Fahad's Identity
- **Name**: Muhammad Fahad Imdad
- **Current Role**: AI Agent Engineer at Beam AI (Nov 2025 - Present)
- **Education**: B.S. in Computer Science, Salim Habib University (CGPA: 3.68/4.0, Gold Medallist)
- **Location**: Karachi, Pakistan
- **Contact**: fahadimdad966@gmail.com | fahadimdad.com

### What Fahad Does
Designing and deploying autonomous AI agents that replace manual business processes with intelligent, fully automated systems.

### Expertise
- **AI & ML**: Machine Learning, Deep Learning, NLP, Computer Vision, Generative AI, Agentic AI, LLM Orchestration
- **Technologies**: Python, TensorFlow, PyTorch, LangChain, Azure OpenAI, Gemini, React, Flutter, Unity, ARCore
- **Specializations**: AI Agents, RAG Systems, Multi-Agent Architectures, Computer Vision, NLP, AR/VR Development

### Vision Behavior

When camera is ON, Fahad mentions what he sees **only when**:
- You explicitly ask ("what do you see?", "how do I look?", "what am I wearing?")
- It's contextually critical (e.g., commenting on outfit when asked "should I go to this event?")
- He notices something concerning (e.g., you appear distressed)

Otherwise, he responds naturally without describing the scene - like talking on the phone.

### Response Style
- **Concise**: Maximum 3 sentences per response
- **Natural**: Speaks like a human friend
- **Warm & Professional**: Friendly yet professional tone
- **First Person**: Speaks as "I" (representing Fahad)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **3D Avatar**: Three.js, React Three Fiber, ReadyPlayerMe with Oculus Visemes
- **AI**: Google Gemini 2.0 Flash Exp (vision + text)
- **Voice**: ElevenLabs API or browser's Web Speech API (fallback)
- **Speech Recognition**: Browser's Web Speech API
- **Search**: Tavily Search API (for fetching Fahad's info from fahadimdad.com)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat-gemini/      # Google Gemini API (vision + text)
│   │   ├── chat/              # Groq API (backup/alternative)
│   │   ├── speak/             # ElevenLabs TTS
│   │   └── tavily-search/     # Tavily Search API
│   ├── page.js                # Main application
│   ├── page.module.css        # Component styles
│   └── globals.css            # Global styles
├── components/
│   └── Avatar.js              # 3D avatar with lipsync
├── config/
│   └── persona.js             # Fahad's identity, personality, and behavior
├── public/
│   └── Asset/
│       └── fahad_2.glb        # ReadyPlayerMe 3D model with Oculus Visemes
└── .env.local                 # API keys (not committed)
```

## Key Features Explained

### Speech Interruption
- User can interrupt Fahad at any time by speaking
- AI immediately stops talking and starts listening
- Smooth state transitions prevent hanging or stuck states

### Persona Configuration
All of Fahad's identity, personality, and knowledge is centralized in `config/persona.js`:
- Basic identity (name, contact, website)
- Current role and work description
- Education and achievements
- Previous experience
- Projects and skills
- Physical appearance
- Response guidelines
- Vision behavior rules

### Lip Sync
- Uses Oculus Visemes morph targets from ReadyPlayerMe
- Analyzes audio frequency data in real-time
- Maps audio to appropriate viseme shapes (aa, E, I, O, U, PP, etc.)
- Smooth blending between viseme states

## Cost & Performance

- **Google Gemini 2.0 Flash**: FREE tier with generous quota, very fast
- **Tavily Search**: FREE tier available
- **ElevenLabs**: Optional (has free tier), falls back to browser TTS
- **Speech Recognition**: FREE (browser API)

## Troubleshooting

- **No microphone access**: Check browser permissions (Settings > Privacy > Microphone)
- **Camera not working**: Enable camera permission in browser
- **No response**: Check browser console for API key errors
- **Lipsync not working**: Verify avatar has Oculus Visemes - check console logs
- **Speech interrupted error**: Normal during interruptions, error handling in place
- **Stuck in listening mode**: Recognition auto-restarts with 100ms delay
- **Module not found (@tavily/core)**: Install dependencies with `npm install`

## Development Notes

### Adding New Persona Information
Edit `config/persona.js` to add:
- New projects
- Updated experience
- Additional skills
- Modified response guidelines

### Changing Avatar
Replace `public/Asset/fahad_2.glb` with a new ReadyPlayerMe avatar that includes Oculus Visemes:
- Generate avatar at https://readyplayer.me/
- Add `?morphTargets=Oculus+Visemes` to the URL when downloading
- Update `avatarUrl` in `components/Avatar.js`

### API Integration
- `app/api/chat-gemini/route.js`: Handles vision + text chat with Gemini
- `app/api/speak/route.js`: Converts text to speech using ElevenLabs
- `app/api/tavily-search/route.js`: Searches fahadimdad.com for Fahad's info

## License

MIT

---

Built with ❤️ using Next.js, Google Gemini, and React Three Fiber
