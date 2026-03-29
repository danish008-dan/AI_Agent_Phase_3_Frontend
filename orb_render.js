/*
File: scripts/orb_render.js

Purpose:
This module renders the main AI Orb visualization using Three.js.
The orb consists of two visual layers:

1. Outer Orb  → glowing shader sphere with surface distortion
2. Core Energy → inner animated glowing sphere

Both layers animate continuously using shader uniforms and time-based
transformations to create a living AI-like visual effect.

Responsibilities:
1. Initialize Three.js scene, camera, and renderer
2. Create outer orb shader mesh
3. Create inner core shader mesh
4. Animate shader time uniforms
5. Render continuous animation loop

Architecture Role:
This file is responsible only for **rendering the visual orb**.

orb_render.js
      │
      ▼
ThreeJS Scene + Shaders
      │
      ▼
AI Orb Visualization

Other modules like:
- orb_controller.js → control orb based on AI state
- audio_visualizer.js → send mic intensity
- neural_orb.js → particle audio effects
can interact with this visual system.
*/


// Get the DOM container where the orb will be rendered
const container = document.getElementById("ai-orb-widget");

// Safety check to ensure the container exists
if (!container) {
    console.warn("Orb container missing");
}


// --------------------------------------------------
// THREE.JS SCENE SETUP
// --------------------------------------------------

// Create a Three.js scene (main 3D environment)
const scene = new THREE.Scene();


// Create perspective camera
// Parameters: fieldOfView, aspectRatio, nearPlane, farPlane
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);


// Move camera backward so the orb is visible
camera.position.z = 4.2;


// Create WebGL renderer with antialiasing and transparency
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });


// Set renderer size to match container dimensions
renderer.setSize(container.clientWidth, container.clientHeight);


// Improve rendering quality on high DPI screens
renderer.setPixelRatio(window.devicePixelRatio);


// Update camera aspect ratio based on container size
camera.aspect = container.clientWidth / container.clientHeight;


// Apply updated projection matrix
camera.updateProjectionMatrix();


// Set background clear color with 0 alpha (fully transparent)
renderer.setClearColor(0x000000, 0);


// Attach renderer canvas to DOM container
container.appendChild(renderer.domElement);



// ==================================================
// OUTER ORB (MAIN GLOWING SHELL)
// ==================================================

// Create sphere geometry for outer orb
const orbGeometry = new THREE.SphereGeometry(1.2, 64, 64);


// Create shader material for advanced visual effects
const orbMaterial = new THREE.ShaderMaterial({

    // Uniform variables passed to shader programs
    uniforms: {
        time: { value: 0 } // animation time
    },


    // ---------------- VERTEX SHADER ----------------
    // Controls geometry deformation
    vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {

            // Pass normal and UV data to fragment shader
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;

            // Copy original vertex position
            vec3 pos = position;

            // Apply subtle surface distortion using sine waves
            pos += normal * sin(time * 3.0 + position.x * 2.0 + position.y * 1.5) * 0.03;

            // Calculate final vertex position
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,


    // ---------------- FRAGMENT SHADER ----------------
    // Controls color and glow effects
    fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec2 vUv;

        // Color palette function for dynamic color gradients
        vec3 palette(float t){
            vec3 a=vec3(0.5);
            vec3 b=vec3(0.5);
            vec3 c=vec3(1.0);
            vec3 d=vec3(0.263,0.416,0.557);
            return a + b*cos(6.28318*(c*t+d));
        }

        void main(){

            // Fresnel effect for glowing edges
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0,0.0,1.0)),2.0);

            // Pulsing animation based on UV coordinates
            float pulse = sin(time*2.5+vUv.x*3.0)*0.5+0.5;

            // Generate base color
            vec3 color = palette(pulse*0.3+0.1);

            // Glow effect amplified by fresnel
            vec3 glow = color*(0.8+fresnel*1.5*pulse);

            // Edge highlight
            float edge = smoothstep(0.2,0.8,fresnel);

            // Final fragment color
            gl_FragColor = vec4(glow*(1.0+edge*2.0),1.0);
        }
    `,

    // Enable transparency
    transparent:true,

    // Render both inside and outside faces
    side:THREE.DoubleSide
});


// Create mesh from geometry and shader material
const orb = new THREE.Mesh(orbGeometry, orbMaterial);


// Add orb mesh to scene
scene.add(orb);

window.__THREE_ORB__ = orb;

// ==================================================
// INNER ENERGY CORE
// ==================================================

// Create smaller sphere for the core
const coreGeometry = new THREE.SphereGeometry(0.4, 32, 32);


// Shader material for core glow effect
const coreMaterial = new THREE.ShaderMaterial({

    uniforms:{
        time:{value:0} // animation time
    },


    // -------- Vertex Shader --------
    vertexShader:`
        uniform float time;
        varying vec3 vPosition;

        void main(){

            // Pass position to fragment shader
            vPosition=position;

            // Apply dynamic deformation to core
            vec3 pos=position+normal*sin(time*5.0+position.x*3.0)*0.08;

            gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
        }
    `,


    // -------- Fragment Shader --------
    fragmentShader:`
        uniform float time;
        varying vec3 vPosition;

        void main(){

            // Distance from center
            float dist=length(vPosition);

            // Pulsing animation
            float pulse=sin(time*4.0)*0.5+0.5;

            // Glow intensity calculation
            float glow=1.0/(dist*2.0+0.1);

            // Color blending between two colors
            vec3 color=mix(vec3(1.0,0.3,0.8),vec3(0.2,1.0,1.0),pulse);

            // Final fragment output
            gl_FragColor=vec4(color*glow*(1.0+pulse*0.5),glow*0.8);
        }
    `,

    // Enable transparency
    transparent:true,

    // Additive blending for glowing effect
    blending:THREE.AdditiveBlending
});


// Create core mesh
const core = new THREE.Mesh(coreGeometry, coreMaterial);


// Add core to scene
scene.add(core);



// ==================================================
// ANIMATION LOOP
// ==================================================

// Create clock for time tracking
const clock = new THREE.Clock();


// Animation function called every frame
function animate(){

    // Request next frame
    requestAnimationFrame(animate);

    // Get elapsed time
    const time = clock.getElapsedTime();


    // Update shader uniform time values
    orbMaterial.uniforms.time.value=time;
    coreMaterial.uniforms.time.value=time;


    // Rotate outer orb slowly
    orb.rotation.y+=0.008;
    orb.rotation.x+=0.003;


    // Rotate inner core faster
    core.rotation.y+=0.015;


    // Pulse core scale slightly
    core.scale.setScalar(1.0+Math.sin(time*2.3)*0.12);


    // Render scene from camera
    renderer.render(scene,camera);
}


// Start animation loop
animate();