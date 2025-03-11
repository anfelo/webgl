import { resizeCanvasToDisplaySize } from "../canvas.js";
import { m3 } from "../matrix.js";
import { createShader, createProgram } from "../webglutils.js";

const vertexShaderSource = `
attribute vec2 a_position;

uniform mat3 u_matrix;

varying vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

  // Convert from clipspace to colorspace.
  // Clipspace goes -1.0 to +1.0
  // Colorspace goes from 0.0 to 1.0
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
 * Paints a colored triangle into the canvas
 * @param {HTMLCanvasElement} canvas
 */
export function helloColoredTriangle(canvas, gui) {
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
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");

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
        let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        matrix = m3.translate(matrix, state.posX, state.posY);
        matrix = m3.rotate(matrix, state.angleInRadians);
        matrix = m3.scale(matrix, state.scaleX, state.scaleY);

        // Set the matrix.
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // Draw the geometry.
        const primitiveType = gl.TRIANGLES;
        offset = 0;
        const count = 3;
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -100, 150, 125, -175, 100]), gl.STATIC_DRAW);
}
