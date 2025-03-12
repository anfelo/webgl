/**
 * Creates the program, the shaders and the attribute and uniform setters
 * @param {ProgramInfoArgs} programInfoArgs
 * @param {WebGLRenderingContext} programInfoArgs.gl
 * @param {string[]} programInfoArgs.shaderSources
 * @param {string[]} programInfoArgs.attributes
 * @param {string[]} programInfoArgs.uniforms
 * @returns {{ program: WebGLProgram, uniformSetters: , attribSetters } | null}
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
}): { program: WebGLProgram; uniformSetters: Object; attribSetters: Object } | null {
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
