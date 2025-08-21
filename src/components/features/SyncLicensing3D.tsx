import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingFilmStrip({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.15;
    }
  });

  return (
    <Float speed={1.3} rotationIntensity={0.4} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Film strip body */}
        <boxGeometry args={[2, 0.6, 0.02]} />
        <meshPhongMaterial color="#1f2937" />
        
        {/* Film holes */}
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
          <mesh key={`top-${i}`} position={[x, 0.2, 0.012]}>
            <boxGeometry args={[0.1, 0.08, 0.005]} />
            <meshPhongMaterial color="#000000" />
          </mesh>
        ))}
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
          <mesh key={`bottom-${i}`} position={[x, -0.2, 0.012]}>
            <boxGeometry args={[0.1, 0.08, 0.005]} />
            <meshPhongMaterial color="#000000" />
          </mesh>
        ))}
        
        {/* Film frames */}
        {[-0.5, 0, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.012]}>
            <boxGeometry args={[0.25, 0.2, 0.005]} />
            <meshPhongMaterial color="#4b5563" />
          </mesh>
        ))}
      </mesh>
    </Float>
  );
}

function FloatingMusicNote({ position, scale = 1, color = "#f59e0b" }: { position: [number, number, number], scale?: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.6 + position[0]) * 0.3;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.9 + position[0]) * 0.12;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Note head */}
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshPhongMaterial color={color} />
        
        {/* Note stem */}
        <mesh position={[0.12, 0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
          <meshPhongMaterial color={color} />
        </mesh>
        
        {/* Note flag */}
        <mesh position={[0.25, 0.6, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.2, 0.3, 0.02]} />
          <meshPhongMaterial color={color} />
        </mesh>
      </mesh>
    </Float>
  );
}

function FloatingContract({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1.0} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Contract page */}
        <boxGeometry args={[0.8, 1.2, 0.02]} />
        <meshPhongMaterial color="#f9fafb" />
        
        {/* Header */}
        <mesh position={[0, 0.45, 0.012]}>
          <boxGeometry args={[0.6, 0.08, 0.005]} />
          <meshPhongMaterial color="#dc2626" />
        </mesh>
        
        {/* Content lines */}
        {[0.25, 0.1, -0.05, -0.2, -0.35].map((y, i) => (
          <mesh key={i} position={[0, y, 0.012]}>
            <boxGeometry args={[0.6, 0.02, 0.005]} />
            <meshPhongMaterial color="#9ca3af" />
          </mesh>
        ))}
        
        {/* Signature line */}
        <mesh position={[0, -0.5, 0.012]}>
          <boxGeometry args={[0.5, 0.02, 0.005]} />
          <meshPhongMaterial color="#3b82f6" />
        </mesh>
      </mesh>
    </Float>
  );
}

function MediaCenter() {
  return (
    <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.05}>
      <mesh position={[0, 0, 0]}>
        {/* Main screen */}
        <boxGeometry args={[3, 2, 0.2]} />
        <meshPhongMaterial color="#1e293b" />
        
        {/* Screen bezel */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[2.8, 1.8, 0.02]} />
          <meshPhongMaterial color="#0f172a" />
        </mesh>
        
        {/* Play button */}
        <mesh position={[0, 0, 0.13]}>
          <coneGeometry args={[0.3, 0.4, 3]} />
          <meshPhongMaterial color="#ef4444" />
        </mesh>
        
        {/* Control buttons */}
        {[-0.8, -0.4, 0.4, 0.8].map((x, i) => (
          <mesh key={i} position={[x, -0.6, 0.13]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshPhongMaterial color="#64748b" />
          </mesh>
        ))}
      </mesh>
    </Float>
  );
}

export default function SyncLicensing3D() {
  return (
    <div className="w-full h-80 relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ef4444" />
        
        <MediaCenter />
        
        {/* Floating film strips */}
        <FloatingFilmStrip position={[-3.5, 0.8, -1]} scale={0.7} />
        <FloatingFilmStrip position={[3, -0.5, 0.8]} scale={0.8} />
        <FloatingFilmStrip position={[-2, -2, 1]} scale={0.6} />
        
        {/* Floating music notes */}
        <FloatingMusicNote position={[-2.8, 1.8, 0]} scale={0.8} color="#f59e0b" />
        <FloatingMusicNote position={[3.5, 1.2, -0.5]} scale={0.7} color="#eab308" />
        <FloatingMusicNote position={[1.5, -2.5, 0.8]} scale={0.9} color="#facc15" />
        <FloatingMusicNote position={[-3.2, -1, 0.5]} scale={0.6} color="#fbbf24" />
        
        {/* Floating contracts */}
        <FloatingContract position={[4, 0.2, 0]} scale={0.8} />
        <FloatingContract position={[-1.8, 2.2, -1]} scale={0.7} />
        <FloatingContract position={[2.5, -1.8, 1]} scale={0.6} />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
    </div>
  );
}