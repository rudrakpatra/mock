import * as T from 'three';
export const glsl_wave = () => {
    return /*glsl*/`
    highp float hash( const in vec2 uv ) {
        const highp float a = 12.9898, b = 78.233, c = 43758.5453;
        highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, 3.141592653589793);
        return fract( sin( sn ) * c );
    }
    float noise( in vec2 p )
    {
        vec2 i = floor( p );
        vec2 f = fract( p );
        vec2 u = f*f*(3.0-2.0*f);  
        return mix( mix( hash( i + vec2(0.0,0.0) ), 
                    hash( i + vec2(1.0,0.0) ), u.x),
                    mix( hash( i + vec2(0.0,1.0) ), 
                    hash( i + vec2(1.0,1.0) ), u.x), u.y);
    }
    float glsl_wave(vec3 position, float time) {
        float t = time;
        vec2 uv = position.xz * 0.05;
        float f = 0.0;
        mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
        uv += vec2( 0.001, 0.005 )*t;
        uv = m*uv;
        f  = 0.5000*noise( uv );
        uv += vec2( 0.004, 0.004 )*t;
        uv = m*uv;
        f += 0.2500*noise( uv );
        uv += vec2( 0.001 ,0.001 )*t;
        uv = m*uv;
        f += 0.1250*noise( uv );
        uv += vec2( -0.001, -0.002 )*t;
        uv = m*uv;
        f += 0.0625*noise( uv ); 
        return f*2.0-1.0;
    }
    // Calculate normal at point by calculating the height at the pos and 2 additional points very close to pos
    vec3 glsl_wave_normal(vec3 position, float time, float e) {
       //sample height at neightbouring points
        float depth = 1.0;
        vec2 ex = vec2(e, 0);
        float h=glsl_wave(position,time) * depth;
        vec3 a = vec3(position.x, h, position.z);
        return normalize(
            cross(
                a - vec3(position.x - e, glsl_wave(position - ex.xxy,time) * depth, position.z), 
                a - vec3(position.x, glsl_wave(position + ex.yyx,time) * depth, position.z + e)
            )
        );
    }
    `;
}