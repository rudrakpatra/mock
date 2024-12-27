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
        float t = time * 5.0;
        vec2 uv = position.xz * 0.5;
        float f = 0.0;
        mat2 m = mat2( 1.6,  0.4, -0.4 ,1.6 );
        uv += vec2( -0.001, -0.003 )*t;
        uv = m*uv;
        f  = 0.523*noise( uv );
        uv += vec2( -0.005, 0.004 )*t;
        uv = m*uv;
        f += 0.440*noise( uv );
        uv += vec2( -0.005 ,0.022 )*t;
        uv = m*uv;
        f += 0.345*noise( uv ); 
        uv += vec2( 0.02, -0.01 )*t;
        uv = m*uv;
        f += 0.225*noise( uv ); 
        uv += vec2( -0.004, 0.05 )*t;
        uv = m*uv;
        f += 0.125*noise( uv ); 
        return f*2.0-1.0;
    }
    // Calculate normal at point by calculating the height at the pos and 2 additional points very close to pos
    vec3 glsl_wave_normal(vec3 position, float time, float e) {
       //sample height at neightbouring points
        float depth = 0.2;
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

export const js_wave = () => {
    const fract = (x: number) => { return x - Math.floor(x); }
    const mix = (a: number, b: number, x: number) => { return a + x * (b - a); }
    const hash = (x: number, y: number) => {
        const a = 12.9898, b = 78.233, c = 43758.5453;
        const dt = x * a + y * b;
        const sn = dt % 3.141592653589793;
        return fract(Math.sin(sn) * c);
    }
    const noise = (x: number, y: number) => {
        const i = {
            x: Math.floor(x),
            y: Math.floor(y)
        }
        const f = {
            x: fract(x),
            y: fract(y)
        }
        const u = {
            x: f.x * f.x * (3.0 - 2.0 * f.x),
            y: f.y * f.y * (3.0 - 2.0 * f.y)
        };
        return mix(mix(hash(i.x + 0.0, i.y + 0.0), hash(i.x + 1.0, i.y + 0.0), u.x),
            mix(hash(i.x + 0.0, i.y + 1.0), hash(i.x + 1.0, i.y + 1.0), u.x), u.y);
    }
    const js_wave = (pos: T.Vector3, time: number) => {
        const t = time;
        const uv = {
            x: pos.x * 0.05,
            y: pos.z * 0.05
        }
        let f = 0.0;
        const m = [
            [1.6, 1.2],
            [-1.2, 1.6]
        ];
        uv.x += 0.001 * t;
        uv.y += 0.005 * t;
        uv.x = m[0][0] * uv.x + m[0][1] * uv.y;
        uv.y = m[1][0] * uv.x + m[1][1] * uv.y;
        f += 0.5000 * noise(uv.x, uv.y);
        uv.x += 0.004 * t;
        uv.y += 0.004 * t;
        uv.x = m[0][0] * uv.x + m[0][1] * uv.y;
        uv.y = m[1][0] * uv.x + m[1][1] * uv.y;
        f += 0.2500 * noise(uv.x, uv.y);
        uv.x += 0.001 * t;
        uv.y += 0.001 * t;
        uv.x = m[0][0] * uv.x + m[0][1] * uv.y;
        uv.y = m[1][0] * uv.x + m[1][1] * uv.y;
        f += 0.1250 * noise(uv.x, uv.y);
        uv.x += -0.001 * t;
        uv.y += -0.002 * t;
        uv.x = m[0][0] * uv.x + m[0][1] * uv.y;
        uv.y = m[1][0] * uv.x + m[1][1] * uv.y;
        f += 0.0625 * noise(uv.x, uv.y);
        return f * 2.0 - 1.0;
    }
    return js_wave;
}