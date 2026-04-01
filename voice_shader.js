/*
File: scripts/voice_shader.js

Purpose:
This module connects microphone audio data with a WebGL shader.
It reads real-time audio frequency data from the Web Audio analyser
and feeds the amplitude values into shader uniforms.

This allows shader animations (such as pulse effects, waves, or
energy distortions) to react dynamically to the user's voice.

Responsibilities:
1. Listen to AI system state changes
2. Activate shader animation when the AI enters LISTENING mode
3. Read audio amplitude from analyser node
4. Send amplitude and time values to shader uniforms
5. Continuously update the shader rendering loop

Architecture Role:
This module acts as the bridge between the audio system and
the GPU shader system.

Audio System (audio_bridge.js)
        │
        ▼
AnalyserNode (frequency data)
        │
        ▼
voice_shader.js
        │
        ▼
WebGL Shader Uniforms
        │
        ▼
Voice-reactive GPU animation
*/


// Import analyser node and audio frequency data array
// These provide real-time audio data from microphone or TTS
import { analyser, dataArray } from "./audio_bridge.js";


// Import subscribe function to listen for state changes
import { subscribe } from "./state_manager.js";


// Import AI state constants
import { AI_STATES } from "../config/ui_states.js";


// Flag indicating whether the shader should react to audio
let active = false;


// Subscribe to global AI state updates
subscribe(state=>{

    // Activate shader only when AI is listening to the microphone
    active = state === AI_STATES.LISTENING;

});


// ----------------------------------------------------
// SHADER RENDER LOOP
// ----------------------------------------------------
// Continuously updates shader uniforms and renders frames
function loop(){

    // Run shader updates only when listening mode is active
    if(active){

        // Fill dataArray with current frequency values
        analyser.getByteFrequencyData(dataArray);


        // Calculate total amplitude from frequency bins
        let sum=0;

        for(let i=0;i<dataArray.length;i++)
            sum+=dataArray[i];


        // Normalize amplitude value between 0 and 1
        let amp=(sum/dataArray.length)/255;


        // Send amplitude value to shader uniform
        gl.uniform1f(ampLocation, amp);


        // Send time value to shader uniform
        gl.uniform1f(timeLocation, performance.now()*0.001);


        // Render shader geometry (two triangles forming a quad)
        gl.drawArrays(gl.TRIANGLES,0,6);
    }


    // Continue animation loop
    requestAnimationFrame(loop);
}


// Start render loop
loop();