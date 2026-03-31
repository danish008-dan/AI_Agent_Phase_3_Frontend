/*
File: scripts/ui_app.js

Purpose:
This file is the main frontend controller of the AI interface.

It initializes the UI system, connects all modules together,
handles user input, manages streaming AI responses, and controls
the speech synthesis queue.

Responsibilities:
1. Initialize UI modules after DOM is ready
2. Handle text and voice input
3. Send messages to backend API
4. Stream AI responses in real-time
5. Convert AI responses to speech
6. Manage speech playback queue
7. Update UI state during interaction

Architecture Role:
This module acts as the "frontend orchestrator".

ui_app.js
      │
      ▼
State Manager + Voice System + Orb + API Client
      │
      ▼
Backend FastAPI
      │
      ▼
AI Response + TTS
*/


// ----------------------------------------------------
// IMPORT MODULES (ALWAYS AT TOP LEVEL)
// ----------------------------------------------------

// Import global state setter
import { setState } from "./state_manager.js";

// Import orb controller utilities
import { initOrbController, registerOrb } from "./orb_controller.js";

// Import backend API functions
import { sendMessageToAPI, fetchStatus } from "./api_client.js";

// Import AI state constants
import { AI_STATES } from "../config/ui_states.js";

// Import audio visualizer functions for microphone animation
import { initAudioVisualizer, startMicListening, stopMicListening } from "./audio_visualizer.js";

// Import audio bridge utilities (used for TTS audio routing)
import { connectTTS, audioCtx, unlockAudioContext } from "./audio_bridge.js";

// Import voice controller flags/functions
import { globalIsListening, stopVoice } from "./voice_ui_controller.js";

// Import UI mode controller (dark/light or interface modes)
import "./ui_mode_controller.js";

import { startSpeechStream } from "./speech_stream.js";


// ----------------------------------------------------
// DOM SAFE EXECUTION
// ----------------------------------------------------

// Wait until the DOM is fully loaded before initializing UI
window.addEventListener("DOMContentLoaded", initUI);



/* ==================================================
   ULTRA FAST SPEECH ENGINE
================================================== */

// Queue that stores sentences waiting to be spoken
let speechQueue = [];

// Indicates if TTS engine is currently speaking
let isSpeaking = false;


// ===============================
// OS MODE STATE
// ===============================

let osModeActive = false;
let osVoiceLoopActive = false;

// ----------------------------------------------------
// ADD SENTENCE TO SPEECH QUEUE
// ----------------------------------------------------
async function enqueueSpeech(text) {

    // Add sentence to queue
    speechQueue.push(text);

    // If TTS engine is idle, start processing queue
    if (!isSpeaking) {
        processSpeechQueue();
    }
}


// ----------------------------------------------------
// PROCESS SPEECH QUEUE
// ----------------------------------------------------
async function processSpeechQueue() {

    // If queue is empty stop speaking
    if (speechQueue.length === 0) {
        isSpeaking = false;
        return;
    }

    isSpeaking = true;

    await unlockAudioContext();

    // Get next sentence
    const sentence = speechQueue.shift();

    try {

        // Request TTS audio from backend
        const res = await fetch("/api/tts?text=" + encodeURIComponent(sentence));

        // Convert response to audio blob
        const blob = await res.blob();

        // Create local object URL
        const audioURL = URL.createObjectURL(blob);

        // Create audio element
        const audio = new Audio(audioURL);

        // Connect audio to analyser for visual effects
        connectTTS(audio);

        // Update system state
        setState(AI_STATES.SPEAKING);

        // When audio finishes playing
        audio.onended = () => {

            // Free memory
            URL.revokeObjectURL(audioURL);

            setState(AI_STATES.RESPONDING);

            // Process next sentence
            processSpeechQueue();
        };

        // Start audio playback
        audio.play().catch(err => {
            console.warn("Autoplay prevented", err);
        });

    } catch (err) {

        console.error("Speech error:", err);

        // Continue queue processing even if error occurs
        processSpeechQueue();
    }
}

// ===========================================
// START OS VOICE LOOP (Browser Controlled)
// ===========================================

