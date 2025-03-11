/**
 * Creates a shader
 * @param {WebGLRenderingContext} gl
 * @param {string[]} shaderSources
 * @param {string[]} attributes
 * @param {string[]} uniforms
 * @returns {{ program: WebGLProgram }}
 */
export function createProgramInfo({
    context: gl,
    sources: [vertexShaderSource, fragmentShaderSource],
    attributes: attributes,
    uniforms: uniforms
}) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram(gl, vertexShader, fragmentShader);
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
 * @param {number} type
 * @param {string} source
 * @returns {WebGLShader | null}
 */
export function createShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

/**
 * Creates a program
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {WebGLProgram | null}
 */
export function createProgram(gl, vertexShader, fragmentShader) {
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
}

/**
 * Creates all the uniform setters
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string[]} uniforms
 */
export function createUniformSetters(gl, program, uniforms) {
    const unis = {};

    uniforms.forEach(u => {
        unis[u] = gl.getUniformLocation(program, u);
    });

    return unis;
}

/**
 * Creates all the attribute setters
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string[]} attributes
 */
export function createAttributeSetters(gl, program, attributes) {
    const locs = {};

    attributes.forEach(attr => {
        locs[attr] = gl.getAttribLocation(program, attr);
    });

    return locs;
}
