import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Text } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingChart({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.15;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Chart background */}
        <boxGeometry args={[2, 1.5, 0.1]} />
        <meshPhongMaterial color="#e0e7ff" />
        
        {/* Chart bars */}
        {[0.4, 0.7, 0.5, 0.9, 0.6].map((height, i) => (
          <mesh key={i} position={[-0.6 + i * 0.3, -0.4 + height * 0.4, 0.06]}>
            <boxGeometry args={[0.15, height, 0.05]} />
            <meshPhongMaterial color="#8b5cf6" />
          </mesh>
        ))}
        
        {/* Trending line */}
        <mesh position={[0, 0, 0.08]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[1.5, 0.05, 0.02]} />
          <meshPhongMaterial color="#10b981" />
        </mesh>
      </mesh>
    </Float>
  );
}

function TrendingArrow({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.5) * 0.1 + 0.3;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.8 + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale} rotation={[0, 0, 0.3]}>
        {/* Arrow shaft */}
        <boxGeometry args={[1.5, 0.1, 0.1]} />
        <meshPhongMaterial color="#10b981" />
        
        {/* Arrow head */}
        <mesh position={[0.8, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 3]} />
          <meshPhongMaterial color="#059669" />
        </mesh>
      </mesh>
    </Float>
  );
}

function AnalyticsDisplay() {
  return (
    <Float speed={0.6} rotationIntensity={0.15} floatIntensity={0.1}>
      <mesh position={[0, 0, 0]}>
        {/* Main screen */}
        <boxGeometry args={[3, 2, 0.2]} />
        <meshPhongMaterial color="#1e1b4b" />
        
        {/* Screen glow */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[2.8, 1.8, 0.02]} />
          <meshPhongMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={0.2} />
        </mesh>
        
        {/* Value display */}
        <mesh position={[0, 0.4, 0.12]}>
          <boxGeometry args={[2, 0.4, 0.01]} />
          <meshPhongMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
        </mesh>
      </mesh>
    </Float>
  );
}

export default function CatalogValuation3D() {
  return (
    <div className="w-full h-80 relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#10b981" />
        
        <AnalyticsDisplay />
        
        {/* Floating charts */}
        <FloatingChart position={[-3, 0.5, -1]} scale={0.7} />
        <FloatingChart position={[3.5, -0.8, 0.5]} scale={0.6} />
        <FloatingChart position={[-2.5, -1.8, 1]} scale={0.5} />
        
        {/* Trending arrows */}
        <TrendingArrow position={[2, 2, -0.5]} scale={0.8} />
        <TrendingArrow position={[-3.5, 1.5, 0]} scale={0.6} />
        <TrendingArrow position={[1.5, -2.5, 1]} scale={0.9} />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
}