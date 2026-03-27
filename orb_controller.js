/*
File: scripts/orb_controller.js

Purpose:
This module controls how the AI orb reacts to different system states.

It listens to state changes from the global state manager and updates
the orb's visual behavior accordingly (scale changes, animation speed, etc.).

Responsibilities:
1. Receive state updates from the state_manager
2. Update the AI state label in the UI
3. Modify the orb's scale and animation based on current AI state
4. Act as the bridge between the UI state system and the ThreeJS orb

Architecture Role:
This module connects the application state system with the 3D orb renderer.

state_manager.js
        │
        ▼
orb_controller.js
        │
        ▼
ThreeJS Orb Mesh
        │
        ▼
Visual Feedback for AI states
*/


// Import subscribe function from state manager
// This allows this module to listen for global AI state changes
import { subscribe } from "./state_manager.js";


// Reference to the ThreeJS orb mesh
// This will be provided by the ThreeJS rendering script
let orbMesh = null;


// Reference to the UI element that displays the current AI state
let aiStateLabel = null;


// -------------------------------------------------
// REGISTER ORB
// -------------------------------------------------
// This function is called by the ThreeJS orb script
// to provide the mesh object used for visual updates
export function registerOrb(mesh) {

    // Store reference to the orb mesh
    orbMesh = mesh;
}


// -------------------------------------------------
// INITIALIZE ORB CONTROLLER
// -------------------------------------------------
// This function prepares the controller and connects
// it to the global state manager
export function initOrbController() {

    // Get reference to the UI label that displays current AI state
    aiStateLabel = document.getElementById("ai-state");

    // Subscribe to state changes so handleStateChange()
    // runs whenever the AI state updates
    subscribe(handleStateChange);
}


// -------------------------------------------------
// HANDLE STATE CHANGES
// -------------------------------------------------
// This function runs every time the global AI state changes
function handleStateChange(state) {

    // Update UI label with current state
    if (aiStateLabel)
        aiStateLabel.textContent = "State: " + state;


    // If orb mesh is not registered yet, stop execution
    if (!orbMesh) return;


    // Change orb behavior based on AI state
    switch (state) {

        // ---------------- IDLE ----------------
        // Orb slowly animates but remains calm
        case "IDLE":

            // Increase shader time value to create slow motion effect
            orbMesh.material.uniforms.time.value += 0.01;
            break;


        // ---------------- LISTENING ----------------
        // Slight expansion when AI listens to user voice
        case "LISTENING":

            // Increase orb scale slightly
            orbMesh.scale.set(1.15,1.15,1.15);
            break;


        // ---------------- THINKING / RESPONDING ----------------
        // Larger expansion to indicate AI processing
        case "THINKING":
        case "RESPONDING":

            // Increase orb scale more noticeably
            orbMesh.scale.set(1.25,1.25,1.25);
            break;


        // ---------------- SPEAKING ----------------
        // Maximum expansion while AI speaks
        case "SPEAKING":

            // Largest orb scale
            orbMesh.scale.set(1.35,1.35,1.35);
            break;


        // ---------------- ERROR ----------------
        // Shrink orb slightly to visually indicate error
        case "ERROR":

            // Reduce orb size
            orbMesh.scale.set(0.9,0.9,0.9);
            break;
    }
}