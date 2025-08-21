import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingDocument({ position, scale = 1, color = "#f3f4f6" }: { position: [number, number, number], scale?: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.15;
    }
  });

  return (
    <Float speed={1.0} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Document body */}
        <boxGeometry args={[1, 1.4, 0.02]} />
        <meshPhongMaterial color={color} />
        
        {/* Document lines */}
        {[0.3, 0.1, -0.1, -0.3].map((y, i) => (
          <mesh key={i} position={[0, y, 0.012]}>
            <boxGeometry args={[0.7, 0.03, 0.005]} />
            <meshPhongMaterial color="#9ca3af" />
          </mesh>
        ))}
        
        {/* Header */}
        <mesh position={[0, 0.5, 0.012]}>
          <boxGeometry args={[0.8, 0.08, 0.005]} />
          <meshPhongMaterial color="#4f46e5" />
        </mesh>
      </mesh>
    </Float>
  );
}

function FloatingFolder({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3 + position[0]) * 0.1;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.8 + position[0]) * 0.12;
    }
  });

  return (
    <Float speed={1.3} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Folder body */}
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshPhongMaterial color="#f59e0b" />
        
        {/* Folder tab */}
        <mesh position={[-0.3, 0.55, 0]}>
          <boxGeometry args={[0.6, 0.2, 0.1]} />
          <meshPhongMaterial color="#d97706" />
        </mesh>
      </mesh>
    </Float>
  );
}

function DigitalPen({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.3 + 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.9 + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.2}>
      <mesh ref={meshRef} position={position} scale={scale} rotation={[0, 0, 0.5]}>
        {/* Pen body */}
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshPhongMaterial color="#4f46e5" />
        
        {/* Pen tip */}
        <mesh position={[0, -1.1, 0]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshPhongMaterial color="#1e1b4b" />
        </mesh>
        
        {/* Pen cap */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
          <meshPhongMaterial color="#6366f1" />
        </mesh>
      </mesh>
    </Float>
  );
}

function FileStack() {
  return (
    <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.05}>
      <mesh position={[0, 0, 0]}>
        {/* Base stack */}
        <boxGeometry args={[2.5, 0.4, 2]} />
        <meshPhongMaterial color="#4f46e5" />
        
        {/* Individual files */}
        {[0.25, 0.5, 0.75].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0, i * 0.1, 0]}>
            <boxGeometry args={[2.3, 0.05, 1.8]} />
            <meshPhongMaterial color={["#f3f4f6", "#e5e7eb", "#d1d5db"][i]} />
          </mesh>
        ))}
      </mesh>
    </Float>
  );
}

export default function ContractManagement3D() {
  return (
    <div className="w-full h-80 relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
        
        <FileStack />
        
        {/* Floating documents */}
        <FloatingDocument position={[-3, 1, -1]} scale={0.8} color="#e0e7ff" />
        <FloatingDocument position={[3.5, 0.5, 0.8]} scale={0.7} color="#fef3c7" />
        <FloatingDocument position={[-2, -1.5, 1]} scale={0.6} color="#f0fdf4" />
        <FloatingDocument position={[2.8, -1.8, -0.5]} scale={0.9} color="#fce7f3" />
        
        {/* Floating folders */}
        <FloatingFolder position={[-3.5, -0.5, 0]} scale={0.6} />
        <FloatingFolder position={[1.5, 2, -1]} scale={0.7} />
        
        {/* Digital pens */}
        <DigitalPen position={[4, -0.8, 0.5]} scale={0.8} />
        <DigitalPen position={[-1.5, 2.2, -0.8]} scale={0.6} />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
    </div>
  );
}