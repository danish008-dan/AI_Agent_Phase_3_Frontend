# PROJECT – F Neural Core (Frontend)

A futuristic AI-powered frontend interface designed to simulate a human-like conversational system with real-time voice, text, and visual interaction.

This project integrates advanced UI design, real-time AI streaming, speech synthesis, and a neural visualization system using Three.js.

---

## FEATURES

### Voice and Text Interaction
- Real-time voice input (speech-to-text)
- Text-based chat input
- Automatic message sending on voice detection

### AI Speech System (TTS)
- Streaming AI responses
- Sentence-level speech queue
- Smooth audio playback with queue management

### Real-Time AI Streaming
- Fetch API streaming responses
- Incremental UI updates while AI responds

### Neural Orb Visualization
- Three.js powered animated AI orb
- Dynamic response-based visual behavior
- Audio-reactive effects

### OS Voice Command Mode
- Activate system-level commands via voice
- Continuous voice loop interaction
- Supports commands such as:
  - "stop os"
  - system execution commands

### Modern UI Design
- Glassmorphism input bar
- Neon gradient branding
- Particle.js animated background
- Responsive layout

---

## PROJECT STRUCTURE

graphic_ai/
│
├── index.html
│
├── styles/
│   ├── ui_core.css
│   ├── orb.css
│   └── states.css
│
├── config/
│   └── ui_states.js
│
└── scripts/
    ├── ui_app.js
    ├── state_manager.js
    ├── api_client.js
    ├── orb_controller.js
    ├── audio_visualizer.js
    ├── audio_bridge.js
    ├── neural_orb.js
    ├── orb_render.js
    ├── speech_stream.js
    ├── ui_mode_controller.js
    ├── voice_shader.js
    └── voice_ui_controller.js