function startOSVoiceLoop() {

    console.log("OS MODE:", osModeActive, "VOICE LOOP:", osVoiceLoopActive);

    if (!osModeActive || osVoiceLoopActive) return;

    osVoiceLoopActive = true;

    setState(AI_STATES.LISTENING);

    startSpeechStream(

        async (finalText) => {

            // Normalize speech
            const normalized = (finalText || "").toLowerCase().trim();

            console.log("VOICE COMMAND:", normalized)

            // Ignore empty / noise transcripts
            if (
                !normalized ||
                normalized.length < 2 ||
                normalized === "." ||
                normalized === ".." ||
                normalized === "..."
            ) {
                osVoiceLoopActive = false;

                if (osModeActive) {
                    setTimeout(() => startOSVoiceLoop(), 300);
                }

                return;
            }

            // STOP COMMAND
            if (normalized.includes("stop os")) {

                await fetch("/api/os/stop");
                osModeActive = false;
                osVoiceLoopActive = false;

                document.body.classList.remove("os-mode-active");
                setState(AI_STATES.IDLE);

                await enqueueSpeech("Exiting operating system mode.");

                return;
            }

            // SEND COMMAND TO BACKEND
            try {

                setState(AI_STATES.THINKING);

                const response = await fetch("/api/os/command", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ command: finalText })
                });

                const data = await response.json();

                setState(AI_STATES.RESPONDING);

                // Defensive guard
                if (!data || typeof data !== "object") {

                    console.warn("Invalid OS response:", data);
                    await enqueueSpeech("System error.");

                } else if (data.status === "success") {

                    if (data.output) {

                        if (typeof data.output === "string") {
                            await enqueueSpeech(data.output);
                        } else {
                            await enqueueSpeech("Command executed.");
                        }

                    } else {

                        await enqueueSpeech("Command executed.");

                    }

                } else {

                    console.warn("OS command failed:", data);
                    await enqueueSpeech("Command failed.");
                }

            } catch (error) {
                console.error("OS Command Error:", error);
                await enqueueSpeech("There was an error executing the command.");
            }

            osVoiceLoopActive = false;

            if (osModeActive) {

                console.log("Restarting OS voice loop...");

                setTimeout(() => {

                    try {
                        startOSVoiceLoop();
                    } catch (err) {
                        console.error("Voice restart failed:", err);
                    }

                }, 1200);
            }

        },

        () => {
            osVoiceLoopActive = false;
            if (osModeActive) {
                startOSVoiceLoop();
            }
        }
    );
}

