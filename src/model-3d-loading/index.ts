import { m4, normalize, Vector3 } from "../matrix";
import { resizeCanvasToDisplaySize } from "../canvas";
import { createBufferInfoFromArrays, createProgramInfo, setAttributes, setUniforms } from "../webglutils";

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;

void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_normal = mat3(u_world) * a_normal;
}`;

const fragmentShaderSource = `
precision mediump float;

varying vec3 v_normal;

uniform vec4 u_diffuse;
uniform vec3 u_light_direction;

void main () {
    vec3 normal = normalize(v_normal);
    float fakeLight = dot(u_light_direction, normal) * .5 + .5;
    gl_FragColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
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
    f0.add(state, "cameraPosZ")
        .min(-200)
        .max(200)
        .step(1)
        .onChange(() => onChangeCallback);

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
export async function model3DLoading(canvas: HTMLCanvasElement, gui: any, animManger: { handle: number }) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        fieldOfViewRadians: degToRad(60),
        fieldOfViewDeg: 60,
        cameraPosZ: 4,
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        fColor: [51, 255, 51, 255],
        fColorUnit: [0.2, 1, 0.2, 1]
    };

    initDebugUI(gui, state, () => {});

    const response = await fetch("https://webglfundamentals.org/webgl/resources/models/cube/cube.obj");
    const text = await response.text();
    const data = parseOBJ(text);

    // setup GLSL program info
    const programInfo = createProgramInfo({
        gl,
        sources: [vertexShaderSource, fragmentShaderSource],
        attributes: ["a_position", "a_normal"],
        uniforms: ["u_world", "u_view", "u_projection", "u_diffuse", "u_light_direction"]
    });

    const arrays = {
        a_position: { numComponents: 3, data: data.position },
        a_normal: { numComponents: 3, data: data.normal }
    };

    const bufferInfo = createBufferInfoFromArrays(gl, arrays);

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
        const zNear = 0.1;
        const zFar = 50;
        let projectionMatrix = m4.perspective(state.fieldOfViewRadians, aspect, zNear, zFar);

        // Compute the camera's matrix
        const camera: Vector3 = [0, 0, state.cameraPosZ];
        const target: Vector3 = [0, 0, 0];
        const up: Vector3 = [0, 1, 0];
        const cameraMatrix = m4.lookAt(camera, target, up);

        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        const sharedUniforms = {
            u_light_direction: normalize([-1, 3, 5]) as Vector3,
            u_view: viewMatrix,
            u_projection: projectionMatrix
        };

        setUniforms(gl, programInfo, sharedUniforms);

        setAttributes(gl, programInfo, bufferInfo);

        setUniforms(gl, programInfo, {
            u_world: m4.yRotation(time),
            u_diffuse: [1, 0.7, 0.5, 1]
        });

        // Draw
        const primitiveType = gl.TRIANGLES;
        const offset = 0;
        const count = 16 * 6;
        gl.drawArrays(primitiveType, offset, count);

        animManger.handle = requestAnimationFrame(drawScene);
    }
}

// This is not a full .obj parser.
// see http://paulbourke.net/dataformats/obj/

function parseOBJ(text) {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];

    // same order as `f` indices
    const objVertexData = [objPositions, objTexcoords, objNormals];

    // same order as `f` indices
    let webglVertexData = [
        [], // positions
        [], // texcoords
        [] // normals
    ];

    // function newGeometry() {
    //     // If there is an existing geometry and it's
    //     // not empty then start a new one.
    //     if (geometry && geometry.data.position.length) {
    //         geometry = undefined;
    //     }
    //     setGeometry();
    // }

    function addVertex(vert) {
        const ptn = vert.split("/");
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
        });
    }

    const keywords = {
        v(parts) {
            objPositions.push(parts.map(parseFloat));
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
            // should check for missing v and extra w?
            objTexcoords.push(parts.map(parseFloat));
        },
        f(parts) {
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        }
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split("\n");
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === "" || line.startsWith("#")) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn("unhandled keyword:", keyword); // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return {
        position: webglVertexData[0],
        texcoord: webglVertexData[1],
        normal: webglVertexData[2]
    };
}
