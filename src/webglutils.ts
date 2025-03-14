import {
    isMatrix3,
    isMatrix4,
    isVector3,
    isVector4,
    m4,
    Matrix3,
    Matrix4,
    transformPoint,
    Vector3,
    Vector4
} from "./matrix";

export type ProgramInfo = {
    program: WebGLProgram;
    uniformSetters: { [key: string]: WebGLUniformLocation | null };
    attribSetters: { [key: string]: GLint };
};

/**
 * Creates the program, the shaders and the attribute and uniform setters
 * @param {ProgramInfoArgs} programInfoArgs
 * @param {WebGLRenderingContext} programInfoArgs.gl
 * @param {string[]} programInfoArgs.shaderSources
 * @param {string[]} programInfoArgs.attributes
 * @param {string[]} programInfoArgs.uniforms
 * @returns {ProgramInfo | null}
 */
export function createProgramInfo({
    gl,
    sources,
    attributes,
    uniforms
}: {
    gl: WebGLRenderingContext;
    sources: string[];
    attributes: string[];
    uniforms: string[];
}): ProgramInfo | null {
    const [vertexShaderSource, fragmentShaderSource] = sources;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) {
        return null;
    }

    const uniformSetters = createUniformSetters(gl, program, uniforms);
    const attribSetters = createAttributeSetters(gl, program, attributes);

    return {
        program,
        uniformSetters,
        attribSetters
    };
}

/**
 * Creates a shader
 * @param {WebGLRenderingContext} gl
 * @param {GLenum} type
 * @param {string} source
 * @returns {WebGLShader | null}
 */
export function createShader(gl: WebGLRenderingContext, type: GLenum, source: string): WebGLShader | null {
    const shader = gl.createShader(type);

    if (!shader) {
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}

/**
 * Creates a program
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {WebGLProgram | null}
 */
export function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram | null {
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);

    return null;
}

/**
 * Creates all the uniform setters
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string[]} uniforms
 * @returns {{[key: string]: WebGLUniformLocation | null}}
 */
export function createUniformSetters(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    uniforms: string[]
): { [key: string]: WebGLUniformLocation | null } {
    const uniformSetters: { [key: string]: WebGLUniformLocation | null } = {};

    uniforms.forEach(u => {
        uniformSetters[u] = gl.getUniformLocation(program, u);
    });

    return uniformSetters;
}

/**
 * Creates all the attribute setters
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string[]} attributes
 * @returns {{[key: string]: GLint}}
 */
export function createAttributeSetters(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    attributes: string[]
): { [key: string]: GLint } {
    const attribSetters: { [key: string]: GLint } = {};

    attributes.forEach(attr => {
        attribSetters[attr] = gl.getAttribLocation(program, attr);
    });

    return attribSetters;
}

export type BufferArraysData = {
    a_position?: { numComponents: number; data: number[] };
    a_texcoord?: { numComponents: number; data: number[] };
    a_normal?: { numComponents: number; data: number[] };
    a_indices?: { numComponents: number; data: number[] };
};

export type BufferArraysInfo = {
    a_position?: {
        numComponents: number;
        data: number[];
        buffer: WebGLBuffer;
    };
    a_texcoord?: {
        numComponents: number;
        data: number[];
        buffer: WebGLBuffer;
    };
    a_normal?: {
        numComponents: number;
        data: number[];
        buffer: WebGLBuffer;
    };
    a_indices?: {
        numComponents: number;
        data: number[];
        buffer: WebGLBuffer;
    };
};

/**
 * Creates all the Buffer arrays needed for the program
 * @param {WebGLRenderingContext} gl
 * @param {BufferArraysData} arrays
 * @returns {BufferArraysInfo}
 */
export function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: BufferArraysData): BufferArraysInfo {
    const buffersInfo: BufferArraysInfo = {};

    if (arrays.a_position) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        setGeometry(gl, arrays.a_position.data);
        buffersInfo.a_position = { ...arrays.a_position, buffer: positionBuffer };
    }

    if (arrays.a_normal) {
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        setNormals(gl, arrays.a_normal.data);
        buffersInfo.a_normal = { ...arrays.a_normal, buffer: normalBuffer };
    }

    if (arrays.a_indices) {
        const indicesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        setIndices(gl, arrays.a_indices.data);
        buffersInfo.a_indices = { ...arrays.a_indices, buffer: indicesBuffer };
    }

    if (arrays.a_texcoord) {
        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        setTextureData(gl, arrays.a_texcoord.data);
        buffersInfo.a_texcoord = { ...arrays.a_texcoord, buffer: textureCoordBuffer };
    }

    return buffersInfo;
}

/**
 * Fills the buffer with the values that define a rectangle
 * Note, will put the values in whatever buffer is currently
 * bound to the ARRAY_BUFFER bind point
 * @param {WebGLRenderingContext} gl
 */
function setGeometry(gl: WebGLRenderingContext, data: number[]) {
    const positions = new Float32Array(data);

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

function setNormals(gl: WebGLRenderingContext, data: number[]) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
}

function setIndices(gl: WebGLRenderingContext, data: number[]) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
}

function setTextureData(gl: WebGLRenderingContext, data: number[]) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
}

export type UniformsData = { [key: string]: Vector3 | Vector4 | Matrix3 | Matrix4 | number };

/**
 * Sets the uniforms data
 * @param {WebGLRenderingContext} gl
 * @param {ProgramInfo} programInfo
 * @param {UniformsData} uniformsData
 */
export function setUniforms(gl: WebGLRenderingContext, programInfo: ProgramInfo, uniformsData: UniformsData) {
    Object.keys(uniformsData).forEach(uniform => {
        const data = uniformsData[uniform];
        const uniformLocation = programInfo.uniformSetters[uniform];

        if (typeof data === "number") {
            gl.uniform1f(uniformLocation, data);
        } else if (isVector3(data)) {
            gl.uniform3fv(uniformLocation, data);
        } else if (isVector4(data)) {
            gl.uniform4fv(uniformLocation, data);
        } else if (isMatrix3(data)) {
            gl.uniformMatrix3fv(uniformLocation, false, data);
        } else if (isMatrix4(data)) {
            gl.uniformMatrix4fv(uniformLocation, false, data);
        }
    });
}

export function setAttributes(gl: WebGLRenderingContext, programInfo: ProgramInfo, bufferInfo: BufferArraysInfo) {
    Object.keys(bufferInfo).forEach(attribute => {
        const attribInfo = bufferInfo[attribute];
        const attribLocation = programInfo.attribSetters[attribute];

        gl.bindBuffer(gl.ARRAY_BUFFER, attribInfo.buffer);
        gl.enableVertexAttribArray(attribLocation);
        gl.vertexAttribPointer(attribLocation, attribInfo.numComponents, gl.FLOAT, false, 0, 0);
    });
}
