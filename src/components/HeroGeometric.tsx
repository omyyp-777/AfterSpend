"use client";

/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-namespace */
declare module "react" {
    namespace JSX {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface IntrinsicElements extends ThreeElements { }
    }
}
/* eslint-enable @typescript-eslint/no-namespace */

// --- Shader Code for Fullscreen Background ---
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  // Position quad directly at the far plane of NDC so it always covers the full screen
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float bayerDither4x4(vec2 uv) {
    int x = int(mod(uv.x, 4.0));
    int y = int(mod(uv.y, 4.0));
    
    int matrix[16];
    matrix[0] = 0; matrix[1] = 8; matrix[2] = 2; matrix[3] = 10;
    matrix[4] = 12; matrix[5] = 4; matrix[6] = 14; matrix[7] = 6;
    matrix[8] = 3; matrix[9] = 11; matrix[10] = 1; matrix[11] = 9;
    matrix[12] = 15; matrix[13] = 7; matrix[14] = 13; matrix[15] = 5;
    
    return float(matrix[y * 4 + x]) / 16.0;
}

void main() {
    vec2 uv = vUv;
    vec2 coord = gl_FragCoord.xy;
    
    // Slow, calm noise animation
    float noise = snoise(uv * 1.5 + vec2(uTime * 0.04, uTime * 0.025)) * 0.25;
    
    // Diagonal gradient from bottom-left to top-right
    float diagonal = (uv.x + uv.y) * 0.5;
    
    // Combine for gradient - emphasize corners
    float gradient = diagonal * 1.2 + noise;
    
    // Interpolate colors based on gradient
    vec3 deepBlue = uColor1;
    vec3 paleBlue = uColor2;
    vec3 softBlue = mix(deepBlue, paleBlue, 0.33);
    vec3 lightBlue = mix(deepBlue, paleBlue, 0.66);
    
    // Map to colors with more distinct steps
    vec3 color;
    if (gradient < 0.3) {
        color = deepBlue;
    } else if (gradient < 0.55) {
        color = softBlue;
    } else if (gradient < 0.8) {
        color = lightBlue;
    } else {
        color = paleBlue;
    }
    
    // Enhanced dithering at boundaries with animated threshold
    float dither = bayerDither4x4(coord);
    float threshold = fract(gradient * 4.0);
    
    if (gradient < 0.3 && threshold > dither * 0.5) {
        color = softBlue;
    } else if (gradient >= 0.3 && gradient < 0.55 && threshold > dither * 0.5) {
        color = lightBlue;
    } else if (gradient >= 0.55 && gradient < 0.8 && threshold > dither * 0.5) {
        color = paleBlue;
    }
    
    // Softer fade to white - only at extreme bottom-left
    vec2 cornerDist = vec2(uv.x, uv.y);
    float fadeMask = smoothstep(0.0, 0.25, length(cornerDist));
    color = mix(vec3(1.0), color, fadeMask);
    
    // Add subtle vignette to emphasize corners
    float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
    color = mix(color, color * 0.95, (1.0 - vignette) * 0.3);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

const HERO_GEOMETRIC_FALLBACK_COLOR_1 = "#3B82F6";
const HERO_GEOMETRIC_FALLBACK_COLOR_2 = "#F0F9FF";
const HEX_COLOR_REGEX = /^#?[0-9a-fA-F]{6}$/;

function sanitizeHexColor(value: string, fallback: string) {
    const trimmed = value.trim();
    if (!HEX_COLOR_REGEX.test(trimmed)) return fallback;
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

const INSTANCED_PARTICLE_COUNT = 48;
const POINTS_PARTICLE_COUNT = 80;

interface InstancedDriftParticle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    rotX: number;
    rotY: number;
    rotZ: number;
    rotSpeedX: number;
    rotSpeedY: number;
    rotSpeedZ: number;
    scale: number;
}

const GradientPlane = ({
    color1,
    color2,
    speed = 0.6
}: {
    color1: string;
    color2: string;
    speed?: number
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const pointsRef = useRef<THREE.Points>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(1000, 1000) },
            uColor1: { value: new THREE.Color(HERO_GEOMETRIC_FALLBACK_COLOR_1) },
            uColor2: { value: new THREE.Color(HERO_GEOMETRIC_FALLBACK_COLOR_2) },
        }),
        []
    );

    // 1. Data for small instanced geometric particles drifting across the screen
    const instancedParticles = useMemo<InstancedDriftParticle[]>(() => {
        const list: InstancedDriftParticle[] = [];
        for (let i = 0; i < INSTANCED_PARTICLE_COUNT; i++) {
            // Distribute across screen coordinates
            const x = ((i % 8) - 3.5) * 1.15 + (Math.sin(i * 1.7) * 0.5);
            const y = ((Math.floor(i / 8) - 2.5) * 1.05) + (Math.cos(i * 2.3) * 0.4);
            const z = (Math.sin(i * 3.1) * 1.5) + 0.1; // depth in front of the shader
            list.push({
                x,
                y,
                z,
                // Gentle diagonal drift matching the shader's bottom-left to top-right gradient flow
                vx: 0.05 + (Math.sin(i * 1.3) * 0.02 + 0.02),
                vy: 0.04 + (Math.cos(i * 1.9) * 0.02 + 0.02),
                rotX: Math.random() * Math.PI,
                rotY: Math.random() * Math.PI,
                rotZ: Math.random() * Math.PI,
                rotSpeedX: (Math.sin(i) * 0.35 + 0.2) * 0.015,
                rotSpeedY: (Math.cos(i * 1.2) * 0.35 + 0.2) * 0.018,
                rotSpeedZ: (Math.sin(i * 0.8) * 0.25) * 0.012,
                scale: 0.07 + (Math.abs(Math.sin(i * 2.1)) * 0.07),
            });
        }
        return list;
    }, []);

    // 2. Data for small glowing THREE.Points drifting across the screen
    const [pointsPositions, pointsInitial] = useMemo(() => {
        const pos = new Float32Array(POINTS_PARTICLE_COUNT * 3);
        const init = new Float32Array(POINTS_PARTICLE_COUNT * 3);
        for (let i = 0; i < POINTS_PARTICLE_COUNT; i++) {
            const x = (Math.sin(i * 1.4) * 4.4) + (Math.cos(i * 0.7) * 0.4);
            const y = (Math.cos(i * 1.8) * 3.2) + (Math.sin(i * 2.1) * 0.3);
            const z = (Math.sin(i * 2.9) * 1.5);
            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
            init[i * 3] = x;
            init[i * 3 + 1] = y;
            init[i * 3 + 2] = z;
        }
        return [pos, init];
    }, []);

    // Update instance colors when theme colors change
    useEffect(() => {
        if (!instancedMeshRef.current) return;
        const c1 = new THREE.Color(sanitizeHexColor(color1, HERO_GEOMETRIC_FALLBACK_COLOR_1));
        const c2 = new THREE.Color(sanitizeHexColor(color2, HERO_GEOMETRIC_FALLBACK_COLOR_2));
        const tempColor = new THREE.Color();
        for (let i = 0; i < INSTANCED_PARTICLE_COUNT; i++) {
            tempColor.lerpColors(c1, c2, (i / INSTANCED_PARTICLE_COUNT) * 0.7 + 0.15);
            instancedMeshRef.current.setColorAt(i, tempColor);
        }
        if (instancedMeshRef.current.instanceColor) {
            instancedMeshRef.current.instanceColor.needsUpdate = true;
        }
    }, [color1, color2]);

    useFrame((state, delta) => {
        const { clock, size } = state;
        const currentElapsed = clock.getElapsedTime() * speed;

        // 1. Update gradient shader uniforms
        uniforms.uTime.value = currentElapsed;
        uniforms.uResolution.value.set(size.width, size.height);
        uniforms.uColor1.value.set(sanitizeHexColor(color1, HERO_GEOMETRIC_FALLBACK_COLOR_1));
        uniforms.uColor2.value.set(sanitizeHexColor(color2, HERO_GEOMETRIC_FALLBACK_COLOR_2));

        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = currentElapsed;
            materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
            materialRef.current.uniforms.uColor1.value.set(sanitizeHexColor(color1, HERO_GEOMETRIC_FALLBACK_COLOR_1));
            materialRef.current.uniforms.uColor2.value.set(sanitizeHexColor(color2, HERO_GEOMETRIC_FALLBACK_COLOR_2));
        }

        // 2. Animate small instanced geometric particles drifting across the screen
        if (instancedMeshRef.current) {
            const effectiveDrift = Math.min(delta, 0.1) * speed * 2.2;
            for (let i = 0; i < INSTANCED_PARTICLE_COUNT; i++) {
                const p = instancedParticles[i];
                p.x += p.vx * effectiveDrift;
                p.y += p.vy * effectiveDrift;
                p.rotX += p.rotSpeedX;
                p.rotY += p.rotSpeedY;
                p.rotZ += p.rotSpeedZ;

                // Screen boundary wrapping
                if (p.x > 4.6) p.x = -4.6;
                if (p.y > 3.4) p.y = -3.4;

                dummy.position.set(p.x, p.y, p.z);
                dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
                dummy.scale.setScalar(p.scale);
                dummy.updateMatrix();

                instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
            }
            instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        }

        // 3. Animate small THREE.Points drifting across the screen
        if (pointsRef.current) {
            const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
            if (positionAttr) {
                const arr = positionAttr.array as Float32Array;
                for (let i = 0; i < POINTS_PARTICLE_COUNT; i++) {
                    const driftX = (0.06 + (i % 4) * 0.02) * speed;
                    const driftY = (0.08 + (i % 5) * 0.02) * speed;

                    let curX = pointsInitial[i * 3] + (currentElapsed * driftX);
                    let curY = pointsInitial[i * 3 + 1] + (currentElapsed * driftY);

                    // Smooth modulo wrap inside viewport bounds
                    curX = ((curX + 4.6) % 9.2) - 4.6;
                    curY = ((curY + 3.4) % 6.8) - 3.4;

                    arr[i * 3] = curX;
                    arr[i * 3 + 1] = curY;
                    arr[i * 3 + 2] = pointsInitial[i * 3 + 2] + Math.sin(currentElapsed * 0.5 + i) * 0.12;
                }
                positionAttr.needsUpdate = true;
            }
        }
    });

    return (
        <group>
            {/* Fullscreen gradient shader plane at the back */}
            <mesh ref={meshRef} scale={[2, 2, 1]}>
                <planeGeometry args={[2, 2]} />
                <shaderMaterial
                    ref={materialRef}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent={true}
                    depthWrite={false}
                    depthTest={false}
                />
            </mesh>

            {/* Set of small, slow-moving geometric particles drifting across the screen (instanced octahedrons) */}
            <instancedMesh
                ref={instancedMeshRef}
                args={[undefined, undefined, INSTANCED_PARTICLE_COUNT]}
            >
                <octahedronGeometry args={[1, 0]} />
                <meshBasicMaterial
                    wireframe={true}
                    transparent={true}
                    opacity={0.35}
                    color="#60A5FA"
                />
            </instancedMesh>

            {/* Set of small, slow-moving geometric particles drifting across the screen (THREE.Points) */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[pointsPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#93C5FD"
                    size={0.045}
                    transparent={true}
                    opacity={0.55}
                    depthWrite={false}
                />
            </points>
        </group>
    );
};

// --- Slow-Moving Ethereal Light Trails ---

const LightTrails = ({ speed = 0.6 }: { speed?: number }) => {
    // 3 Curving flowing light ribbons
    const trailRefs = useRef<(THREE.Line | null)[]>([]);

    const trailsData = useMemo(() => {
        const segments = 40;
        return [
            { id: 1, color: "#60A5FA", yBase: -0.6, zBase: 0.3, freq: 0.7, speedMult: 0.8 },
            { id: 2, color: "#3B82F6", yBase: 0.8, zBase: -0.2, freq: 0.5, speedMult: 0.6 },
            { id: 3, color: "#818CF8", yBase: -1.8, zBase: 0.8, freq: 0.9, speedMult: 0.7 }
        ].map(trail => {
            const positions = new Float32Array(segments * 3);
            for (let i = 0; i < segments; i++) {
                const t = (i / (segments - 1)) * 2 - 1; // -1 to 1
                positions[i * 3] = t * 4.5;
                positions[i * 3 + 1] = trail.yBase + Math.sin(t * 3) * 0.4;
                positions[i * 3 + 2] = trail.zBase + Math.cos(t * 2) * 0.3;
            }
            return {
                ...trail,
                segments,
                positions
            };
        });
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime() * speed;

        trailsData.forEach((trail, tIdx) => {
            const line = trailRefs.current[tIdx];
            if (!line) return;

            const positionAttr = line.geometry.attributes.position as THREE.BufferAttribute;
            if (!positionAttr) return;

            const arr = positionAttr.array as Float32Array;
            for (let i = 0; i < trail.segments; i++) {
                const t = (i / (trail.segments - 1)) * 2 - 1; // -1 to 1
                // Dynamic gentle undulation
                const waveY = Math.sin(time * trail.speedMult + t * trail.freq * 2.8) * 0.35 +
                              Math.cos(time * 0.4 + t * 4.2) * 0.15;
                const waveZ = Math.cos(time * (trail.speedMult * 0.8) + t * 2.2) * 0.25;

                arr[i * 3] = t * 5.0; // span width
                arr[i * 3 + 1] = trail.yBase + waveY;
                arr[i * 3 + 2] = trail.zBase + waveZ;
            }
            positionAttr.needsUpdate = true;
        });
    });

    return (
        <group>
            {trailsData.map((trail, idx) => (
                <line
                    key={trail.id}
                    ref={(el) => {
                        trailRefs.current[idx] = el as unknown as THREE.Line;
                    }}
                >
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[trail.positions, 3]}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial
                        color={trail.color}
                        transparent={true}
                        opacity={0.28}
                        linewidth={1}
                        depthWrite={false}
                    />
                </line>
            ))}
        </group>
    );
};

