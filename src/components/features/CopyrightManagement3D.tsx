import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Text } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingCertificate({ position, scale = 1, color = "#fbbf24" }: { position: [number, number, number], scale?: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.12;
    }
  });

  return (
    <Float speed={1.1} rotationIntensity={0.4} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Certificate body */}
        <boxGeometry args={[1.2, 0.8, 0.02]} />
        <meshPhongMaterial color={color} />
        
        {/* Copyright symbol */}
        <mesh position={[0, 0.2, 0.012]}>
          <torusGeometry args={[0.12, 0.03, 8, 16]} />
          <meshPhongMaterial color="#dc2626" />
        </mesh>
        
        {/* Copyright "C" */}
        <mesh position={[0, 0.2, 0.015]}>
          <boxGeometry args={[0.08, 0.02, 0.005]} />
          <meshPhongMaterial color="#dc2626" />
        </mesh>
        
        {/* Certificate lines */}
        {[-0.1, -0.25].map((y, i) => (
          <mesh key={i} position={[0, y, 0.012]}>
            <boxGeometry args={[0.8, 0.02, 0.005]} />
            <meshPhongMaterial color="#92400e" />
          </mesh>
        ))}
      </mesh>
    </Float>
  );
}

function FloatingShield({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.4 + position[0]) * 0.1;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.7 + position[0]) * 0.15;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Shield body */}
        <cylinderGeometry args={[0.5, 0.3, 0.8, 6]} />
        <meshPhongMaterial color="#10b981" />
        
        {/* Shield top */}
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.5, 0.2, 6]} />
          <meshPhongMaterial color="#059669" />
        </mesh>
        
        {/* Check mark */}
        <mesh position={[-0.1, 0, 0.3]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.15, 0.03, 0.02]} />
          <meshPhongMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.15, 0.1, 0.3]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.25, 0.03, 0.02]} />
          <meshPhongMaterial color="#ffffff" />
        </mesh>
      </mesh>
    </Float>
  );
}

function DatabaseStack() {
  return (
    <Float speed={0.7} rotationIntensity={0.15} floatIntensity={0.1}>
      <mesh position={[0, 0, 0]}>
        {/* Main database cylinder */}
        <cylinderGeometry args={[1.5, 1.5, 2.5, 32]} />
        <meshPhongMaterial color="#3b82f6" />
        
        {/* Database layers */}
        {[1.1, 0.5, -0.1, -0.7].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[1.52, 1.52, 0.15, 32]} />
            <meshPhongMaterial color="#1d4ed8" />
          </mesh>
        ))}
        
        {/* Copyright symbols on database */}
        {[0.8, 0.2, -0.4].map((y, i) => (
          <mesh key={i} position={[0, y, 1.51]} rotation={[-Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.15, 0.04, 8, 16]} />
            <meshPhongMaterial color="#fbbf24" />
          </mesh>
        ))}
      </mesh>
    </Float>
  );
}

export default function CopyrightManagement3D() {
  return (
    <div className="w-full h-80 relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        
        <DatabaseStack />
        
        {/* Floating certificates */}
        <FloatingCertificate position={[-3, 1.2, -1]} scale={0.8} color="#fbbf24" />
        <FloatingCertificate position={[3.2, 0.8, 0.5]} scale={0.7} color="#f59e0b" />
        <FloatingCertificate position={[-2.5, -1.8, 1]} scale={0.6} color="#eab308" />
        <FloatingCertificate position={[2.8, -1.5, -0.8]} scale={0.9} color="#facc15" />
        
        {/* Floating shields */}
        <FloatingShield position={[-3.5, -0.2, 0.5]} scale={0.7} />
        <FloatingShield position={[1.8, 2, -1]} scale={0.8} />
        <FloatingShield position={[3.8, -0.8, 1]} scale={0.6} />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
}