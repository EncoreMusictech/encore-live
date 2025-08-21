import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface EcosystemNodeProps {
  position: [number, number, number];
  text: string;
  color: string;
  size?: number;
}

const EcosystemNode: React.FC<EcosystemNodeProps> = ({ position, text, color, size = 0.5 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[size]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

const SimpleConnectingLine: React.FC<{ start: [number, number, number]; end: [number, number, number] }> = ({ start, end }) => {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#8B5CF6" opacity={0.4} transparent />
    </line>
  );
};

const RotatingGroup: React.FC<{ children: React.ReactNode; speed: number }> = ({ children, speed }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

const MusicEcosystem3DScene: React.FC = () => {
  // Central artist
  const centralArtist = (
    <group position={[0, 0, 0]}>
      <Sphere args={[0.8]}>
        <meshStandardMaterial color="#F59E0B" />
      </Sphere>
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ARTIST
      </Text>
    </group>
  );

  // Inner circle organizations - PROs and key entities
  const innerCircleNodes = [
    { text: "ASCAP", color: "#3B82F6", angle: 0 },
    { text: "BMI", color: "#1F2937", angle: Math.PI / 2 },
    { text: "SESAC", color: "#EF4444", angle: Math.PI },
    { text: "MLC", color: "#10B981", angle: (3 * Math.PI) / 2 },
  ];

  // Outer circle - streaming platforms and distributors
  const outerCircleNodes = [
    { text: "Spotify", color: "#22C55E", angle: 0 },
    { text: "Apple", color: "#6B7280", angle: Math.PI / 4 },
    { text: "YouTube", color: "#EF4444", angle: Math.PI / 2 },
    { text: "Amazon", color: "#1D4ED8", angle: (3 * Math.PI) / 4 },
    { text: "Netflix", color: "#DC2626", angle: Math.PI },
    { text: "Hulu", color: "#22C55E", angle: (5 * Math.PI) / 4 },
    { text: "PRS", color: "#DC2626", angle: (3 * Math.PI) / 2 },
    { text: "PPL", color: "#EA580C", angle: (7 * Math.PI) / 4 },
  ];

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Central artist */}
      {centralArtist}

      {/* Inner circle with slow rotation */}
      <RotatingGroup speed={0.1}>
        {innerCircleNodes.map((node, index) => {
          const position: [number, number, number] = [
            Math.cos(node.angle) * 3,
            0,
            Math.sin(node.angle) * 3,
          ];
          return (
            <React.Fragment key={`inner-${index}`}>
              <EcosystemNode
                position={position}
                text={node.text}
                color={node.color}
                size={0.4}
              />
              <SimpleConnectingLine start={[0, 0, 0]} end={position} />
            </React.Fragment>
          );
        })}
      </RotatingGroup>

      {/* Outer circle with slower rotation */}
      <RotatingGroup speed={-0.05}>
        {outerCircleNodes.map((node, index) => {
          const position: [number, number, number] = [
            Math.cos(node.angle) * 6,
            0,
            Math.sin(node.angle) * 6,
          ];
          return (
            <React.Fragment key={`outer-${index}`}>
              <EcosystemNode
                position={position}
                text={node.text}
                color={node.color}
                size={0.3}
              />
              <SimpleConnectingLine 
                start={[
                  Math.cos(innerCircleNodes[index % innerCircleNodes.length].angle) * 3,
                  0,
                  Math.sin(innerCircleNodes[index % innerCircleNodes.length].angle) * 3,
                ]} 
                end={position} 
              />
            </React.Fragment>
          );
        })}
      </RotatingGroup>
    </>
  );
};

const MusicEcosystem3D: React.FC = () => {
  return (
    <div className="w-full h-[600px] relative">
      <Canvas
        camera={{ position: [0, 5, 12], fov: 60 }}
        className="bg-gradient-to-b from-slate-900 to-slate-800"
      >
        <MusicEcosystem3DScene />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={8}
          maxDistance={20}
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