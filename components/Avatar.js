'use client';

import { Suspense, Component, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

class AvatarErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('Avatar render failed:', error, info);
    }

    render() {
        if (this.state.hasError) {
            const msg = this.state.error?.message || String(this.state.error || 'unknown error');
            return (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '14px',
                        textAlign: 'center',
                        padding: '20px',
                        gap: '8px',
                    }}
                >
                    <div>Avatar failed to load. The conversation will still work.</div>
                    <div style={{ fontSize: '11px', opacity: 0.5, maxWidth: '600px', wordBreak: 'break-word' }}>
                        {msg}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function AvatarModel({ isListening, isSpeaking, audioData }) {
    const group = useRef();
    // Local avatar with mouthOpen morph for lipsync (served from public/Asset/).
    // Original ReadyPlayerMe URL is no longer reachable (proxy fetch returns 502),
    // and the larger avatar.glb has no morph targets at all.
    const avatarUrl = '/Asset/fahad_2.glb';
    const { scene } = useGLTF(avatarUrl);
    const [bones, setBones] = useState({});

    // Find and store important bones and viseme mesh
    useEffect(() => {
        const foundBones = {};
        let visemeMesh = null;

        scene.traverse((child) => {
            // Find bones
            if (child.isBone) {
                const name = child.name.toLowerCase();

                // Find arm bones
                if ((name.includes('arm') || name.includes('shoulder')) && !name.includes('fore') && !name.includes('up')) {
                    if (name.includes('left')) {
                        foundBones.leftArm = child;
                    } else if (name.includes('right')) {
                        foundBones.rightArm = child;
                    }
                }

                // Find head
                if (name.includes('head')) {
                    foundBones.head = child;
                }

                // Find jaw bone for mouth animation
                if (name.includes('jaw') || name.includes('chin') || name.includes('mouth')) {
                    foundBones.jaw = child;
                    console.log('🦴 JAW BONE FOUND:', child.name);
                }
            }

            // Find mesh with morph targets - CHECK ALL MESHES
            if (child.isMesh && child.morphTargetDictionary) {
                const dict = child.morphTargetDictionary;

                console.log('👄 MESH WITH MORPHS:', child.name);
                console.log('   Total morphs:', Object.keys(dict).length);
                console.log('   ALL MORPHS:', Object.keys(dict));

                // Search for ReadyPlayerMe and MetaPerson visemes
                // ReadyPlayerMe uses: viseme_sil, viseme_PP, viseme_FF, etc.
                const visemeNames = ['sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U', 'ih', 'oh', 'ou'];
                const foundVisemes = [];

                visemeNames.forEach(name => {
                    const variations = [
                        `viseme_${name}`,        // 'viseme_aa' (ReadyPlayerMe standard)
                        name,                    // 'aa'
                        name.toLowerCase(),      // 'aa' (already lowercase)
                        name.toUpperCase(),      // 'AA'
                        `viseme_${name.toLowerCase()}`,
                        `viseme_${name.toUpperCase()}`,
                    ];

                    variations.forEach(variant => {
                        if (dict[variant] !== undefined) {
                            foundVisemes.push(`${name} -> ${variant} (index ${dict[variant]})`);
                        }
                    });
                });

                // Accept the mesh for lipsync if it has either Oculus visemes
                // (preferred) OR a generic mouthOpen morph as a fallback.
                const hasMouthMorph =
                    dict['mouthOpen'] !== undefined ||
                    dict['MouthOpen'] !== undefined ||
                    dict['mouth_open'] !== undefined;

                if (foundVisemes.length > 0 || hasMouthMorph) {
                    if (foundVisemes.length > 0) console.log('🎯 VISEMES FOUND:', foundVisemes);
                    if (hasMouthMorph) console.log('🎯 mouthOpen morph found on', child.name);
                    if (!visemeMesh || child.name.includes('Head') || child.name.includes('Face')) {
                        visemeMesh = child;
                        console.log('✅ USING MESH FOR LIP SYNC:', child.name);
                    }
                } else {
                    console.log('⚠️ NO VISEMES in', child.name);
                }
            }
        });

        console.log('🦴 Bones found:', Object.keys(foundBones));

        // Store the viseme mesh for lip sync
        foundBones.visemeMesh = visemeMesh;

        if (visemeMesh) {
            console.log('✅ FINAL VISEME MESH SELECTED:', visemeMesh.name);
        } else {
            console.log('❌ NO VISEME MESH FOUND - Lip sync will not work');
            console.log('💡 Try using ReadyPlayerMe with visemes enabled, or use jaw bone animation');
        }

        setBones(foundBones);

    }, [scene]);

    // Force pose every frame
    useFrame((state) => {
        // Breathing
        if (group.current) {
            group.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.01;
        }

        // Force arms down to natural resting position
        // These rotation values position the arms at the avatar's sides
        if (bones.leftArm) {
            bones.leftArm.rotation.set(0, 0, 0);
            bones.leftArm.rotation.z = -6.3; // Rotate arm downward (Z-axis rotation)
            bones.leftArm.rotation.x = 1.4;  // Slight forward tilt (X-axis rotation)
        }
        if (bones.rightArm) {
            bones.rightArm.rotation.set(0, 0, 0);
            bones.rightArm.rotation.z = -6.3; // Rotate arm downward (Z-axis rotation)
            bones.rightArm.rotation.x = 1.4;  // Slight forward tilt (X-axis rotation)
        }

        // Head animation when listening
        if (bones.head && isListening) {
            bones.head.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }

        // Lip sync animation - Try viseme morphs first, then jaw bone, then head scale
        if (isSpeaking && audioData > 0) {
            const intensity = audioData / 255;
            let animationApplied = false;

            // Debug logging (only log occasionally to avoid spam)
            if (Math.random() < 0.01) { // Log ~1% of frames
                console.log('🎙️ LIP SYNC DEBUG:', {
                    isSpeaking,
                    audioData,
                    intensity,
                    hasVisemeMesh: !!bones.visemeMesh,
                    hasJaw: !!bones.jaw,
                    hasHead: !!bones.head
                });
            }

            // Method 1: Viseme morph targets (best quality)
            if (bones.visemeMesh && bones.visemeMesh.morphTargetDictionary) {
                const dict = bones.visemeMesh.morphTargetDictionary;
                const influences = bones.visemeMesh.morphTargetInfluences;

                // Try to find mouth open visemes
                const mouthOpenIndex =
                    dict['viseme_aa'] ??
                    dict['viseme_AA'] ??
                    dict['aa'] ??
                    dict['AA'] ??
                    dict['mouthOpen'];

                if (mouthOpenIndex !== undefined) {
                    // Drive mouthOpen by audio amplitude. Curve the intensity so
                    // quiet sounds don't pop the mouth all the way open and loud
                    // sounds reach a believable max.
                    const curved = Math.pow(intensity, 0.7);
                    influences[mouthOpenIndex] = THREE.MathUtils.lerp(
                        influences[mouthOpenIndex] || 0,
                        Math.min(curved * 1.15, 1.0),
                        0.7
                    );
                    animationApplied = true;
                }

                // Mix a touch of mouthSmile that fluctuates with audio so the
                // mouth shape varies between rounded ("o") and wider ("ee")
                // instead of just opening and closing on the same axis.
                const mouthSmileIndex =
                    dict['mouthSmile'] ??
                    dict['viseme_E'] ??
                    dict['viseme_I'];
                if (mouthSmileIndex !== undefined) {
                    const wobble = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 7);
                    const target = intensity * 0.35 * wobble;
                    influences[mouthSmileIndex] = THREE.MathUtils.lerp(
                        influences[mouthSmileIndex] || 0,
                        target,
                        0.5
                    );
                }
            }

            // Method 2: Jaw bone rotation (fallback)
            if (!animationApplied && bones.jaw) {
                const maxJawRotation = 0.5;  // Moderate jaw opening for natural movement
                const targetRotation = intensity * maxJawRotation;
                bones.jaw.rotation.x = THREE.MathUtils.lerp(
                    bones.jaw.rotation.x || 0,
                    targetRotation,
                    0.6  // Faster response
                );
                animationApplied = true;
            }

            // Method 3: Head scale animation (last resort)
            if (!animationApplied && bones.head) {
                // Subtle scale change for natural movement
                const targetScale = 1 + (intensity * 0.12);  // Reduced to 12% for subtler movement
                bones.head.scale.y = THREE.MathUtils.lerp(
                    bones.head.scale.y || 1,
                    targetScale,
                    0.6  // Faster response
                );
            }
        } else {
            // Reset to closed mouth
            if (bones.visemeMesh && bones.visemeMesh.morphTargetInfluences) {
                const influences = bones.visemeMesh.morphTargetInfluences;
                for (let i = 0; i < influences.length; i++) {
                    influences[i] = THREE.MathUtils.lerp(influences[i] || 0, 0, 0.2);
                }
            }
            if (bones.jaw) {
                bones.jaw.rotation.x = THREE.MathUtils.lerp(
                    bones.jaw.rotation.x || 0,
                    0,
                    0.2
                );
            }
            if (bones.head) {
                bones.head.scale.y = THREE.MathUtils.lerp(
                    bones.head.scale.y || 1,
                    1,
                    0.2
                );
            }
        }

        // Reset head rotation when not listening
        if (!isListening && bones.head) {
            bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x || 0, 0, 0.1);
        }
    });

    return (
        <group ref={group}>
            <primitive object={scene} scale={2.5} position={[0, -2.8, 0]} />
        </group>
    );
}

export default function Avatar({ isListening, isSpeaking, audioData }) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <AvatarErrorBoundary>
                <Canvas
                    camera={{ position: [0, 1.3, 2], fov: 45 }}
                    style={{ background: 'transparent' }}
                    onCreated={({ gl }) => {
                        gl.domElement.addEventListener('webglcontextlost', (e) => {
                            e.preventDefault();
                            console.warn('WebGL context lost');
                        });
                    }}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                    <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />

                    <Suspense fallback={null}>
                        <AvatarModel
                            isListening={isListening}
                            isSpeaking={isSpeaking}
                            audioData={audioData}
                        />
                        <Environment preset="city" />
                    </Suspense>

                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        minDistance={1.5}
                        maxDistance={4}
                        target={[0, 1.3, 0]}
                    />
                </Canvas>
            </AvatarErrorBoundary>

            {/* Status indicator - Minimal */}
            {(isListening || isSpeaking) && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '8px 16px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '20px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isSpeaking ? '#10b981' : '#6366f1',
                        boxShadow: `0 0 10px ${isSpeaking ? '#10b981' : '#6366f1'}`
                    }} />
                    {isSpeaking ? 'Speaking...' : 'Listening...'}
                </div>
            )}
        </div>
    );
}
