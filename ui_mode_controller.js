/*
File: scripts/ui_mode_controller.js

Purpose:
This module controls UI visual modes based on the current AI state.

It listens to global state updates and modifies UI elements
accordingly. In this case, it updates the input bar style when
the AI enters LISTENING mode.

Responsibilities:
1. Subscribe to global AI state changes
2. Modify UI classes based on the current state
3. Provide visual feedback when the system is listening to the user

Architecture Role:
This module is part of the UI reaction layer.

state_manager.js
        │
        ▼
ui_mode_controller.js
        │
        ▼
DOM UI Updates (input bar styles)

This keeps UI behavior separated from core logic.
*/


// Import subscribe function to listen for state changes
import { subscribe } from "./state_manager.js";


// Import predefined AI state constants
import { AI_STATES } from "../config/ui_states.js";


// Get reference to the input bar element
// This element visually indicates voice listening mode
const bar = document.getElementById("input-bar");


// Register state change listener
subscribe(handleState);


// --------------------------------------------------
// HANDLE STATE CHANGE
// --------------------------------------------------
// This function runs whenever the AI state updates
function handleState(state){

    // Remove listening style by default
    bar.classList.remove("input-listening");


    // If the AI is currently listening to the microphone
    if(state === AI_STATES.LISTENING){

        // Add listening class to activate UI animation/style
        bar.classList.add("input-listening");
    }

}

let osModeActive = false;

const cmdBtn = document.getElementById("command-button");

cmdBtn.addEventListener("click", activateOSMode);

async function activateOSMode(){

    if(osModeActive) return;

    osModeActive = true;

    document.body.classList.add("os-mode-active");

    try{

        await fetch("/api/os/start");

    }catch(err){

        console.error("OS mode error",err);

    }

}