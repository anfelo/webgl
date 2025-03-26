import { resizeCanvasToDisplaySize } from "../canvas.js";
import { createShader, createProgram } from "../webglutils.js";

const vertexShaderSource = `
attribute vec4 a_position;

varying vec2 v_uvs;

void main() {
    gl_Position = vec4(a_position.xy * vec2(1, -1), 0, 1);

    v_uvs = (gl_Position.xy + 1.0) / 2.0;
}
`;

const fragmentShaderSource1 = `
precision mediump float;

varying vec2 v_uvs;

void main() {
    vec3 color = vec3(0.0);

    float value1 = v_uvs.x;
    float value2 = smoothstep(0.0, 1.0, v_uvs.x);

    float line = smoothstep(0.0, 0.005, abs(v_uvs.y - 0.5));
    float linearLine = smoothstep(0.0, 0.0075, abs(v_uvs.y - mix(0.5, 1.0, value1)));
    float smoothLine = smoothstep(0.0, 0.0075, abs(v_uvs.y - mix(0.0, 0.5, value2)));

    vec3 red = vec3(1.0, 0.0, 0.0);
    vec3 blue = vec3(0.0, 0.0, 1.0);
    vec3 white = vec3(1.0, 1.0, 1.0);

    if (v_uvs.y > 0.5) {
        color = mix(red, blue, v_uvs.x);
    } else {
        color = mix(red, blue, smoothstep(0.0, 1.0, v_uvs.x));
    }

    color = mix(white, color, line);
    color = mix(white, color, linearLine);
    color = mix(white, color, smoothLine);

    gl_FragColor = vec4(color, 1.0);
}
`;

const fragmentShaderSource2 = `
precision mediump float;

uniform vec2 u_resolution;

varying vec2 v_uvs;

vec3 red = vec3(1.0, 0.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);
vec3 white = vec3(1.0, 1.0, 1.0);
vec3 black = vec3(0.0, 0.0, 0.0);
vec3 yellow = vec3(1.0, 1.0, 0.0);

void main() {
    vec3 color = vec3(0.75);

    // grid
    vec2 center = v_uvs - 0.5;
    vec2 cell = fract(center * u_resolution / 100.0);
    cell = abs(cell - 0.5);
    float distToCell = 1.0 - 2.0 * max(cell.x, cell.y);

    float cellLine = smoothstep(0.0, 0.05, distToCell);

    float xAxis = smoothstep(0.0, 0.002, abs(v_uvs.y - 0.5));
    float yAxis = smoothstep(0.0, 0.002, abs(v_uvs.x - 0.5));

    // Lines
    vec2 pos = center * u_resolution / 100.0;
    float value1 = pos.x;
    // float value2 = mod(pos.x, 1.43);
    // float value2 = abs(pos.x);
    // float value2 = clamp(pos.x, 1.0, 2.0);
    float value2 = fract(pos.x);
    float functionLine1 = smoothstep(0.0, 0.075, abs(pos.y - value1));
    float functionLine2 = smoothstep(0.0, 0.075, abs(pos.y - value2));

    // color mix
    color = mix(black, color, cellLine);
    color = mix(blue, color, xAxis);
    color = mix(blue, color, yAxis);
    color = mix(yellow, color, functionLine1);
    color = mix(red, color, functionLine2);

    gl_FragColor = vec4(color, 1.0);
}
`;

const shaders = [
    {
        value: "Smooth vs. Linear",
        shaderSrc: fragmentShaderSource1
    },
    {
        value: "Grid",
        shaderSrc: fragmentShaderSource2
    }
];

function initDebugUI(gui, state, onChangeCallback) {
    gui.remember(state);

    const f1 = gui.addFolder("Shader Examples");
    f1.add(
        state,
        "shaderName",
        shaders.map(s => s.value)
    ).onChange(value => {
        state.shader = shaders.find(s => s.value === value)
        onChangeCallback();
    });
}

/**
 * Paints a simple rectangle into the canvas
 * @param {HTMLCanvasElement} canvas
 */
export function shaderFunctions(canvas: HTMLCanvasElement, gui) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        shader: shaders[0],
        shaderName: shaders[0].value
    };

    initDebugUI(gui, state, () => drawScene(gl, state));

    drawScene(gl, state);
}

function drawScene(gl: WebGLRenderingContext, state) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, state.shader.shaderSrc);

    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

    // three 2d points
    const positions = [
        -1,
        -1, // top left
        1,
        -1, // top right
        -1,
        1, // bottom left
        1,
        1 // bottom right
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // create an EBO to instruct webgl how to paint the rectangle with the
    // previous positions
    const indices = [0, 1, 2, 1, 2, 3];
    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

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

    // draw elements
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}
