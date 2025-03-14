import { m4, Matrix4, normalize, Vector3 } from "../matrix";
import { resizeCanvasToDisplaySize } from "../canvas";
import { createBufferInfoFromArrays, createProgramInfo, setAttributes, setUniforms } from "../webglutils";
import { fragmentShaderSource } from "./default.frag";
import { vertexShaderSource } from "./default.vert";
import { normalsData, positionData } from "./arrays-data";

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
export function multipleObjectsScene(canvas: HTMLCanvasElement, gui: any, animManger: { handle: number }) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        fieldOfViewRadians: degToRad(60),
        fieldOfViewDeg: 60,
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        fColor: [51, 255, 51, 255],
        fColorUnit: [0.2, 1, 0.2, 1],
    };

    initDebugUI(gui, state, () => {});

    // setup GLSL program info
    const programInfo = createProgramInfo({
        gl,
        sources: [vertexShaderSource, fragmentShaderSource],
        attributes: ["a_position", "a_normal"],
        uniforms: ["u_world_view_projection", "u_world_inverse_transpose", "u_color", "u_reverse_light_direction"]
    });

    const arrays = {
        a_position: { numComponents: 3, data: positionData },
        a_normal: { numComponents: 3, data: normalsData }
    };

    const bufferInfo = createBufferInfoFromArrays(gl, arrays);

    const objectUniformsData = {
        u_world_view_projection: m4.identity() as Matrix4,
        u_world_inverse_transpose: m4.identity() as Matrix4
    };

    const uniformsData = {
        u_reverse_light_direction: normalize([0.5, 0.7, 1]) as Vector3,
        u_color: state.fColorUnit as Vector3
    };

    const rand = function (min: number, max?: number) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return min + Math.random() * (max - min);
    };

    let objects = [];
    const numObjects = 100;
    for (var ii = 0; ii < numObjects; ++ii) {
        objects.push({
            radius: rand(300),
            xRotation: rand(Math.PI * 2),
            yRotation: rand(Math.PI)
        });
    }

    animManger.handle = requestAnimationFrame(drawScene);

    /**
     * Draws the scene.
     */
    function drawScene(time: number) {
        time = time * 0.0001 + 5;

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

        // Draw objects
        objects.forEach(function (object) {
            // Draw a F at the origin
            let worldMatrix = m4.xRotation(object.xRotation * time);
            worldMatrix = m4.yRotate(worldMatrix, object.yRotation * time);
            worldMatrix = m4.translate(worldMatrix, 0, 0, object.radius);
            worldMatrix = m4.scale(worldMatrix, 0.3, 0.3, 0.3);

            // Multiply the matrices.
            const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
            const worldInverseMatrix = m4.inverse(worldMatrix);
            const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

            // Set object the matrices
            objectUniformsData.u_world_view_projection = worldViewProjectionMatrix;
            objectUniformsData.u_world_inverse_transpose = worldInverseTransposeMatrix;

            // Set the uniforms we just computed
            setUniforms(gl, programInfo, objectUniformsData);

            // Draw the geometry.
            const primitiveType = gl.TRIANGLES;
            const offset = 0;
            const count = 16 * 6;
            gl.drawArrays(primitiveType, offset, count);
        });

        // Set the color to use
        uniformsData.u_color = state.fColorUnit as Vector3;

        setAttributes(gl, programInfo, bufferInfo);

        setUniforms(gl, programInfo, uniformsData);

        animManger.handle = requestAnimationFrame(drawScene);
    }
}
