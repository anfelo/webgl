const canvas = document.querySelector("#c");

const gl = canvas.getContext("webgl");
if (!gl) {
    return
}
