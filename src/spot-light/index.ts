import { m4, transformPoint, Vector3 } from "../matrix.js";
import { resizeCanvasToDisplaySize } from "../canvas.js";
import { createShader, createProgram } from "../webglutils.js";

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec3 a_normal;

uniform vec3 u_light_world_position;
uniform vec3 u_view_world_position;

uniform mat4 u_world;
uniform mat4 u_world_view_projection;
uniform mat4 u_world_inverse_transpose;

varying vec3 v_normal;

varying vec3 v_surface_to_light;
varying vec3 v_surface_to_view;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_world_view_projection * a_position;

  // orient the normals and pass to the fragment shader
  v_normal = mat3(u_world_inverse_transpose) * a_normal;

  // compute the world position of the surfoace
  vec3 surface_world_position = (u_world * a_position).xyz;

  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surface_to_light = u_light_world_position - surface_world_position;

  // compute the vector of the surface to the view/camera
  // and pass it to the fragment shader
  v_surface_to_view = u_view_world_position - surface_world_position;
}`;

const fragmentShaderSource = `
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;
varying vec3 v_surface_to_light;
varying vec3 v_surface_to_view;

uniform vec4 u_color;
uniform float u_shininess;
uniform vec3 u_light_direction;
uniform float u_inner_limit;          // in dot space
uniform float u_outer_limit;          // in dot space

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  vec3 surface_to_light_direction = normalize(v_surface_to_light);
  vec3 surface_to_view_direction = normalize(v_surface_to_view);
  vec3 half_vector = normalize(surface_to_light_direction + surface_to_view_direction);

  float dot_from_direction = dot(surface_to_light_direction,
                               -u_light_direction);
  float in_light = smoothstep(u_outer_limit, u_inner_limit, dot_from_direction);
  float light = in_light * dot(normal, surface_to_light_direction);
  float specular = in_light * pow(dot(normal, half_vector), u_shininess);

  gl_FragColor = u_color;

  // Lets multiply just the color portion (not the alpha)
  // by the light
  gl_FragColor.rgb *= light;

  // Just add in the specular
  gl_FragColor.rgb += specular;
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
    f0.add(state, "shininess").min(1).max(300).step(1).onChange(onChangeCallback);
    f0.add(state, "lightRotationX").min(-2.0).max(2.0).step(0.001).onChange(onChangeCallback);
    f0.add(state, "lightRotationY").min(-2.0).max(2.0).step(0.001).onChange(onChangeCallback);
    f0.add(state, "innerLimitDeg").min(0).max(180).step(1).onChange(() => {
        state.innerLimitRad = degToRad(state.innerLimitDeg);
        onChangeCallback();
    });
    f0.add(state, "outerLimitDeg").min(0).max(180).step(1).onChange(() => {
        state.outerLimitRad = degToRad(state.outerLimitDeg);
        onChangeCallback();
    });

    const f1 = gui.addFolder("F");
    f1.addColor(state, "fColor").onChange(newColor => {
        state.fColorUnit = newColor.map(value => value / 255);
        onChangeCallback();
    });
}

function degToRad(d) {
    return (d * Math.PI) / 180;
}

/**
 * Paints a letter F and adds a spot light to the scene
 * @param {HTMLCanvasElement} canvas
 */
