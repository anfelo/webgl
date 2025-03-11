import { m4 } from "../matrix.js";
import { resizeCanvasToDisplaySize } from "../canvas.js";
import { createShader, createProgram } from "../webglutils.js";

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 u_matrix;

varying vec4 v_color;

void main() {
    gl_Position = u_matrix * a_position;

    v_color = a_color;
}`;

const fragmentShaderSource = `
precision mediump float;

varying vec4 v_color;

void main() {
   gl_FragColor = v_color;
}`;

function initDebugUI(gui, state, onChangeCallback) {
    gui.remember(state);

    const f0 = gui.addFolder("Camera");
    f0.add(state, "fieldOfViewDeg")
        .min(1)
        .max(176)
        .step(1)
        .onChange(() => {
            state.fieldOfViewRadians = degToRad(state.fieldOfViewDeg);
            onChangeCallback();
        });
    f0.add(state, "cameraAngleDeg")
        .min(0)
        .max(360)
        .step(1)
        .onChange(() => {
            state.cameraAngleRadians = degToRad(state.cameraAngleDeg);
            onChangeCallback();
        });
}

function radToDeg(r) {
    return (r * 180) / Math.PI;
}

function degToRad(d) {
    return (d * Math.PI) / 180;
}

/**
 * Paints many Fs and adds a camera to the scene
 * @param {HTMLCanvasElement} canvas
 */
export function camera3D(canvas, gui) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        cameraAngleRadians: degToRad(0),
        cameraAngleDeg: 0,
        fieldOfViewRadians: degToRad(60),
        fieldOfViewDeg: 60,
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight
    };

    initDebugUI(gui, state, drawScene);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // setup GLSL program
    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const colorAttributeLocation = gl.getAttribLocation(program, "a_color");

    // lookup uniforms
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    setColors(gl);

    drawScene();

    /**
     * Draws the scene.
     */
    function drawScene() {
        resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Enable the depth buffer
        gl.enable(gl.DEPTH_TEST);

        // Turn on culling. By default backfacing triangles
        // will be culled.
        gl.enable(gl.CULL_FACE);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        const numFs = 5;
        const radius = 200;

        const aspect = state.canvasWidth / state.canvasHeight;
        const zNear = 1;
        const zFar = 2000;
        let projectionMatrix = m4.perspective(state.fieldOfViewRadians, aspect, zNear, zFar);

        // Compute the position of the first F
        const fPosition = [radius, 0, 0];

        // Use matrix math to compute a position on a circle where
        // the camera is
        let cameraMatrix = m4.yRotation(state.cameraAngleRadians);
        cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 2);

        // Get the camera's position from the matrix we computed
        const cameraPosition = [
            cameraMatrix[12],
            cameraMatrix[13],
            cameraMatrix[14],
        ];

        const up = [0, 1, 0];

        // Compute the camera's matrix using look at.
        cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

        // Make a view matrix from the camera matrix
        const viewMatrix = m4.inverse(cameraMatrix);

        // Compute a view projection matrix
        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        for (let i = 0; i < numFs; ++i) {
            const angle = (i * Math.PI * 2) / numFs;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // starting with the view projection matrix
            // compute a matrix for the F
            let matrix = m4.translate(viewProjectionMatrix, x, 0, y);

            // Set the matrix.
            gl.uniformMatrix4fv(matrixLocation, false, matrix);

            // Draw the geometry.
            const primitiveType = gl.TRIANGLES;
            const offset = 0;
            const count = 16 * 6;
            gl.drawArrays(primitiveType, offset, count);
        }
    }
}

/**
 * Fills the buffer with the values that define a rectangle
 * Note, will put the values in whatever buffer is currently
 * bound to the ARRAY_BUFFER bind point
 * @param {WebGLRenderingContext} gl
 */
function setGeometry(gl) {
    const positions = new Float32Array([
        // left column front
        0, 0, 0, 0, 150, 0, 30, 0, 0, 0, 150, 0, 30, 150, 0, 30, 0, 0,

        // top rung front
        30, 0, 0, 30, 30, 0, 100, 0, 0, 30, 30, 0, 100, 30, 0, 100, 0, 0,

        // middle rung front
        30, 60, 0, 30, 90, 0, 67, 60, 0, 30, 90, 0, 67, 90, 0, 67, 60, 0,

        // left column back
        0, 0, 30, 30, 0, 30, 0, 150, 30, 0, 150, 30, 30, 0, 30, 30, 150, 30,

        // top rung back
        30, 0, 30, 100, 0, 30, 30, 30, 30, 30, 30, 30, 100, 0, 30, 100, 30, 30,

        // middle rung back
        30, 60, 30, 67, 60, 30, 30, 90, 30, 30, 90, 30, 67, 60, 30, 67, 90, 30,

        // top
        0, 0, 0, 100, 0, 0, 100, 0, 30, 0, 0, 0, 100, 0, 30, 0, 0, 30,

        // top rung right
        100, 0, 0, 100, 30, 0, 100, 30, 30, 100, 0, 0, 100, 30, 30, 100, 0, 30,

        // under top rung
        30, 30, 0, 30, 30, 30, 100, 30, 30, 30, 30, 0, 100, 30, 30, 100, 30, 0,

        // between top rung and middle
        30, 30, 0, 30, 60, 30, 30, 30, 30, 30, 30, 0, 30, 60, 0, 30, 60, 30,

        // top of middle rung
        30, 60, 0, 67, 60, 30, 30, 60, 30, 30, 60, 0, 67, 60, 0, 67, 60, 30,

        // right of middle rung
        67, 60, 0, 67, 90, 30, 67, 60, 30, 67, 60, 0, 67, 90, 0, 67, 90, 30,

        // bottom of middle rung.
        30, 90, 0, 30, 90, 30, 67, 90, 30, 30, 90, 0, 67, 90, 30, 67, 90, 0,

        // right of bottom
        30, 90, 0, 30, 150, 30, 30, 90, 30, 30, 90, 0, 30, 150, 0, 30, 150, 30,

        // bottom
        0, 150, 0, 0, 150, 30, 30, 150, 30, 0, 150, 0, 30, 150, 30, 30, 150, 0,

        // left side
        0, 0, 0, 0, 0, 30, 0, 150, 30, 0, 0, 0, 0, 150, 30, 0, 150, 0
    ]);

    // Center the F around the origin and Flip it around. We do this because
    // we're in 3D now with and +Y is up where as before when we started with 2D
    // we had +Y as down.

    // We could do by changing all the values above but I'm lazy.
    // We could also do it with a matrix at draw time but you should
    // never do stuff at draw time if you can do it at init time.
    let matrix = m4.xRotation(Math.PI);
    matrix = m4.translate(matrix, -50, -75, -15);

    for (let ii = 0; ii < positions.length; ii += 3) {
        const vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
    }

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with colors for the 'F'.
function setColors(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
            // left column front
            200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,

            // top rung front
            200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,

            // middle rung front
            200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,

            // left column back
            80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,

            // top rung back
            80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,

            // middle rung back
            80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,

            // top
            70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210,

            // top rung right
            200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70,

            // under top rung
            210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70,

            // between top rung and middle
            210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70,

            // top of middle rung
            70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210,

            // right of middle rung
            100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210,

            // bottom of middle rung.
            76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100,

            // right of bottom
            140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80,

            // bottom
            90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110,

            // left side
            160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220
        ]),
        gl.STATIC_DRAW
    );
}