// --- Main HeroGeometric Component ---

interface HeroGeometricProps extends React.ComponentPropsWithoutRef<"div"> {
    title1?: string;
    title2?: string;
    description?: string;
    color1?: string;
    color2?: string;
    speed?: number;
    children?: React.ReactNode;
}

const HERO_HEADLINE_CLASS =
    "pb-[0.08em] text-4xl sm:text-6xl md:text-7xl lg:text-[5.5cqi] leading-[0.98] tracking-tighter font-extrabold text-zinc-950 font-montserrat";

export default function HeroGeometric({
    title1,
    title2,
    description,
    color1 = "#3B82F6", // Default soft blue
    color2 = "#F0F9FF", // Default pale blue
    speed = 0.6,
    children,
    className,
    ...props
}: HeroGeometricProps) {
    return (
        <div
            className={cn("relative w-full min-h-[85vh] flex flex-col items-center justify-center overflow-hidden bg-white text-zinc-950 font-inter", className)}
            style={{
                containerType: "inline-size",
                ...props.style
            }}
            {...props}
        >
            {/* Background Shader & 3D Floating Geometric Elements */}
            <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
                <Canvas
                    camera={{ position: [0, 0, 4.5], fov: 50 }}
                    frameloop="always"
                    dpr={[1, 1]}
                    gl={{
                        antialias: true,
                        alpha: true,
                    }}
                >
                    {/* 1. Underlying dithered gradient shader canvas with drifting geometric particles & points */}
                    <GradientPlane color1={color1} color2={color2} speed={speed} />

                    {/* 2. Subtle slow undulating light trails */}
                    <LightTrails speed={speed} />
                </Canvas>
            </div>

            {/* Foreground Content */}
            {(title1 || title2 || description || children) && (
                <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pt-12 pb-14 md:pt-24 md:pb-24">
                    <div className="w-full max-w-[1200px] px-6 flex flex-col items-center">
                        {/* Headline */}
                        <div className="flex flex-col items-center text-center gap-2 md:gap-4 mb-6 md:mb-10">
                            {title1 && (
                                <div className="overflow-hidden">
                                    <motion.h1
                                        initial={{ y: 24, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                                        className={HERO_HEADLINE_CLASS}
                                    >
                                        {title1}
                                    </motion.h1>
                                </div>
                            )}
                            {title2 && (
                                <div className="overflow-hidden">
                                    <motion.h1
                                        initial={{ y: 24, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                                        className={cn(HERO_HEADLINE_CLASS, "text-zinc-700 text-3xl sm:text-5xl md:text-6xl lg:text-[4.2cqi]")}
                                    >
                                        {title2}
                                    </motion.h1>
                                </div>
                            )}
                        </div>

                        {/* Subheadline with Inter font */}
                        {description && (
                            <div className="max-w-[560px] text-center mb-8">
                                <motion.p
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
                                    className="text-base sm:text-lg md:text-[1.25rem] leading-relaxed text-zinc-600 font-normal font-inter"
                                >
                                    {description}
                                </motion.p>
                            </div>
                        )}

                        {/* Optional interactive actions / children */}
                        {children && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                                className="w-full flex justify-center"
                            >
                                {children}
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