export function spotLight(canvas: HTMLCanvasElement, gui) {
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
        canvasHeight: canvas.clientHeight,
        shininess: 150,
        fColor: [51, 255, 51, 255],
        fColorUnit: [0.2, 1, 0.2, 1],
        lightRotationX: 0,
        lightRotationY: 0,
        innerLimitRad: degToRad(10),
        innerLimitDeg: 10,
        outerLimitRad: degToRad(20),
        outerLimitDeg: 20
    };

    initDebugUI(gui, state, drawScene);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // setup GLSL program
    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const normalLocation = gl.getAttribLocation(program, "a_normal");

    // lookup uniforms
    const worldViewProjectionLocation = gl.getUniformLocation(program, "u_world_view_projection");
    const worldInverseTransposeLocation = gl.getUniformLocation(program, "u_world_inverse_transpose");
    const colorLocation = gl.getUniformLocation(program, "u_color");
    const shininessLocation = gl.getUniformLocation(program, "u_shininess");
    const lightWorldPositionLocation = gl.getUniformLocation(program, "u_light_world_position");
    const viewWorldPositionLocation = gl.getUniformLocation(program, "u_view_world_position");
    const worldLocation = gl.getUniformLocation(program, "u_world");
    const lightDirectionLocation = gl.getUniformLocation(program, "u_light_direction");
    const innerLimitLocation = gl.getUniformLocation(program, "u_inner_limit");
    const outerLimitLocation = gl.getUniformLocation(program, "u_outer_limit");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    // Create a buffer to put normals in
    const normalBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // Put normals data into buffer
    setNormals(gl);

    drawScene();

    /**
     * Draws the scene.
     */
    function drawScene() {
        resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

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

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.enableVertexAttribArray(normalLocation);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

        const aspect = state.canvasWidth / state.canvasHeight;
        const zNear = 1;
        const zFar = 2000;
        let projectionMatrix = m4.perspective(state.fieldOfViewRadians, aspect, zNear, zFar);

        // Compute the camera's matrix
        const camera: Vector3 = [100, 150, 200];
        const target: Vector3 = [0, 35, 0];
        const up: Vector3 = [0, 1, 0];
        const cameraMatrix = m4.lookAt(camera, target, up);

        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        // Compute a view projection' matrix
        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // Draw a F at the origin
        const worldMatrix = m4.yRotation(state.cameraAngleRadians);

        // Multiply the matrices.
        const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
        const worldInverseMatrix = m4.inverse(worldMatrix);
        const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

        // Set the matrices
        gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
        gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
        gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

        // Set the color to use
        gl.uniform4fv(colorLocation, state.fColorUnit);

        // set the light position
        const lightPosition: Vector3 = [20, 30, 60];
        gl.uniform3fv(lightWorldPositionLocation, lightPosition);

        // set the camera/view position
        gl.uniform3fv(viewWorldPositionLocation, camera);

        // set the shininess
        gl.uniform1f(shininessLocation, state.shininess);

        // set the spotlight uniforms
        let lightDirection: Vector3 = [0, 0, 1];

        // since we don't have a plane like most spotlight examples
        // let's point the spot light at the F
        {
            let lmat = m4.lookAt(lightPosition, target, up);
            lmat = m4.multiply(m4.xRotation(state.lightRotationX), lmat);
            lmat = m4.multiply(m4.yRotation(state.lightRotationY), lmat);
            // get the zAxis from the matrix
            // negate it because lookAt looks down the -Z axis
            lightDirection = [-lmat[8], -lmat[9], -lmat[10]];
        }

        gl.uniform3fv(lightDirectionLocation, lightDirection);
        gl.uniform1f(innerLimitLocation, Math.cos(state.innerLimitRad));
        gl.uniform1f(outerLimitLocation, Math.cos(state.outerLimitRad));

        // Draw the geometry.
        const primitiveType = gl.TRIANGLES;
        const offset = 0;
        const count = 16 * 6;
        gl.drawArrays(primitiveType, offset, count);
    }
}

/**
 * Fills the buffer with the values that define a rectangle
 * Note, will put the values in whatever buffer is currently
 * bound to the ARRAY_BUFFER bind point
 * @param {WebGLRenderingContext} gl
 */
function setGeometry(gl: WebGLRenderingContext) {
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
    var matrix = m4.xRotation(Math.PI);
    matrix = m4.translate(matrix, -50, -75, -15);

    for (var ii = 0; ii < positions.length; ii += 3) {
        var vector = transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2]]);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
    }
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setNormals(gl: WebGLRenderingContext) {
    const normals = new Float32Array([
        // left column front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // top rung front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // middle rung front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // left column back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // top rung back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // middle rung back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // top
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

        // top rung right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // under top rung
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

        // between top rung and middle
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // top of middle rung
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

        // right of middle rung
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // bottom of middle rung.
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

        // right of bottom
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // bottom
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

        // left side
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
