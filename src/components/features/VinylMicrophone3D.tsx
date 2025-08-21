import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// Vinyl Record Component
function VinylRecord({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const recordRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (recordRef.current) {
      recordRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group ref={recordRef} position={position}>
      {/* Main record disc */}
      <mesh>
        <cylinderGeometry args={[2, 2, 0.1, 32]} />
        <meshPhongMaterial color="#1a1a1a" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Record grooves */}
      {[1.8, 1.6, 1.4, 1.2, 1.0, 0.8].map((radius, index) => (
        <mesh key={index} position={[0, 0.051, 0]}>
          <ringGeometry args={[radius - 0.05, radius, 32]} />
          <meshPhongMaterial color="#2a2a2a" transparent opacity={0.3} />
        </mesh>
      ))}
      
      {/* Center label */}
      <mesh position={[0, 0.052, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.02, 32]} />
        <meshPhongMaterial color="#8b5cf6" />
      </mesh>
      
      {/* Center hole */}
      <mesh position={[0, 0.053, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
        <meshPhongMaterial color="#000000" />
      </mesh>
    </group>
  );
}

// Microphone Component
function Microphone({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const micRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (micRef.current) {
      micRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={micRef} position={position}>
        {/* Base stand */}
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 0.3, 16]} />
          <meshPhongMaterial color="#333333" />
        </mesh>
        
        {/* Stand pole */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
          <meshPhongMaterial color="#444444" />
        </mesh>
        
        {/* Microphone head */}
        <mesh position={[0, 1.5, 0]}>
          <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
          <meshPhongMaterial color="#c0c0c0" />
        </mesh>
        
        {/* Purple accent ring */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 16]} />
          <meshPhongMaterial color="#8b5cf6" />
        </mesh>
        
        {/* Microphone grille lines */}
        {[0.1, 0.3, 0.5].map((offset, index) => (
          <mesh key={index} position={[0, 1.5 + offset, 0]}>
            <cylinderGeometry args={[0.41, 0.41, 0.02, 16]} />
            <meshPhongMaterial color="#8b5cf6" transparent opacity={0.7} />
          </mesh>
        ))}
        
        {/* Connection cable */}
        <mesh position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
          <meshPhongMaterial color="#333333" />
        </mesh>
      </group>
    </Float>
  );
}

// Main Component
export default function VinylMicrophone3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [5, 2, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          color="#ffffff"
          castShadow
        />
        <pointLight position={[-5, 5, 5]} intensity={0.5} color="#8b5cf6" />
        
        {/* Components */}
        <VinylRecord position={[-2, 0, 0]} />
        <Microphone position={[2, 0, 0]} />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}