import { m4 } from "../matrix.js";
import { resizeCanvasToDisplaySize } from "../canvas.js";
import { createShader, createProgram } from "../webglutils.js";
import { initBuffers } from "./initbuffers.js";

import woodenShelf from "/wooden_shelf.jpg";

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying highp vec2 v_texcoord;

void main() {
    gl_Position = u_matrix * a_position;

    v_texcoord = a_texcoord;
}`;

const fragmentShaderSource = `
varying highp vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord);
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

    const f1 = gui.addFolder("Position");
    f1.add(state, "posX")
        .min(-200)
        .max(200)
        .step(0.1)
        .onChange(() => onChangeCallback());
    f1.add(state, "posY")
        .min(-200)
        .max(200)
        .step(0.1)
        .onChange(() => onChangeCallback());
    f1.add(state, "posZ")
        .min(-1000)
        .max(1)
        .step(0.1)
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
    f2.add(state, "scaleZ")
        .min(-5)
        .max(5)
        .step(0.1)
        .onChange(() => onChangeCallback());

    const f3 = gui.addFolder("Rotation");
    f3.add(state, "rotDegX")
        .min(0)
        .max(360)
        .step(1)
        .onChange(() => {
            const angleInDegrees = 360 - state.rotDegX;
            state.rotRadX = degToRad(angleInDegrees);
            onChangeCallback();
        });
    f3.add(state, "rotDegY")
        .min(0)
        .max(360)
        .step(1)
        .onChange(() => {
            const angleInDegrees = 360 - state.rotDegY;
            state.rotRadY = degToRad(angleInDegrees);
            onChangeCallback();
        });
    f3.add(state, "rotDegZ")
        .min(0)
        .max(360)
        .step(1)
        .onChange(() => {
            const angleInDegrees = 360 - state.rotDegZ;
            state.rotRadZ = degToRad(angleInDegrees);
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
 * Paints a cube with texture in all its faces
 * @param {HTMLCanvasElement} canvas
 */
export function texture3D(canvas, gui) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        fieldOfViewRadians: degToRad(60),
        fieldOfViewDeg: 60,
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        posX: 0,
        posY: 0,
        posZ: -6,
        rotDegX: 190,
        rotDegY: 40,
        rotDegZ: 320,
        rotRadX: degToRad(190),
        rotRadY: degToRad(40),
        rotRadZ: degToRad(320),
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1
    };

    initDebugUI(gui, state, drawScene);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // setup GLSL program
    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");

    // lookup uniforms
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    const textureLocation = gl.getUniformLocation(program, "u_texture");

    const buffers = initBuffers(gl);

    // Load texture
    const texture = loadTexture(gl, woodenShelf, () => drawScene());
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

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

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        // Compute the matrix
        const aspect = state.canvasWidth / state.canvasHeight;
        const zNear = 1;
        const zFar = 2000;
        let matrix = m4.perspective(state.fieldOfViewRadians, aspect, zNear, zFar);

        matrix = m4.translate(matrix, state.posX, state.posY, state.posZ);
        matrix = m4.xRotate(matrix, state.rotRadX);
        matrix = m4.yRotate(matrix, state.rotRadY);
        matrix = m4.zRotate(matrix, state.rotRadZ);
        matrix = m4.scale(matrix, state.scaleX, state.scaleY, state.scaleZ);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(textureLocation, 0);

        // draw elements
        const vertexCount = 6 * 6; // 6 Faces * 6 Vertices
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}


/**
 * Loads the texture
 * @param {WebGLRenderingContext} gl
 * @param {string} textureSrc
 * @param {CallableFunction} onLoadCallback
 * @returns {WebGLTexture | null}
 */
function loadTexture(gl, textureSrc, onLoadCallback) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Asynchronously load an image
    const image = new Image();
    image.src = textureSrc;
    image.addEventListener("load", function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        onLoadCallback();
    });

    return texture;
}
