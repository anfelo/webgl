export const fragmentShaderSource = `
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;
varying vec3 v_surface_to_light;
varying vec3 v_surface_to_view;

uniform vec4 u_color;
uniform float u_shininess;
uniform vec3 u_light_direction;
uniform float u_inner_limit;          // in dot space
uniform float u_outer_limit;          // in dot space

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  vec3 surface_to_light_direction = normalize(v_surface_to_light);
  vec3 surface_to_view_direction = normalize(v_surface_to_view);
  vec3 half_vector = normalize(surface_to_light_direction + surface_to_view_direction);

  float dot_from_direction = dot(surface_to_light_direction,
                               -u_light_direction);
  float in_light = smoothstep(u_outer_limit, u_inner_limit, dot_from_direction);
  float light = in_light * dot(normal, surface_to_light_direction);
  float specular = in_light * pow(dot(normal, half_vector), u_shininess);

  gl_FragColor = u_color;

  // Lets multiply just the color portion (not the alpha)
  // by the light
  gl_FragColor.rgb *= light;

  // Just add in the specular
  gl_FragColor.rgb += specular;
}`;
