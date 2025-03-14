export const vertexShaderSource = `
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_world_view_projection;
uniform mat4 u_world_inverse_transpose;

varying vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_world_view_projection * a_position;

  // orient the normals and pass to the fragment shader
  v_normal = mat3(u_world_inverse_transpose) * a_normal;
}`;
