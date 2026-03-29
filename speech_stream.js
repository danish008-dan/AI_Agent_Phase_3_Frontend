/*
File: scripts/speech_stream.js

Purpose:
This module handles browser-based speech recognition using the
Web Speech API.

It captures the user's spoken voice through the microphone and
converts it into text that can be processed by the AI backend.

Responsibilities:
1. Initialize browser speech recognition
2. Capture voice input from the user
3. Convert speech into text
4. Return the final recognized text via callback
5. Handle speech recognition errors and lifecycle events

Architecture Role:
This module acts as the voice input layer of the frontend AI system.

Voice Interaction Flow:

User Voice
      │
      ▼
Web Speech API
      │
      ▼
speech_stream.js
      │
      ▼
Final Transcript
      │
      ▼
voice_ui_controller.js
      │
      ▼
API Client → Backend AI
*/


let recognition = null;
let isRunning = false;

// ------------------------------------------------------
// START SPEECH STREAM
// ------------------------------------------------------
export function startSpeechStream(onFinal, onEnd) {

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        console.warn("Speech Recognition not supported");

        if (onEnd) onEnd();
        return;
    }

    // --------------------------------------------------
    // PREVENT DOUBLE START
    // --------------------------------------------------
    if (isRunning) {
        console.log("Recognition already running");
        return;
    }

    // --------------------------------------------------
    // CREATE INSTANCE IF NOT EXISTS
    // --------------------------------------------------
    if (!recognition) {
        recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";
    }

    let hasResult = false;

    // --------------------------------------------------
    // RESULT EVENT
    // --------------------------------------------------
    recognition.onresult = (e) => {

        hasResult = true;

        const finalText = e.results[0][0].transcript;

        console.log("Speech result:", finalText);

        if (onFinal) {
            onFinal(finalText);
        }
    };

    // --------------------------------------------------
    // ERROR EVENT
    // --------------------------------------------------
    recognition.onerror = (e) => {

        if (e.error === "aborted") {
            return;
        }

        console.error("Speech recognition error:", e.error);
    };

    // --------------------------------------------------
    // END EVENT
    // --------------------------------------------------
    recognition.onend = () => {

        console.log("Recognition ended");

        isRunning = false;

        // Important: slight delay before callback
        setTimeout(() => {

            if (onEnd) {
                onEnd();
            }

        }, 300);   // longer delay for Chrome stability
    };

    // --------------------------------------------------
    // START RECOGNITION
    // --------------------------------------------------
    try {

        recognition.start();
        isRunning = true;
        console.log("Recognition started");

    } catch (error) {

        console.error("Recognition start failed:", error);

        isRunning = false;

        setTimeout(() => {
            if (onEnd) onEnd();
        }, 300);
    }
}


// ------------------------------------------------------
// OPTIONAL: FORCE STOP FUNCTION
// ------------------------------------------------------
export function stopSpeechStream() {

    if (recognition && isRunning) {

        try {
            recognition.stop();
        } catch (e) {
            console.warn("Recognition stop error:", e);
        }

        isRunning = false;
    }
}