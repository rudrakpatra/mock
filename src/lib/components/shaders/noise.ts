export const os2NoiseWithDerivatives_ImproveXY = `
// CC0 license https://creativecommons.org/share-your-work/public-domain/cc0/

//////////////////// 3D OpenSimplex2S noise with derivatives  ////////////////////
//////////////////// Output: vec4(dF/dx, dF/dy, dF/dz, value) ////////////////////

// Permutation polynomial hash credit Stefan Gustavson
vec4 permute(vec4 t) {
    return t * (t * 34.0 + 133.0);
}

// Gradient set is a normalized expanded rhombic dodecahedron
vec3 grad(float hash) {
    
    // Random vertex of a cube, +/- 1 each
    vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
    
    // Random edge of the three edges connected to that vertex
    // Also a cuboctahedral vertex
    // And corresponds to the face of its dual, the rhombic dodecahedron
    vec3 cuboct = cube;
    cuboct[int(hash / 16.0)] = 0.0;
    
    // In a funky way, pick one of the four points on the rhombic face
    float type = mod(floor(hash / 8.0), 2.0);
    vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
    
    // Expand it so that the new edges are the same length
    // as the existing ones
    vec3 grad = cuboct * 1.22474487139 + rhomb;
    
    // To make all gradients the same length, we only need to shorten the
    // second type of vector. We also put in the whole noise scale constant.
    // The compiler should reduce it into the existing floats. I think.
    grad *= (1.0 - 0.042942436724648037 * type) * 3.5946317686139184;
    
    return grad;
}

// BCC lattice split up into 2 cube lattices
vec4 os2NoiseWithDerivativesPart(vec3 X) {
    vec3 b = floor(X);
    vec4 i4 = vec4(X - b, 2.5);
    
    // Pick between each pair of oppposite corners in the cube.
    vec3 v1 = b + floor(dot(i4, vec4(.25)));
    vec3 v2 = b + vec3(1, 0, 0) + vec3(-1, 1, 1) * floor(dot(i4, vec4(-.25, .25, .25, .35)));
    vec3 v3 = b + vec3(0, 1, 0) + vec3(1, -1, 1) * floor(dot(i4, vec4(.25, -.25, .25, .35)));
    vec3 v4 = b + vec3(0, 0, 1) + vec3(1, 1, -1) * floor(dot(i4, vec4(.25, .25, -.25, .35)));
    
    // Gradient hashes for the four vertices in this half-lattice.
    vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
    hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
    hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);
    
    // Gradient extrapolations & kernel function
    vec3 d1 = X - v1; vec3 d2 = X - v2; vec3 d3 = X - v3; vec3 d4 = X - v4;
    vec4 a = max(0.75 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
    vec4 aa = a * a; vec4 aaaa = aa * aa;
    vec3 g1 = grad(hashes.x); vec3 g2 = grad(hashes.y);
    vec3 g3 = grad(hashes.z); vec3 g4 = grad(hashes.w);
    vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
    
    // Derivatives of the noise
    vec3 derivative = -8.0 * mat4x3(d1, d2, d3, d4) * (aa * a * extrapolations)
        + mat4x3(g1, g2, g3, g4) * aaaa;
    
    // Return it all as a vec4
    return vec4(derivative, dot(aaaa, extrapolations));
}

// Rotates domain, but preserve shape. Hides grid better in cardinal slices.
// Good for texturing 3D objects with lots of flat parts along cardinal planes.
vec4 os2NoiseWithDerivatives_Fallback(vec3 X) {
    X = dot(X, vec3(2.0/3.0)) - X;
    
    vec4 result = os2NoiseWithDerivativesPart(X) + os2NoiseWithDerivativesPart(X + 144.5);
    
    return vec4(dot(result.xyz, vec3(2.0/3.0)) - result.xyz, result.w);
}

// Gives X and Y a triangular alignment, and lets Z move up the main diagonal.
// Might be good for terrain, or a time varying X/Y plane. Z repeats.
vec4 os2NoiseWithDerivatives_ImproveXY(vec3 X) {
    
    // Not a skew transform.
    mat3 orthonormalMap = mat3(
        0.788675134594813, -0.211324865405187, -0.577350269189626,
        -0.211324865405187, 0.788675134594813, -0.577350269189626,
        0.577350269189626, 0.577350269189626, 0.577350269189626);
    
    X = orthonormalMap * X;
    vec4 result = os2NoiseWithDerivativesPart(X) + os2NoiseWithDerivativesPart(X + 144.5);
    
    return vec4(result.xyz * orthonormalMap, result.w);
}

//////////////////////////////// End noise code ////////////////////////////////`

