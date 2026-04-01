/*
File: scripts/voice_ui_controller.js

Purpose:
This module manages the voice interaction controls of the AI interface.
It connects the microphone button with the microphone capture system,
speech recognition engine, and UI state updates.

Responsibilities:
1. Handle microphone button clicks
2. Start microphone listening
3. Start speech recognition stream
4. Receive final speech transcript
5. Stop voice system safely
6. Update AI state during voice interaction

Architecture Role:
This module acts as the main controller for voice UI interactions.

Mic Button Click
       │
       ▼
voice_ui_controller.js
       │
       ├── audio_visualizer.js (mic audio capture)
       ├── speech_stream.js (speech recognition)
       ├── state_manager.js (AI state updates)
       └── UI elements (mic animation)
*/


// Import microphone listening controls
import { startMicListening, stopMicListening } from "./audio_visualizer.js";

// Import speech recognition engine
import { startSpeechStream } from "./speech_stream.js";

// Import state management functions
import { setState } from "./state_manager.js";

// Import predefined AI states
import { AI_STATES } from "../config/ui_states.js";


// Local flag indicating if voice listening is active
let listening = false;


// Global listening flag (accessible from other modules)
export let globalIsListening = false;


// Reference to microphone button element
let mic = null;


/* =====================================================
   SAFE DOM INIT
===================================================== */
// Wait for DOM to be ready before accessing UI elements
window.addEventListener("DOMContentLoaded", () => {

    // Get reference to microphone button
    mic = document.getElementById("mic-button");

    // Safety check if button is missing
    if (!mic) {
        console.warn("Mic button not found");
        return;
    }

    // Attach click event to microphone button
    mic.addEventListener("click", toggleVoice);
});


/* =====================================================
   TOGGLE VOICE
===================================================== */
// Starts or stops the voice system depending on current state
async function toggleVoice() {

    // Safety check
    if (!mic) return;

    // If system is not currently listening
    if (!listening) {

        // Enable listening flags
        listening = true;
        globalIsListening = true;

        // Update AI state
        setState(AI_STATES.LISTENING);

        try {

            // Start microphone audio capture
            await startMicListening();

            // Start speech recognition
            startSpeechStream(onFinalTranscript, onEnd);

            // Update mic button UI
            mic.classList.add("listening");

        } catch (err) {

            console.error("Mic start failed:", err);

            // Stop voice system on failure
            stopVoice();
        }

    } else {

        // If already listening → stop voice system
        stopVoice();
    }
}


/* =====================================================
   FINAL TRANSCRIPT RECEIVED
===================================================== */
// Called when speech recognition produces final text
function onFinalTranscript(text) {

    // Get text input layer
    const layer = document.getElementById("text-layer");

    if (!layer) return;

    // Update input field safely in next animation frame
    requestAnimationFrame(() => {

        layer.textContent = text;

        // Focus input field
        layer.focus();
    });

    // Change AI state to thinking
    setState(AI_STATES.THINKING);
}


/* =====================================================
   SPEECH END (Silence / Manual Stop)
===================================================== */
// Triggered when speech recognition session ends
function onEnd() {

    stopVoice();
}


/* =====================================================
   STOP VOICE SYSTEM
===================================================== */
// Safely stops microphone listening and resets UI state
function stopVoice() {

    // Safety check
    if (!mic) return;

    // Remove listening animation
    mic.classList.remove("listening");

    // Show processing animation briefly
    mic.classList.add("processing");

    setTimeout(() => {
        mic.classList.remove("processing");
    }, 700);


    // Reset listening flags
    listening = false;
    globalIsListening = false;


    // Stop microphone capture
    stopMicListening();


    // Prevent state override while AI response is processing
    if (!globalIsListening) {
        setState(AI_STATES.IDLE);
    }
}


// Export stopVoice so other modules can stop voice system
export { stopVoice };