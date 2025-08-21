import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Text3D, Center } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingMoney({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[1.5, 0.8, 0.05]} />
        <meshPhongMaterial color="#4ade80" />
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[1.2, 0.6, 0.02]} />
          <meshPhongMaterial color="#22c55e" />
        </mesh>
        {/* Dollar sign */}
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
          <meshPhongMaterial color="#065f46" />
        </mesh>
      </mesh>
    </Float>
  );
}

function FloatingCoin({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.8;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.6 + position[0]) * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 32]} />
        <meshPhongMaterial color="#f59e0b" />
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
          <meshPhongMaterial color="#92400e" />
        </mesh>
      </mesh>
    </Float>
  );
}

function Calculator() {
  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.1}>
      <mesh position={[0, 0, 0]}>
        {/* Calculator body */}
        <boxGeometry args={[2, 2.8, 0.3]} />
        <meshPhongMaterial color="#8b5cf6" />
        
        {/* Screen */}
        <mesh position={[0, 0.8, 0.16]}>
          <boxGeometry args={[1.6, 0.6, 0.02]} />
          <meshPhongMaterial color="#e0e7ff" />
        </mesh>
        
        {/* Buttons */}
        {[-0.5, 0, 0.5].map((x, i) => 
          [-0.2, -0.6, -1.0].map((y, j) => (
            <mesh key={`${i}-${j}`} position={[x, y, 0.16]}>
              <boxGeometry args={[0.3, 0.3, 0.05]} />
              <meshPhongMaterial color="#c4b5fd" />
            </mesh>
          ))
        )}
      </mesh>
    </Float>
  );
}

export default function RoyaltiesProcessing3D() {
  return (
    <div className="w-full h-80 relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
        
        <Calculator />
        
        {/* Floating money bills */}
        <FloatingMoney position={[-3, 1, -1]} scale={0.8} />
        <FloatingMoney position={[3, -0.5, 1]} scale={0.6} />
        <FloatingMoney position={[-2, -1.5, 0]} scale={0.7} />
        
        {/* Floating coins */}
        <FloatingCoin position={[-1.5, -2, -0.5]} scale={1.2} />
        <FloatingCoin position={[2.5, 1.5, -0.8]} scale={0.9} />
        <FloatingCoin position={[1, -2.5, 0.5]} scale={1.1} />
        <FloatingCoin position={[-3.5, 0.5, 1]} scale={0.8} />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}