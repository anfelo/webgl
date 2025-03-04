import { resizeCanvasToDisplaySize } from "../canvas.js";
import { createShader, createProgram } from "../webglutils.js";

const vertexShaderSource = `
  // an attribute will receive data from a buffer
  attribute vec4 a_position;

  uniform vec2 u_resolution;

  // all shaders have a main function
  void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position.xy / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSource = `
  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    gl_FragColor = u_color;
  }
`;

/**
 * Paints multiple colored rectangles into the canvas
 * @param {HTMLCanvasElement} canvas
 */
export function helloMultipleRectangles(canvas) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    // look up uniform locations
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const colorUniformLocation = gl.getUniformLocation(program, "u_color");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // create an EBO to instruct webgl how to paint the rectangle with the
    // previous positions
    const indices = [0, 1, 2, 1, 2, 3];
    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
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
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    for (let i = 0; i < 50; ++i) {
        setRectangle(gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // draw elements
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}

/**
 * Gets a random int
 * @param {number} range
 */
function randomInt(range) {
    return Math.floor(Math.random() * range);
}

/**
 * Sets the rectangle position data
 * @param {WebGLRenderingContext} gl
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
function setRectangle(gl, x, y, width, height) {
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x2, y2]), gl.STATIC_DRAW);
}
