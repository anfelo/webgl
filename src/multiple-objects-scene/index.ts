import { m4, Matrix4, Vector3 } from "../matrix";
import { resizeCanvasToDisplaySize } from "../canvas";
import { createBufferInfoFromArrays, createProgramInfo, setAttributes, setUniforms } from "../webglutils";
import { fragmentShaderSource } from "./default.frag";
import { vertexShaderSource } from "./default.vert";

const positionData = [
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
];

const normalsData = [
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
];

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
    f0.add(state, "innerLimitDeg")
        .min(0)
        .max(180)
        .step(1)
        .onChange(() => {
            state.innerLimitRad = degToRad(state.innerLimitDeg);
            onChangeCallback();
        });
    f0.add(state, "outerLimitDeg")
        .min(0)
        .max(180)
        .step(1)
        .onChange(() => {
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
export function multipleObjectsScene(canvas: HTMLCanvasElement, gui) {
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

    // setup GLSL program info
    const programInfo = createProgramInfo({
        gl,
        sources: [vertexShaderSource, fragmentShaderSource],
        attributes: ["a_position", "a_normal"],
        uniforms: [
            "u_world_view_projection",
            "u_world_inverse_transpose",
            "u_color",
            "u_shininess",
            "u_light_world_position",
            "u_view_world_position",
            "u_world",
            "u_light_direction",
            "u_inner_limit",
            "u_outer_limit"
        ]
    });

    const arrays = {
        a_position: { numComponents: 3, data: positionData },
        a_normal: { numComponents: 3, data: normalsData }
    };

    const bufferInfo = createBufferInfoFromArrays(gl, arrays);

    const objectUniformsData = {
        u_world_view_projection: m4.identity() as Matrix4,
        u_world_inverse_transpose: m4.identity() as Matrix4,
        u_world: m4.identity() as Matrix4
    };

    const uniformsData = {
        u_view_world_position: [100, 150, 200] as Vector3,
        u_light_world_position: [20, 30, 60] as Vector3,
        u_light_direction: [0, 0, 1] as Vector3,
        u_inner_limit: Math.cos(state.innerLimitRad),
        u_outer_limit: Math.cos(state.outerLimitRad),
        u_color: state.fColorUnit as Vector3,
        u_shininess: state.shininess
    };

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
        gl.useProgram(programInfo.program);

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

        // Set object the matrices
        objectUniformsData.u_world_view_projection = worldViewProjectionMatrix;
        objectUniformsData.u_world_inverse_transpose = worldInverseTransposeMatrix;
        objectUniformsData.u_world = worldMatrix;

        setUniforms(gl, programInfo, objectUniformsData);

        // since we don't have a plane like most spotlight examples
        // let's point the spot light at the F
        {
            let lmat = m4.lookAt(uniformsData.u_light_world_position as Vector3, target, up);
            lmat = m4.multiply(m4.xRotation(state.lightRotationX), lmat);
            lmat = m4.multiply(m4.yRotation(state.lightRotationY), lmat);
            // get the zAxis from the matrix
            // negate it because lookAt looks down the -Z axis
            uniformsData.u_light_direction = [-lmat[8], -lmat[9], -lmat[10]];
        }

        // Set the color to use
        uniformsData.u_color = state.fColorUnit as Vector3;
        // set the camera/view position
        uniformsData.u_view_world_position = camera;
        // set the shininess
        uniformsData.u_shininess = state.shininess;
        // set the specular innerLimit and outerLimit
        uniformsData.u_inner_limit = Math.cos(state.innerLimitRad);
        uniformsData.u_outer_limit = Math.cos(state.outerLimitRad);

        setAttributes(gl, programInfo, bufferInfo);

        setUniforms(gl, programInfo, uniformsData);

        // Draw the geometry.
        const primitiveType = gl.TRIANGLES;
        const offset = 0;
        const count = 16 * 6;
        gl.drawArrays(primitiveType, offset, count);
    }
}
