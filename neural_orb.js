/*
File: scripts/neural_orb.js

Purpose:
This module renders the AI "Neural Orb" visualization using Three.js.
The orb is composed of thousands of particles arranged in a sphere.

The particle system reacts to real-time audio data coming from the
Web Audio analyser node. When microphone input or TTS audio plays,
the orb "breathes" and produces turbulence based on audio amplitude.

Responsibilities:
1. Create the Three.js scene and renderer
2. Generate a particle sphere (AI orb)
3. Read audio frequency data from the analyser
4. Apply audio-driven physics to particle positions
5. Continuously render the animation loop

Architecture Role:
This module is the visual engine of the AI interface.

Audio System (audio_bridge.js)
        │
        ▼
AnalyserNode (frequency data)
        │
        ▼
neural_orb.js
        │
        ▼
Particle Physics + Rendering
        │
        ▼
AI Orb Visualization
*/


// Import audio analyser and frequency data array from the audio system
// These provide real-time audio amplitude information
import { analyser, dataArray } from "./audio_bridge.js";


// Get the DOM container where the orb will be rendered
const container = document.getElementById("ai-orb-widget");


// Create a Three.js scene (main 3D environment)
const scene = new THREE.Scene();


// Create perspective camera
// Parameters: fieldOfView, aspectRatio, nearClipping, farClipping
const camera = new THREE.PerspectiveCamera(60,1,0.1,100);


// Move the camera slightly away so the orb is visible
camera.position.z = 6;


// Create WebGL renderer with transparency and antialiasing
const renderer = new THREE.WebGLRenderer({
    alpha:true,
    antialias:true
});


// Set renderer size to match container dimensions
renderer.setSize(container.clientWidth,container.clientHeight);


// Adjust rendering resolution to match device pixel ratio
renderer.setPixelRatio(window.devicePixelRatio);


// Attach the WebGL canvas to the DOM container
container.appendChild(renderer.domElement);



// ======================================================
// PARTICLE SPHERE GENERATION
// ======================================================


// Total number of particles in the orb
const PARTICLE_COUNT = 1800;


// Radius of the particle sphere
const RADIUS = 2.2;


// Create geometry container for particle positions
const geometry = new THREE.BufferGeometry();


// Create array storing particle positions (x,y,z)
const positions = new Float32Array(PARTICLE_COUNT*3);


// Store original base positions of particles
// Used to reset and calculate motion
const basePositions = [];


// Generate particle positions distributed across a sphere
for(let i=0;i<PARTICLE_COUNT;i++){

    // Random values used for spherical distribution
    const u = Math.random();
    const v = Math.random();


    // Convert random values into spherical coordinates
    const theta = 2*Math.PI*u;
    const phi = Math.acos(2*v-1);


    // Convert spherical coordinates to cartesian coordinates
    const x = RADIUS*Math.sin(phi)*Math.cos(theta);
    const y = RADIUS*Math.sin(phi)*Math.sin(theta);
    const z = RADIUS*Math.cos(phi);


    // Store particle coordinates in position array
    positions[i*3]=x;
    positions[i*3+1]=y;
    positions[i*3+2]=z;


    // Save base position as a Vector3 for future physics calculations
    basePositions.push(new THREE.Vector3(x,y,z));
}


// Attach positions array to geometry
geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));


// Create particle material
// This defines how each particle appears visually
const material = new THREE.PointsMaterial({

    // Size of each particle point
    size:0.035,

    // Particle color
    color:0x99f0ff,

    // Enable transparency
    transparent:true,

    // Particle opacity
    opacity:0.9
});


// Create particle system from geometry and material
const particles = new THREE.Points(geometry,material);


// Add particle system to scene
scene.add(particles);



// ======================================================
// AUDIO REACTIVE PARTICLE PHYSICS
// ======================================================


// Function that updates particle positions based on audio data
function updateParticles(){

    // Fill dataArray with current frequency values from analyser
    analyser.getByteFrequencyData(dataArray);


    // Calculate average amplitude of audio frequencies
    let amp=0;

    for(let i=0;i<dataArray.length;i++)
        amp+=dataArray[i];


    amp/=dataArray.length;

    // Normalize amplitude between 0 and 1
    amp/=255;


    // Access particle positions array
    const positions=geometry.attributes.position.array;


    // Update each particle
    for(let i=0;i<PARTICLE_COUNT;i++){

        // Get base position of particle
        const base=basePositions[i];


        // Breathing effect (expands sphere based on audio)
        const breathe=1+amp*0.6;


        // Turbulence effect (random motion driven by time)
        const noise=Math.sin(Date.now()*0.002+i)*amp*0.4;


        // Apply breathing + turbulence physics
        positions[i*3]=base.x*breathe+noise;
        positions[i*3+1]=base.y*breathe+noise;
        positions[i*3+2]=base.z*breathe+noise;
    }


    // Tell Three.js that particle positions changed
    geometry.attributes.position.needsUpdate=true;
}



// ======================================================
// MAIN ANIMATION LOOP
// ======================================================


// Continuous render loop
function animate(){

    // Request next animation frame
    requestAnimationFrame(animate);


    // Update particle physics using audio data
    updateParticles();


    // Slowly rotate the orb for visual effect
    particles.rotation.y+=0.002;


    // Render the scene from the camera perspective
    renderer.render(scene,camera);
}


// Start animation loop
animate();