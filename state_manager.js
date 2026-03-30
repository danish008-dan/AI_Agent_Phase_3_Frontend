/*
File: scripts/state_manager.js

Purpose:
This module manages the global UI state of the AI assistant.

It provides a simple centralized state management system that allows
different modules of the frontend to stay synchronized with the current
AI state.

Responsibilities:
1. Store the current AI system state
2. Allow other modules to read the current state
3. Allow modules to update the state
4. Notify subscribed listeners when the state changes

Architecture Role:
This file acts as the central state hub for the frontend system.

state_manager.js
       │
       ▼
Subscribers (listeners)
       │
       ├── voice_ui_controller.js
       ├── orb_controller.js
       ├── audio_visualizer.js
       └── UI components

Whenever the AI state changes (LISTENING, THINKING, SPEAKING, etc.),
all subscribed modules receive the update and react accordingly.
*/


// Import predefined AI states configuration
// This prevents hard-coded state strings from being scattered in the codebase
import { AI_STATES } from "../config/ui_states.js";


// Store the current AI state
// Initial state is IDLE when the system first loads
let currentState = AI_STATES.IDLE;


// Array that holds all subscribed listener functions
// These listeners are called whenever the state changes
let listeners = [];


// --------------------------------------------------
// GET CURRENT STATE
// --------------------------------------------------
// Returns the current AI system state
export function getState() {

    return currentState;
}


// --------------------------------------------------
// SET NEW STATE
// --------------------------------------------------
// Updates the current state and notifies all subscribers
export function setState(newState) {

    // Update global state variable
    currentState = newState;

    // Notify all listeners that state has changed
    notify();
}


// --------------------------------------------------
// SUBSCRIBE TO STATE CHANGES
// --------------------------------------------------
// Allows other modules to listen for state updates
export function subscribe(callback) {

    // Add the provided callback function to the listeners list
    listeners.push(callback);
}


// --------------------------------------------------
// NOTIFY LISTENERS
// --------------------------------------------------
// Calls every registered listener and sends the new state
function notify() {

    // Loop through all registered listeners
    listeners.forEach(cb => cb(currentState));
}