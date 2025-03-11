import { resizeCanvasToDisplaySize } from "../canvas.js";
import { createShader, createProgram } from "../webglutils.js";

const vertexShaderSource = `
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

varying vec4 v_color;

void main() {
    // Scale the position
    vec2 scaledPosition = a_position * u_scale;

    // Rotate the position
    vec2 rotatedPosition = vec2(
        scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
        scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);
    vec2 position = rotatedPosition + u_translation;

    vec2 zeroToOne = position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_color = gl_Position * 0.5 + 0.5;
}`;

const fragmentShaderSource = `
precision mediump float;

varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}`;

function initDebugUI(gui, state, onChangeCallback) {
    gui.remember(state);

    gui.add(state, "angleInDegrees")
        .min(0)
        .max(360)
        .step(1)
        .onChange(() => {
            const angleInDegrees = 360 - state.angleInDegrees;
            state.angleInRadians = (angleInDegrees * Math.PI) / 180;
            onChangeCallback();
        });

    const f1 = gui.addFolder("Position");
    f1.add(state, "posX")
        .min(0)
        .max(state.canvasWidth)
        .step(0.25)
        .onChange(() => onChangeCallback());
    f1.add(state, "posY")
        .min(0)
        .max(state.canvasHeight)
        .step(0.25)
        .onChange(() => onChangeCallback());

    const f2 = gui.addFolder("Scale");
    f2.add(state, "scaleX")
        .min(-5)
        .max(5)
        .step(0.1)
        .onChange(() => onChangeCallback());
    f2.add(state, "scaleY")
        .min(-5)
        .max(5)
        .step(0.1)
        .onChange(() => onChangeCallback());
}

/**
 * Paints a letter F and allows to modify its transform
 * @param {HTMLCanvasElement} canvas
 */
export function transform2D(canvas, gui) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        posX: 200,
        posY: 150,
        angleInRadians: 0,
        angleInDegrees: 0,
        scaleX: 1,
        scaleY: 1
    };

    initDebugUI(gui, state, drawScene);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // setup GLSL program
    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // lookup uniforms
    // const matrixLocation = gl.getUniformLocation(program, "u_matrix");

    // lookup uniforms
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const translationLocation = gl.getUniformLocation(program, "u_translation");
    const rotationLocation = gl.getUniformLocation(program, "u_rotation");
    const scaleLocation = gl.getUniformLocation(program, "u_scale");

    // Create a buffer.
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Set Geometry.
    setGeometry(gl);

    drawScene();

    /**
     * Draws the scene.
     */
    function drawScene() {
        resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Disable the depth buffer
        gl.disable(gl.DEPTH_TEST);

        // Turn off culling. By default backfacing triangles
        // will be culled.
        gl.disable(gl.CULL_FACE);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the attribute
        gl.enableVertexAttribArray(positionAttributeLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2; // 2 components per iteration
        const type = gl.FLOAT; // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

        // Compute the matrix
        // let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        // matrix = m3.translate(matrix, state.posX, state.posY);
        // matrix = m3.rotate(matrix, state.angleInRadians);
        // matrix = m3.scale(matrix, state.scaleX, state.scaleY);

        // set the resolution
        gl.uniform2f(resolutionLocation, gl.canvas.clientWidth, gl.canvas.clientHeight);

        // set the translation
        gl.uniform2fv(translationLocation, [state.posX, state.posY]);
        // set the rotation
        gl.uniform2fv(rotationLocation, [Math.sin(state.angleInRadians), Math.cos(state.angleInRadians)]);
        // set the scale
        gl.uniform2fv(scaleLocation, [state.scaleX, state.scaleY]);

        // Draw the geometry.
        const primitiveType = gl.TRIANGLES;
        offset = 0;
        const count = 18;
        gl.drawArrays(primitiveType, offset, count);
    }
}

/**
 * Fills the buffer with the values that define a triangle.
 * Note, will put the values in whatever buffer is currently
 * bound to the ARRAY_BUFFER bind point
 * @param {WebGLRenderingContext} gl
 */
function setGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // left column
            0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

            // top rung
            30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

            // middle rung
            30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90
        ]),
        gl.STATIC_DRAW
    );
}
