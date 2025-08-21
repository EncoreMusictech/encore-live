import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SimpleSphere: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.4]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const MusicEcosystem3DScene: React.FC = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Central Artist */}
      <SimpleSphere position={[0, 0, 0]} color="#F59E0B" />

      {/* Inner Ring */}
      <SimpleSphere position={[2, 0, 0]} color="#3B82F6" />
      <SimpleSphere position={[-2, 0, 0]} color="#EF4444" />
      <SimpleSphere position={[0, 0, 2]} color="#10B981" />
      <SimpleSphere position={[0, 0, -2]} color="#8B5CF6" />

      {/* Outer Ring */}
      <SimpleSphere position={[3.5, 0, 0]} color="#DC2626" />
      <SimpleSphere position={[-3.5, 0, 0]} color="#22C55E" />
      <SimpleSphere position={[0, 0, 3.5]} color="#1D4ED8" />
      <SimpleSphere position={[0, 0, -3.5]} color="#EA580C" />
    </>
  );
};

const MusicEcosystem3D: React.FC = () => {
  return (
    <div className="w-full h-[600px] relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        <MusicEcosystem3DScene />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Overlay text */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-center z-10 mt-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Navigate the Complex Music Ecosystem
          </h3>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            From PROs to streaming platforms, manage all your music rights in one unified platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default MusicEcosystem3D;