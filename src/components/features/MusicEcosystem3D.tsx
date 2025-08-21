import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Ring } from '@react-three/drei';
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
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[size]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        textAlign="center"
      >
        {text}
      </Text>
    </group>
  );
};

const ConnectingLine: React.FC<{ start: [number, number, number]; end: [number, number, number] }> = ({ start, end }) => {
  const ref = useRef<THREE.BufferGeometry>(null);
  
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 1, (start[2] + end[2]) / 2),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(50);
  }, [start, end]);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;
      const geometry = ref.current;
      const positions = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        const wave = Math.sin(time * 2 + index * 0.1) * 0.1;
        positions[i + 1] = points[index].y + wave;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <line>
      <bufferGeometry ref={ref}>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#8B5CF6" opacity={0.6} transparent />
    </line>
  );
};

const FloatingMusicNote: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.3;
    }
  });

  return (
    <group ref={ref} position={position}>
      <Text
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

const RotatingGroup: React.FC<{ children: React.ReactNode; radius: number; speed: number }> = ({ children, radius, speed }) => {
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
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
        textAlign="center"
      >
        ARTIST/
        SONGWRITER
      </Text>
    </group>
  );

  // Inner circle organizations - PROs and key entities
  const innerCircleNodes = [
    { text: "ASCAP", color: "#3B82F6", angle: 0 },
    { text: "BMI", color: "#1F2937", angle: Math.PI / 3 },
    { text: "SESAC", color: "#EF4444", angle: (2 * Math.PI) / 3 },
    { text: "MLC", color: "#10B981", angle: Math.PI },
    { text: "SWR", color: "#6366F1", angle: (4 * Math.PI) / 3 },
    { text: "DDEX", color: "#8B5CF6", angle: (5 * Math.PI) / 3 },
  ];

  // Outer circle - streaming platforms and distributors
  const outerCircleNodes = [
    { text: "PRS Music", color: "#DC2626", angle: 0 },
    { text: "PPL", color: "#EA580C", angle: Math.PI / 6 },
    { text: "Spotify", color: "#22C55E", angle: Math.PI / 3 },
    { text: "Apple Music", color: "#6B7280", angle: Math.PI / 2 },
    { text: "YouTube", color: "#EF4444", angle: (2 * Math.PI) / 3 },
    { text: "Amazon Music", color: "#1D4ED8", angle: (5 * Math.PI) / 6 },
    { text: "SOCAN", color: "#374151", angle: Math.PI },
    { text: "Netflix", color: "#DC2626", angle: (7 * Math.PI) / 6 },
    { text: "Hulu", color: "#22C55E", angle: (4 * Math.PI) / 3 },
    { text: "Fox Sports", color: "#1E40AF", angle: (3 * Math.PI) / 2 },
  ];

  // Generate floating music notes
  const musicNotes = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 8 + Math.random() * 2;
    return {
      position: [
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 4,
        Math.sin(angle) * radius,
      ] as [number, number, number],
    };
  });

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Central artist */}
      {centralArtist}

      {/* Inner circle with slow rotation */}
      <RotatingGroup radius={3} speed={0.1}>
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
                size={0.6}
              />
              <ConnectingLine start={[0, 0, 0]} end={position} />
            </React.Fragment>
          );
        })}
        
        {/* Inner ring visual */}
        <Ring args={[2.8, 3.2, 32]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#8B5CF6" opacity={0.2} transparent />
        </Ring>
      </RotatingGroup>

      {/* Outer circle with slower rotation */}
      <RotatingGroup radius={6} speed={-0.05}>
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
                size={0.5}
              />
              {/* Connect to nearest inner circle node */}
              <ConnectingLine 
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
        
        {/* Outer ring visual */}
        <Ring args={[5.8, 6.2, 32]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#60A5FA" opacity={0.15} transparent />
        </Ring>
      </RotatingGroup>

      {/* Floating music notes */}
      {musicNotes.map((note, index) => (
        <FloatingMusicNote key={`note-${index}`} position={note.position} />
      ))}

      {/* Additional elements */}
      <group position={[4, 2, 4]}>
        <Text fontSize={1} color="#F59E0B">🎤</Text>
      </group>
      
      <group position={[-4, 1.5, -4]}>
        <Text fontSize={1} color="#8B5CF6">🎧</Text>
      </group>
      
      <group position={[0, 3, 6]}>
        <Text fontSize={1} color="#60A5FA">📄</Text>
      </group>
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