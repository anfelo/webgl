const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform mat3 u_matrix;

varying vec2 v_texcoord;

void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    v_texcoord = a_texcoord;
}`;

const fragmentShaderSource = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
}`;

const m3 = {
    multiply: function (a, b) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];

        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22
        ];
    },

    translation: function (tx, ty) {
        return [
            1, 0, 0,
            0, 1, 0,
            tx, ty, 1
         ];
    },

    rotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
            c, -s, 0,
            s, c, 0,
            0, 0, 1
        ];
    },

    scaling: function (sx, sy) {
        return [
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1
        ];
    },

    // This projection matrix is used to convert from pixels to clipspace
    projection: function (width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [
            2 / width, 0, 0,
            0, -2 / height, 0,
            -1, 1, 1
        ];
    },

    translate: function (m, tx, ty) {
        return m3.multiply(m, m3.translation(tx, ty));
    },

    rotate: function (m, angleInRadians) {
        return m3.multiply(m, m3.rotation(angleInRadians));
    },

    scale: function (m, sx, sy) {
        return m3.multiply(m, m3.scaling(sx, sy));
    }
};

/**
 * Resizes the canvas to match the display size
 * @param {HTMLCanvasElement} canvas
 * @param {number} multiplier
 * @returns {boolean}
 */
function resizeCanvasToDisplaySize(canvas, multiplier) {
    multiplier = multiplier || 1;
    const width = (canvas.clientWidth * multiplier) | 0;
    const height = (canvas.clientHeight * multiplier) | 0;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

/**
 * Creates a shader
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 * @returns {WebGLShader | null}
 */
function createShader(gl, type, source) {
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
function createProgram(gl, vertexShader, fragmentShader) {
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

function initDebugUI(state, onChangeCallback) {
    const gui = new dat.gui.GUI();

    gui.remember(state);

    gui.add(state, "angleInDegrees")
        .min(0)
        .max(360)
        .step(1)
        .onChange(() => {
            const angleInDegrees = 360 - state.angleInDegrees;
            state.angleInRadians = (angleInDegrees * Math.PI) / 180;
            onChangeCallback();
        });

    const f1 = gui.addFolder("Position");
    f1.add(state, "posX")
        .min(0)
        .max(state.canvasWidth)
        .step(0.25)
        .onChange(() => onChangeCallback());
    f1.add(state, "posY")
        .min(0)
        .max(state.canvasHeight)
        .step(0.25)
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
}

function main() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#c");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const state = {
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        posX: 200,
        posY: 150,
        angleInRadians: 0,
        angleInDegrees: 0,
        scaleX: 1,
        scaleY: 1
    };

    initDebugUI(state, drawScene);

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

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometryAndTexcoords(gl);

    // create an EBO to instruct webgl how to paint the rectangle with the
    // previous positions
    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    setGeometryIndices(gl);

    // set position attribute
    // each float takes 4 bytes and each vertex has 4 elements
    // (2 * position and 2 * texcoords)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 4 * 4, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);
    // set texture attribute
    gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 4 * 4, 4 * 2);
    gl.enableVertexAttribArray(texcoordAttributeLocation);

    // Create a texture.
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Asynchronously load an image
    const image = new Image();
    image.src = "./wooden_shelf.jpg";
    image.addEventListener("load", function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        drawScene();
    });

    drawScene();

    /**
     * Draws the scene.
     */
    function drawScene() {
        resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Apply matrix transformations
        let matrix = m3.projection(state.canvasWidth, state.canvasHeight);
        matrix = m3.translate(matrix, state.posX, state.posY);
        matrix = m3.rotate(matrix, state.angleInRadians);
        matrix = m3.scale(matrix, state.scaleX, state.scaleY);
        matrix = m3.translate(matrix, -50, -75);

        // Set the matrix.
        gl.uniformMatrix3fv(matrixLocation, false, matrix);
        gl.uniform1i(textureLocation, 0);

        // draw elements
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}

/**
 * Fills the buffer with the values that define a rectangle and
 * its texture.
 * Note, will put the values in whatever buffer is currently
 * bound to the ARRAY_BUFFER bind point
 * @param {WebGLRenderingContext} gl
 */
function setGeometryAndTexcoords(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // position   // texcoords
            10, 20,       0, 1,        // top left
            310, 20,      1, 1,        // top right
            10, 320,      0, 0,        // bottom left
            310, 320,     1, 0         // bottom right
        ]),
        gl.STATIC_DRAW
    );
}

/**
 * Fills the indices buffer to tell WebGL how to draw the geometry
 * @param {WebGLRenderingContext} gl
 */
function setGeometryIndices(gl) {
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array([
            0, 1,
            2, 1,
            2, 3
        ]),
        gl.STATIC_DRAW
    );
}

main();
