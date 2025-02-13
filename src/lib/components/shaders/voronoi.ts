export const voronoi = `
// The MIT License
// Copyright © 2014 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Smooth Voronoi - avoiding aliasing, by replacing the usual min() function, which is
// discontinuous, with a smooth version. That can help preventing some aliasing, and also
// provides with more artistic control of the final procedural textures/models.

// More Voronoi shaders:
//
// Exact edges:  https://www.shadertoy.com/view/ldl3W8
// Hierarchical: https://www.shadertoy.com/view/Xll3zX
// Smooth:       https://www.shadertoy.com/view/ldB3zc
// Voronoise:    https://www.shadertoy.com/view/Xd23Dh



float hash1( float n ) { return fract(sin(n)*43758.5453); }
vec2  hash2( vec2  p ) { p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) ); return fract(sin(p)*43758.5453); }

// The parameter w controls the smoothness
vec4 voronoi( in vec2 x, float w , float t)
{
    vec2 n = floor( x );
    vec2 f = fract( x );

	vec4 m = vec4( 8.0, 0.0, 0.0, 0.0 );
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 g = vec2( float(i),float(j) );
        vec2 o = hash2( n + g );
		
		// animate
        o = 0.5 + 0.5*sin( t + 6.2831*o );

        // distance to cell		
		float d = length(g - f + o);
		
        // cell color
		vec3 col = 0.5 + 0.5*sin(hash1(dot(n+g,vec2(7.0,113.0)))*2.5 + 3.5 + vec3(2.0,3.0,0.0));
        // in linear space
        col = col*col;
        
        // do the smooth min for colors and distances		
		float h = smoothstep( -1.0, 1.0, (m.x-d)/w );
	    m.w   = mix( m.x,     d, h ) - h*(1.0-h)*w/(1.0+3.0*w); // distance
		m.xyz = mix( m.yzw, col, h ) - h*(1.0-h)*w/(1.0+3.0*w); // color
    }
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 g = vec2( float(1+i),float(1+j) );
        vec2 o = hash2( n + g );
		
		// animate
        o = 0.5 + 0.5*sin( t + 6.2831*o );

        // distance to cell		
		float d = length(g - f + o);
		
        // cell color
		vec3 col = 0.5 + 0.5*sin(hash1(dot(n+g,vec2(7.0,113.0)))*2.5 + 3.5 + vec3(2.0,3.0,0.0));
        // in linear space
        col = col*col;
        
        // do the smooth min for colors and distances		
		float h = smoothstep( -1.0, 1.0, (m.x-d)/w );
	    m.w   = mix( m.x,     d, h ) - h*(1.0-h)*w/(1.0+3.0*w); // distance
		m.xyz = mix( m.yzw, col, h ) - h*(1.0-h)*w/(1.0+3.0*w); // color
    }
	
	return m;
}`