// ----------------------------------------------------
// INITIALIZE UI
// ----------------------------------------------------
function initUI() {

    // Wait until ThreeJS orb becomes available
    let attempts = 0;

    const waitOrb = setInterval(()=>{

        attempts++;

        // Check if orb renderer exposed mesh globally
        if(window.__THREE_ORB__){

            // Register orb with controller
            registerOrb(window.__THREE_ORB__);

            clearInterval(waitOrb);
        }

        // Safety timeout after 5 seconds
        if(attempts > 100){
            console.warn("Orb registration timeout");
            clearInterval(waitOrb);
        }

    },50);



    // ----------------------------------------------------
    // DOM ELEMENT REFERENCES
    // ----------------------------------------------------

    const sendBtn = document.getElementById("send-button");
    const micBtn = document.getElementById("mic-button");
    const cmdBtn = document.getElementById("command-button");
    const inputField = document.getElementById("text-layer");
    const chatLog = document.getElementById("chat-log");
    const modelStatus = document.getElementById("model-status");



    // ----------------------------------------------------
    // VOICE INPUT EVENT
    // ----------------------------------------------------

    // Receive text from speech recognition system
    window.addEventListener("voiceInput", (e)=>{

        // Fill input field with recognized text
        inputField.textContent = e.detail;

        // Automatically send message
        handleSend();
    });


    // Initialize UI systems
    initOrbController();
    initAudioVisualizer();
    initializeStatus();

    // ----------------------------------------------------
    // CMD BUTTON LOGIC (FIXED + PROPER)
    // ----------------------------------------------------

    if (cmdBtn) {

        cmdBtn.addEventListener("click", async () => {

            try {

                if (!osModeActive) {

                    await fetch("/api/os/start");

                    osModeActive = true;
                    document.body.classList.add("os-mode-active");

                    await enqueueSpeech("Operating system mode activated.");
                    startOSVoiceLoop();

                } else {

                    await fetch("/api/os/stop");

                    osModeActive = false;
                    osVoiceLoopActive = false;

                    document.body.classList.remove("os-mode-active");
                    setState(AI_STATES.IDLE);

                    await enqueueSpeech("Operating system mode deactivated.");
                }

            } catch (error) {
                console.error("OS Mode Toggle Error:", error);
            }
        });
    }
    // Send button click handler
    sendBtn.addEventListener("click", handleSend);


    // Enter key message send
    inputField.addEventListener("keydown", e => {

        if (e.key === "Enter" && !e.shiftKey) {

            e.preventDefault();

            handleSend();
        }
    });



    // ----------------------------------------------------
    // MODEL STATUS INITIALIZATION
    // ----------------------------------------------------
    async function initializeStatus() {

        try {

            // Fetch backend status
            const status = await fetchStatus();

            if (modelStatus) {
                modelStatus.textContent = "Model: " + status.model;
            }

        } catch {

            // Fallback if backend unavailable
            if (modelStatus) {
                modelStatus.textContent = "Model: Offline";
            }
        }
    }



    // ----------------------------------------------------
    // HANDLE MESSAGE SEND
    // ----------------------------------------------------
    async function handleSend() {

        // Extract message text
        const message = inputField.textContent.replace(/\u00A0/g," ").trim();

        if (!message) return;


        // Render user message
        appendMessage("You", message);


        // Clear input field
        inputField.textContent = "";
        inputField.focus();


        // Update system state
        setState(AI_STATES.THINKING);


        // Create AI message container
        const aiDiv = document.createElement("div");
        aiDiv.classList.add("message","ai");
        chatLog.prepend(aiDiv);


        try {

            // Request streaming AI response
            const response = await fetch("/api/stream", {

                method: "POST",

                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({ message: message })
            });


            // Create stream reader
            const reader = response.body.getReader();

            const decoder = new TextDecoder("utf-8");


            let fullText = "";
            let sentenceBuffer = "";


            // AI is now generating response
            setState(AI_STATES.RESPONDING);


            while (true) {

                const { done, value } = await reader.read();

                if (done) break;

                // Decode stream chunk
                const chunk = decoder.decode(value);

                fullText += chunk;
                sentenceBuffer += chunk;

                // Update chat UI
                aiDiv.textContent = fullText;


                // Detect sentence endings
                if (/[.!?]\s$/.test(sentenceBuffer)) {

                    enqueueSpeech(sentenceBuffer.trim());

                    sentenceBuffer = "";
                }

            }


            // Speak remaining text
            if (sentenceBuffer.length > 0) {

                enqueueSpeech(sentenceBuffer.trim());
            }

        } catch (error) {

            console.error(error);

            setState(AI_STATES.ERROR);
        }
    }


    // ----------------------------------------------------
    // CHAT MESSAGE RENDERING
    // ----------------------------------------------------
    function appendMessage(sender, text) {

        const div = document.createElement("div");

        div.classList.add("message");

        if (sender === "You")
            div.classList.add("user");
        else
            div.classList.add("ai");

        div.textContent = text;

        chatLog.prepend(div);
    }



    // ----------------------------------------------------
    // LEGACY SPEECH FUNCTION
    // ----------------------------------------------------
    async function speakResponse(text){

        // Ensure audio context active
        await unlockAudioContext();


        // Update state
        setState(AI_STATES.SPEAKING);


        // Request TTS audio
        const res = await fetch("/api/tts?text=" + encodeURIComponent(text));

        const blob = await res.blob();


        // Create audio URL
        const audioURL = URL.createObjectURL(blob);

        const audio = new Audio(audioURL);


        // Connect audio to analyser
        connectTTS(audio);


        // When speech ends
        audio.onended = ()=>{

            setState(AI_STATES.RESPONDING);
        };


        // Play audio
        audio.play();
    }
}