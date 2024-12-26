import * as T from 'three';
import { glsl_wave } from './Sea';
export let floatingMaterials = new Set<MeshFloatingMaterial>();
export class MeshFloatingMaterial extends T.MeshStandardMaterial {
    customUniforms: {
        reflection: { value: number },
        uTime: { value: number },
        ymin: { value: number },
        ymax: { value: number },
    }
    constructor(parameters = {
        ymin: -1.0,
        ymax: 0.0,
    }) {
        super();
        floatingMaterials.add(this);
        this.customProgramCacheKey = () => {
            return 'MeshFloatingMaterial';
        };

        // Custom uniforms that will be merged with MeshStandardMaterial's uniforms
        this.customUniforms = {
            reflection: { value: 0 },
            uTime: { value: 0 },
            ymin: { value: parameters.ymin },
            ymax: { value: parameters.ymax },
        };

        // Inject custom shader chunks
        this.onBeforeCompile = (shader) => {
            // Add custom uniforms
            shader.uniforms.reflection = this.customUniforms.reflection;
            shader.uniforms.uTime = this.customUniforms.uTime;
            shader.uniforms.ymin = this.customUniforms.ymin;
            shader.uniforms.ymax = this.customUniforms.ymax;

            // Add varying for world position
            shader.vertexShader = /*glsl*/`
                // #include <instanced_pars_vertex>
                varying vec3 vWorldPosition;
                uniform float reflection;
                uniform float uTime;
                ${shader.vertexShader}
            `;
            shader.vertexShader = shader.vertexShader.replace(
                /*glsl*/`#include <common>`,
                /*glsl*/`
                #include <common>
                ${glsl_wave()}
                `
            );

            // // Inject world position calculation in vertex shader
            // shader.vertexShader = shader.vertexShader.replace(
            //     /*glsl*/`#include <begin_vertex>`,
            //     /*glsl*/`
            //     #include <begin_vertex>  


            //     `
            // );
            shader.vertexShader = shader.vertexShader.replace(
                /*glsl*/`#include <project_vertex>`,
                /*glsl*/`
                // #include <instanced_vertex>
                vec4 mvPosition = vec4( transformed, 1.0 );
                #ifdef USE_BATCHING
                    mvPosition = batchingMatrix * mvPosition;
                #endif
                #ifdef USE_INSTANCING
                    mvPosition = instanceMatrix * mvPosition;
                #endif
                #ifdef USE_INSTANCING_INDIRECT
                    mvPosition = instanceMatrix * mvPosition;
          		#endif
                 
                vWorldPosition = (modelMatrix * mvPosition).xyz;
                if(reflection==1.0){
                    float h=glsl_wave(vWorldPosition, uTime);
                    vWorldPosition.y+=h*2.0;
                }
                mvPosition = viewMatrix * vec4(vWorldPosition, 1.0);
                
                gl_Position = projectionMatrix * mvPosition;

                `
            );
            shader.fragmentShader = /*glsl*/`
                varying vec3 vWorldPosition;
                uniform float reflection;
                uniform float ymin;
                uniform float ymax;
                uniform float uTime;
                ${shader.fragmentShader}
            `;
            shader.fragmentShader = shader.fragmentShader.replace(
                /*glsl*/`#include <common>`,
                /*glsl*/`
                #include <common>
                ${glsl_wave()}
                `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                /*glsl*/`#include <dithering_fragment>`,
                /*glsl*/`
                #include <dithering_fragment>
                float h = glsl_wave(vWorldPosition, uTime);
                // gl_FragColor.rgb *= clamp((vWorldPosition.y-ymin)/(ymax-ymin), 0.0, 1.0);
                // gl_FragColor.rgb = vec3((vWorldPosition.y+2.0)/4.0);
                if(reflection==0.0){
                    // gl_FragColor.r *= 1.5;
                    if(vWorldPosition.y<h) discard;
                    // gl_FragColor.rgb *= vec3(0.0,0.2,0.8);
                }else{
                    // gl_FragColor.b *= 1.5;
                    // if(vWorldPosition.y>h) discard;
                }
                `
            );
        };
        this.onBeforeRender = (renderer, scene, camera) => {
            this.customUniforms.uTime.value += 10 / 60;
        };
    }

    onBeforeReflection() {
        this.customUniforms.reflection.value = 1.0;
    }
    onAfterReflection() {
        this.customUniforms.reflection.value = 0.0;
    }

    // Getter/setter methods for easy property modification
    set ymin(value) {
        this.customUniforms.ymin.value = value;
    }

    get ymin() {
        return this.customUniforms.ymin.value;
    }

    set ymax(value) {
        this.customUniforms.ymax.value = value;
    }

    get ymax() {
        return this.customUniforms.ymax.value;
    }
}       