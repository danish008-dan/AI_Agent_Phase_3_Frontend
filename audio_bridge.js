/*
File: scripts/audio_bridge.js

Purpose:
This file acts as the central audio routing layer for the frontend AI system.

It connects multiple audio sources (microphone input and AI text-to-speech output)
into a single Web Audio processing pipeline.

Responsibilities:
1. Initialize the Web Audio API context
2. Route microphone audio into the audio analysis pipeline
3. Route TTS audio into the same pipeline
4. Provide audio data for visualizers (orb particles, waveform, etc.)
5. Manage AudioContext state (resume when browser suspends it)

Architecture Role:
This module acts as the "audio bridge" between input/output audio sources
and the visualization/analysis system.

Audio Flow Architecture:

Microphone Input ─┐
                  │
TTS Audio Output ─┼──► masterGain ─► analyser ─► speakers
                  │
                  └──► visualization data (orb animation / audio bars)
*/


// ------------------------------------------------------
// UNLOCK AUDIO CONTEXT
// ------------------------------------------------------
// Browsers often start the AudioContext in a suspended state
// due to autoplay policies. This function resumes it when
// the user interacts with the page.
export async function unlockAudioContext(){

    // Check if the audio context is currently suspended
    if(audioCtx.state === "suspended"){

        // Resume audio processing
        await audioCtx.resume();

        // Log confirmation in console
        console.log("AudioContext resumed");
    }
}


// ------------------------------------------------------
// CREATE AUDIO CONTEXT
// ------------------------------------------------------
// Initialize the Web Audio API context.
// window.webkitAudioContext is included for Safari compatibility.
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();


// ------------------------------------------------------
// CREATE ANALYSER NODE
// ------------------------------------------------------
// The analyser node allows real-time audio frequency analysis.
// This is commonly used for visualizations (particles, waveform, etc.).
export const analyser = audioCtx.createAnalyser();


// Set FFT size (Fast Fourier Transform resolution)
// Higher value = more detailed frequency analysis
analyser.fftSize = 512;


// Create an array that will store frequency data from the analyser
export const dataArray = new Uint8Array(analyser.frequencyBinCount);


// ------------------------------------------------------
// MASTER GAIN NODE
// ------------------------------------------------------
// This gain node acts as the central audio mixing point.
// All audio sources (mic + TTS) will connect here.
export const masterGain = audioCtx.createGain();


// Connect master gain to the analyser
// This allows audio visualization systems to access the audio data.
masterGain.connect(analyser);


// Connect analyser to the final audio output (speakers)
analyser.connect(audioCtx.destination);


// ------------------------------------------------------
// MIC CONNECT
// ------------------------------------------------------
// Connect microphone input stream to the audio pipeline.
export async function connectMic(stream){

    // Create an audio source from the microphone media stream
    const source = audioCtx.createMediaStreamSource(stream);

    // Route microphone audio into the master gain node
    source.connect(masterGain);
}


// ------------------------------------------------------
// TTS CONNECT
// ------------------------------------------------------
// Connect AI-generated audio (TTS) to the audio processing pipeline.
export function connectTTS(audioElement){

    // Create audio source from an HTML audio element
    const source = audioCtx.createMediaElementSource(audioElement);

    // Connect the TTS audio source to the master gain node
    source.connect(masterGain);

    // Ensure the audio eventually reaches the speakers
    masterGain.connect(audioCtx.destination);
}