export const noisefbm = `
// original -> https://www.shadertoy.com/view/Ws23RD

float sixth = 0.1666666666666667;
float third = 0.3333333333333333;

vec4 permute (vec4 v) { return mod((v * 34.0 + 1.0) * v, 289.0); }
vec4 taylor (vec4 v) { return 1.79284291400159 - v * 0.85373472095314; }

vec4 noise (vec3 v) {

    vec3 i  = floor(v + dot(v, vec3(third)));
    vec3 p1 = v - i + dot(i, vec3(sixth));

    vec3 g = step(p1.yzx, p1.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 p2 = p1 - i1 + sixth;
    vec3 p3 = p1 - i2 + third;
    vec3 p4 = p1 - 0.5;
    
    vec4 ix = i.x + vec4(0.0, i1.x, i2.x, 1.0);
    vec4 iy = i.y + vec4(0.0, i1.y, i2.y, 1.0);
    vec4 iz = i.z + vec4(0.0, i1.z, i2.z, 1.0);

    vec4 p = permute(permute(permute(iz)+iy)+ix);

    vec4 r = mod(p, 49.0);

    vec4 x_ = floor(r / 7.0);
    vec4 y_ = floor(r - 7.0 * x_); 

    vec4 x = (x_ * 2.0 + 0.5) / 7.0 - 1.0;
    vec4 y = (y_ * 2.0 + 0.5) / 7.0 - 1.0;

    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 g1 = vec3(a0.xy, h.x);
    vec3 g2 = vec3(a0.zw, h.y);
    vec3 g3 = vec3(a1.xy, h.z);
    vec3 g4 = vec3(a1.zw, h.w);

    vec4 n = taylor(vec4(dot(g1,g1),dot(g2,g2),dot(g3,g3),dot(g4,g4)));    

    vec3 n1 = g1 * n.x;
    vec3 n2 = g2 * n.y;
    vec3 n3 = g3 * n.z;
    vec3 n4 = g4 * n.w;

    vec4 m = vec4(dot(p1,p1),dot(p2,p2),dot(p3,p3),dot(p4,p4));
    
    vec4 m1 = max(0.6 - m, 0.0);
    vec4 m2 = m1 * m1;
    vec4 m3 = m2 * m1;
    vec4 m4 = m2 * m2;
    
    vec3 q1 = -6.0 * m3.x * p1 * dot(p1, n1) + m4.x * n1;
    vec3 q2 = -6.0 * m3.y * p2 * dot(p2, n2) + m4.y * n2;
    vec3 q3 = -6.0 * m3.z * p3 * dot(p3, n3) + m4.z * n3;
    vec3 q4 = -6.0 * m3.w * p4 * dot(p4, n4) + m4.w * n4;
     
    vec3 q = q1+q2+q3+q4;
    
    vec4 t = vec4(dot(p1,n1),dot(p2,n2),dot(p3,n3),dot(p4,n4));
    
    return (42.0 * vec4(q, dot(m4, t)));
    
}
vec4 noisefbm (vec3 v, int octaves) {

    vec4 signal = vec4(0.0);
    float factor = 0.0;    
    float scale = 0.5;

    for (int i = 0; i < octaves; i++){
        vec4 s = noise(v) * 0.5 + 0.5; // map from -1...1 to 0...1
        signal += s * scale;
        factor += scale;
        v *= 2.0;
        scale *= 0.5;
    }

    return signal / factor;

}`;