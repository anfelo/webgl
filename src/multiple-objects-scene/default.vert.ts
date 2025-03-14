export const vertexShaderSource = `
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
