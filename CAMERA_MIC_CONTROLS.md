# Camera & Mic Controls - Feature Guide

## Overview
The AI Avatar now has **camera and microphone toggle buttons** that allow you to control which AI API is used and when the avatar can see you.

## Features

### 📹 Camera Button
- **Camera ON (Purple glow)**: 
  - Uses **OpenAI GPT-4o-mini with Vision**
  - Fahad can see you through your webcam
  - Shows a small webcam preview in the bottom-right corner
  - Responds with visual context when relevant
  
- **Camera OFF (Gray)**:
  - Uses **Groq Llama 3.3 70B** (FREE & FAST!)
  - Text-only conversations
  - No webcam access needed
  - Faster responses

### 🎤 Microphone Button
- **Mic ON (Pink glow)**: Fahad listens to you
- **Mic OFF (Gray)**: Fahad stops listening (but can still speak)

## How It Works

### Shared Persona
Both APIs use the same **Fahad persona**:
- Friendly and natural conversational style
- Concise responses (2-3 sentences)
- Warm and helpful tone

### Vision Behavior (Camera ON)
Fahad will mention what he sees **only when**:
1. You explicitly ask (e.g., "what do you see?", "how do I look?")
2. It's contextually relevant (e.g., commenting on your outfit when you ask about going out)
3. He notices something important (e.g., you look tired, happy, etc.)

### Text-Only Mode (Camera OFF)
- Faster responses using Groq's free API
- No visual context
- Great for quick conversations
- Saves on OpenAI API costs

## Setup

### Required API Keys

1. **OpenAI API Key** (for vision when camera is ON)
   - Get it at: https://platform.openai.com/api-keys
   - Add to `.env.local`: `OPENAI_API_KEY=your_key`

2. **Groq API Key** (for text-only when camera is OFF - FREE!)
   - Get it at: https://console.groq.com
   - Add to `.env.local`: `GROQ_API_KEY=your_key`

3. **ElevenLabs API Keys** (optional, for better voice quality)
   - Get it at: https://elevenlabs.io
   - Add to `.env.local`:
     - `NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key`
     - `NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id`

## Usage Tips

1. **Start with camera OFF** for quick text conversations (uses free Groq API)
2. **Turn camera ON** when you want Fahad to see you or comment on visual things
3. **Toggle mic OFF** when you need to pause the conversation
4. The webcam preview appears only when camera is enabled

## Cost Optimization

- **Camera OFF**: Uses Groq (100% FREE, very fast)
- **Camera ON**: Uses OpenAI GPT-4o-mini (very affordable, ~$0.15 per 1M tokens for vision)
- **Voice**: Falls back to browser's built-in TTS if ElevenLabs is not configured

## Troubleshooting

- If camera button doesn't work, check browser permissions
- If no response, check console for API key errors
- Webcam preview only shows when camera is enabled and connected
