/*
File: scripts/api_client.js

Purpose:
This file acts as the communication layer between the frontend UI
and the FastAPI backend server.

Responsibilities:
1. Send user messages to the backend AI API
2. Receive AI-generated responses
3. Fetch system status information from the backend
4. Handle API errors in a centralized place

Architecture Role:
This module is the frontend API service layer.

UI components such as:
- voice_ui_controller.js
- text input handlers
- state_manager.js

use these functions instead of calling fetch() directly.
This keeps network logic separated from UI logic.
*/


/* ===============================
API CLIENT – FINAL CLEAN VERSION
=============================== */


// ----------------------------------------------------
// SEND MESSAGE TO AI API
// ----------------------------------------------------
// This function sends a user message to the backend
// and returns the AI-generated response
export async function sendMessageToAPI(message) {

    // Send POST request to backend message endpoint
    const response = await fetch("/api/message", {

        // HTTP method used for sending data
        method: "POST",

        // Define request headers
        headers: {
            "Content-Type": "application/json" // Tell server we are sending JSON
        },

        // Convert the message object into JSON string
        body: JSON.stringify({ message: message })
    });


    // Check if the API request failed
    if (!response.ok) {

        // Read error message returned from the server
        const err = await response.text();

        // Log detailed error for debugging
        console.error("API MESSAGE ERROR:", err);

        // Throw error so calling modules can handle it
        throw new Error("Message API failed");
    }


    // Convert successful response into JSON object
    return await response.json();

}



// ----------------------------------------------------
// FETCH BACKEND STATUS
// ----------------------------------------------------
// This function retrieves system configuration and
// AI model information from the backend
export async function fetchStatus() {

    // Send GET request to backend status endpoint
    const response = await fetch("/api/status");


    // Check if the request failed
    if (!response.ok) {

        // Read backend error message
        const err = await response.text();

        // Print error in browser console
        console.error("STATUS API ERROR:", err);

        // Throw error to notify calling modules
        throw new Error("Status API failed");
    }


    // Return parsed JSON response from the backend
    return await response.json();

}