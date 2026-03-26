/*
File: scripts/audio_visualizer.js

Purpose:
This module manages microphone capture and real-time audio analysis
for the AI voice interface.

Responsibilities:
1. Start and stop microphone listening
2. Capture microphone audio stream
3. Analyze microphone frequency data
4. Broadcast microphone intensity to the visualization system
5. Update the AI UI state during voice interaction

Architecture Role:
This module sits between the microphone hardware and the frontend
visualization system (ThreeJS orb).

Instead of directly modifying DOM elements, it sends microphone
intensity events that the ThreeJS renderer listens to.

Audio Flow Architecture:

Microphone
    │
    ▼
getUserMedia()
    │
    ▼
AnalyserNode (FFT analysis)
    │
    ▼
micLevel Event
    │
    ▼
ThreeJS Orb Animation
*/


// Import global state setter to update UI state
import { setState } from "/scripts/state_manager.js";

// Import predefined AI system states
import { AI_STATES } from "../config/ui_states.js";

// Import audio bridge utilities for connecting mic audio
import { connectMic, unlockAudioContext } from "./audio_bridge.js";


// Audio context used for microphone analysis
let audioContext;

// Analyser node used for frequency data analysis
let analyser;

// Array that stores frequency data
let dataArray;

// requestAnimationFrame id used to stop animation loop
let animationId;

// Reference to active microphone stream
let streamRef = null;


// Flag indicating whether mic listening is active
let isListening = false;

// Placeholder for speech recognition instance (if used later)
let recognition = null;



// ---------------- INIT ----------------
// Initialize audio visualizer
// Currently no DOM elements are used because
// visualization is handled by ThreeJS orb
export function initAudioVisualizer() {

    // Previously DOM orb initialization was done here
    // Now ThreeJS handles the visual system
}



// ---------------- START MIC ----------------
// Starts microphone capture and audio analysis
export async function startMicListening() {

    // Ensure AudioContext is active (browser autoplay restriction fix)
    await unlockAudioContext();

    // Check if browser supports mediaDevices API
    if (!navigator.mediaDevices) return;

    // Update global AI state to LISTENING
    setState(AI_STATES.LISTENING);

    try {

        // Request microphone access from the browser
        streamRef = await navigator.mediaDevices.getUserMedia({
            audio: {

                // Reduce echo from speakers
                echoCancellation: true,

                // Remove background noise
                noiseSuppression: true,

                // Automatically adjust microphone volume
                autoGainControl: true
            }
        });


        // Connect microphone stream to the global audio pipeline
        await connectMic(streamRef);


        // Create a new AudioContext for microphone analysis
        audioContext = new (window.AudioContext || window.webkitAudioContext)();


        // Create analyser node for FFT frequency analysis
        analyser = audioContext.createAnalyser();


        // Create audio source from microphone stream
        const source = audioContext.createMediaStreamSource(streamRef);


        // Connect mic source to analyser
        source.connect(analyser);


        // Set FFT size (frequency resolution)
        analyser.fftSize = 256;


        // Get number of frequency bins
        const bufferLength = analyser.frequencyBinCount;


        // Create array to store frequency data
        dataArray = new Uint8Array(bufferLength);


        // Enable listening flag
        isListening = true;


        // Start microphone visualization loop
        animateMic();


    } catch (err) {

        // Log microphone permission error
        console.error("Mic permission denied:", err);

        // Switch UI state to error
        setState(AI_STATES.ERROR);
    }
}



// ---------------- STOP MIC ----------------
// Stops microphone listening and analysis
export function stopMicListening() {

    // Disable listening flag
    isListening = false;

    // Stop animation loop
    cancelAnimationFrame(animationId);


    // Stop all tracks in the microphone stream
    if (streamRef) {

        streamRef.getTracks().forEach(track => track.stop());
    }

    // Change system state to THINKING
    // (AI will now process the user's message)
    setState(AI_STATES.THINKING);
}



// ---------------- VISUALIZER LOOP ----------------
// Continuously analyzes microphone audio data
// and broadcasts intensity level to the visualization system
function animateMic() {

    // Stop if mic is not active or analyser not ready
    if (!isListening || !analyser) return;


    // Fill dataArray with current frequency data
    analyser.getByteFrequencyData(dataArray);


    // Calculate average microphone intensity
    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {

        sum += dataArray[i];
    }

    // Average intensity value
    const average = sum / dataArray.length;


    // Broadcast microphone intensity to the entire application
    // ThreeJS orb listens for this event and animates accordingly
    window.dispatchEvent(
        new CustomEvent("micLevel", { detail: average })
    );


    // Continue animation loop on next frame
    animationId = requestAnimationFrame(animateMic);
}