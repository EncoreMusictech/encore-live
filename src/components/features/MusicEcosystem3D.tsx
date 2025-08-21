import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface EcosystemNodeProps {
  position: [number, number, number];
  text: string;
  color: string;
  size?: number;
}

const EcosystemNode: React.FC<EcosystemNodeProps> = ({ position, text, color, size = 0.4 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[size]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text
        position={[0, -0.7, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.5}
      >
        {text}
      </Text>
    </group>
  );
};

const CentralArtist: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Artist head */}
      <Sphere args={[0.4]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#F59E0B" />
      </Sphere>
      
      {/* Artist body */}
      <Cylinder args={[0.3, 0.4, 0.8]} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#3B82F6" />
      </Cylinder>
      
      {/* Headphones */}
      <Box args={[0.6, 0.1, 0.1]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color="#1F2937" />
      </Box>
      <Sphere args={[0.15]} position={[-0.3, 0.5, 0]}>
        <meshStandardMaterial color="#1F2937" />
      </Sphere>
      <Sphere args={[0.15]} position={[0.3, 0.5, 0]}>
        <meshStandardMaterial color="#1F2937" />
      </Sphere>
      
      {/* Label */}
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        ARTIST
      </Text>
    </group>
  );
};

const RotatingRing: React.FC<{ 
  nodes: Array<{ text: string; color: string; angle: number }>;
  radius: number;
  speed: number;
  yPosition?: number;
}> = ({ nodes, radius, speed, yPosition = 0 }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, index) => {
        const position: [number, number, number] = [
          Math.cos(node.angle) * radius,
          yPosition,
          Math.sin(node.angle) * radius,
        ];
        return (
          <EcosystemNode
            key={`${node.text}-${index}`}
            position={position}
            text={node.text}
            color={node.color}
            size={0.35}
          />
        );
      })}
    </group>
  );
};

const FloatingMusicalNotes: React.FC = () => {
  const notesData = useMemo(() => [
    { position: [-4, 2, -2], scale: 0.8, speed: 0.5 },
    { position: [4, 1.5, -3], scale: 1.2, speed: 0.3 },
    { position: [-3, -1, 4], scale: 0.9, speed: 0.7 },
    { position: [3.5, -0.5, 3], scale: 1.1, speed: 0.4 },
    { position: [-5, 0.5, 1], scale: 0.7, speed: 0.6 },
    { position: [5, 2.5, -1], scale: 1.0, speed: 0.35 },
  ], []);

  return (
    <>
      {notesData.map((note, index) => (
        <FloatingNote
          key={index}
          position={note.position as [number, number, number]}
          scale={note.scale}
          speed={note.speed}
        />
      ))}
    </>
  );
};

const FloatingNote: React.FC<{
  position: [number, number, number];
  scale: number;
  speed: number;
}> = ({ position, scale, speed }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.2;
    }
  });

  return (
    <group position={position} scale={scale}>
      <Text
        ref={meshRef}
        fontSize={0.8}
        color="#60A5FA"
        anchorX="center"
        anchorY="middle"
      >
        ♪
      </Text>
    </group>
  );
};

const MusicEcosystem3DScene: React.FC = () => {
  // Inner circle - PROs and core entities
  const innerCircleNodes = useMemo(() => [
    { text: "ASCAP", color: "#3B82F6", angle: 0 },
    { text: "BMI", color: "#1F2937", angle: Math.PI / 3 },
    { text: "SESAC", color: "#EF4444", angle: (2 * Math.PI) / 3 },
    { text: "The MLC", color: "#10B981", angle: Math.PI },
    { text: "SWR", color: "#8B5CF6", angle: (4 * Math.PI) / 3 },
    { text: "DDEX", color: "#F59E0B", angle: (5 * Math.PI) / 3 },
  ], []);

  // Outer circle - streaming platforms and media
  const outerCircleNodes = useMemo(() => [
    { text: "PRS", color: "#DC2626", angle: 0 },
    { text: "PPL", color: "#EA580C", angle: Math.PI / 4 },
    { text: "Spotify", color: "#22C55E", angle: Math.PI / 2 },
    { text: "Amazon Music", color: "#1D4ED8", angle: (3 * Math.PI) / 4 },
    { text: "YouTube", color: "#EF4444", angle: Math.PI },
    { text: "iTunes", color: "#6B7280", angle: (5 * Math.PI) / 4 },
    { text: "Hulu", color: "#22C55E", angle: (3 * Math.PI) / 2 },
    { text: "Netflix", color: "#DC2626", angle: (7 * Math.PI) / 4 },
  ], []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8B5CF6" />

      {/* Central Artist */}
      <CentralArtist />

      {/* Inner Ring - PROs */}
      <RotatingRing
        nodes={innerCircleNodes}
        radius={2.5}
        speed={0.08}
        yPosition={0}
      />

      {/* Outer Ring - Platforms */}
      <RotatingRing
        nodes={outerCircleNodes}
        radius={4.5}
        speed={-0.05}
        yPosition={0}
      />

      {/* Floating Musical Notes */}
      <FloatingMusicalNotes />
    </>
  );
};

const MusicEcosystem3D: React.FC = () => {
  return (
    <div className="w-full h-[600px] relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <MusicEcosystem3DScene />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={6}
          maxDistance={15}
          autoRotate={true}
          autoRotateSpeed={0.3}
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