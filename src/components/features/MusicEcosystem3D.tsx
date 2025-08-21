import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

// Stakeholder Node Component
function StakeholderNode({ 
  position, 
  label, 
  color = "#8b5cf6", 
  size = 0.5,
  floatSpeed = 1,
  rotationSpeed = 0.01
}: {
  position: [number, number, number];
  label: string;
  color?: string;
  size?: number;
  floatSpeed?: number;
  rotationSpeed?: number;
}) {
  const nodeRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (nodeRef.current) {
      nodeRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <Float speed={floatSpeed} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={nodeRef} position={position}>
        {/* Main node sphere */}
        <mesh>
          <sphereGeometry args={[size, 16, 16]} />
          <meshPhongMaterial 
            color={color} 
            transparent 
            opacity={0.8}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </mesh>
        
        {/* Outer glow ring */}
        <mesh>
          <ringGeometry args={[size * 1.2, size * 1.4, 16]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Label */}
        <Text
          position={[0, -size * 2, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </group>
    </Float>
  );
}

// Connection Line Component
function ConnectionLine({ 
  start, 
  end, 
  color = "#8b5cf6",
  opacity = 0.6 
}: {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  opacity?: number;
}) {
  const lineRef = useRef<THREE.BufferGeometry>(null);
  
  useFrame((state) => {
    // Animate the line opacity for a pulsing effect
  });

  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line>
      <bufferGeometry ref={lineRef} {...geometry} />
      <lineBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity}
      />
    </line>
  );
}

// Central Hub Component
function CentralHub() {
  const hubRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (hubRef.current) {
      hubRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={hubRef}>
      {/* Central core */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshPhongMaterial 
          color="#8b5cf6" 
          transparent 
          opacity={0.9}
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Rotating rings */}
      {[2, 2.5, 3].map((radius, index) => (
        <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.1, radius + 0.1, 32]} />
          <meshBasicMaterial 
            color="#8b5cf6" 
            transparent 
            opacity={0.2 - index * 0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Central label */}
      <Text
        position={[0, -2, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        PUBLISHER
      </Text>
    </group>
  );
}

// Main Ecosystem Component
function EcosystemScene() {
  const sceneRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y += 0.002;
    }
  });

  // Define stakeholder positions in rings
  const innerRing = [
    { position: [4, 0, 0] as [number, number, number], label: "Songwriters", color: "#06d6a0" },
    { position: [-2, 3.5, 0] as [number, number, number], label: "Artists", color: "#f72585" },
    { position: [-2, -3.5, 0] as [number, number, number], label: "Producers", color: "#fb8500" },
  ];

  const middleRing = [
    { position: [6, 4, 0] as [number, number, number], label: "ASCAP", color: "#4361ee" },
    { position: [6, -4, 0] as [number, number, number], label: "BMI", color: "#7209b7" },
    { position: [-6, 4, 0] as [number, number, number], label: "SESAC", color: "#f72585" },
    { position: [-6, -4, 0] as [number, number, number], label: "MLC", color: "#06d6a0" },
    { position: [0, 6, 0] as [number, number, number], label: "Spotify", color: "#1db954" },
    { position: [0, -6, 0] as [number, number, number], label: "Apple Music", color: "#fc3c44" },
  ];

  const outerRing = [
    { position: [8, 6, 0] as [number, number, number], label: "GEMA", color: "#ffb700" },
    { position: [8, -6, 0] as [number, number, number], label: "SACEM", color: "#06d6a0" },
    { position: [-8, 6, 0] as [number, number, number], label: "PRS", color: "#4361ee" },
    { position: [-8, -6, 0] as [number, number, number], label: "SOCAN", color: "#f72585" },
    { position: [6, 8, 0] as [number, number, number], label: "Sync Agents", color: "#fb8500" },
    { position: [-6, -8, 0] as [number, number, number], label: "Sub-Publishers", color: "#7209b7" },
  ];

  return (
    <group ref={sceneRef}>
      {/* Central Hub */}
      <CentralHub />
      
      {/* Inner Ring Stakeholders */}
      {innerRing.map((stakeholder, index) => (
        <StakeholderNode
          key={`inner-${index}`}
          position={stakeholder.position}
          label={stakeholder.label}
          color={stakeholder.color}
          size={0.6}
          floatSpeed={1.5}
          rotationSpeed={0.015}
        />
      ))}
      
      {/* Middle Ring Stakeholders */}
      {middleRing.map((stakeholder, index) => (
        <StakeholderNode
          key={`middle-${index}`}
          position={stakeholder.position}
          label={stakeholder.label}
          color={stakeholder.color}
          size={0.5}
          floatSpeed={1.2}
          rotationSpeed={0.01}
        />
      ))}
      
      {/* Outer Ring Stakeholders */}
      {outerRing.map((stakeholder, index) => (
        <StakeholderNode
          key={`outer-${index}`}
          position={stakeholder.position}
          label={stakeholder.label}
          color={stakeholder.color}
          size={0.4}
          floatSpeed={1}
          rotationSpeed={0.008}
        />
      ))}
      
      {/* Connection Lines - Central to Inner Ring */}
      {innerRing.map((stakeholder, index) => (
        <ConnectionLine
          key={`connection-inner-${index}`}
          start={[0, 0, 0]}
          end={stakeholder.position}
          color={stakeholder.color}
          opacity={0.6}
        />
      ))}
      
      {/* Connection Lines - Inner to Middle Ring */}
      {middleRing.map((middleStakeholder, middleIndex) => {
        const nearestInner = innerRing.reduce((closest, inner, innerIndex) => {
          const middlePos = new THREE.Vector3(...middleStakeholder.position);
          const innerPos = new THREE.Vector3(...inner.position);
          const closestPos = new THREE.Vector3(...closest.position);
          
          return middlePos.distanceTo(innerPos) < middlePos.distanceTo(closestPos) ? inner : closest;
        }, innerRing[0]);
        
        return (
          <ConnectionLine
            key={`connection-middle-${middleIndex}`}
            start={nearestInner.position}
            end={middleStakeholder.position}
            color={middleStakeholder.color}
            opacity={0.4}
          />
        );
      })}
      
      {/* Connection Lines - Middle to Outer Ring */}
      {outerRing.map((outerStakeholder, outerIndex) => {
        const nearestMiddle = middleRing.reduce((closest, middle, middleIndex) => {
          const outerPos = new THREE.Vector3(...outerStakeholder.position);
          const middlePos = new THREE.Vector3(...middle.position);
          const closestPos = new THREE.Vector3(...closest.position);
          
          return outerPos.distanceTo(middlePos) < outerPos.distanceTo(closestPos) ? middle : closest;
        }, middleRing[0]);
        
        return (
          <ConnectionLine
            key={`connection-outer-${outerIndex}`}
            start={nearestMiddle.position}
            end={outerStakeholder.position}
            color={outerStakeholder.color}
            opacity={0.3}
          />
        );
      })}
    </group>
  );
}

// Main Export Component
export default function MusicEcosystem3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [15, 8, 15], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting Setup */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[20, 20, 10]} 
          intensity={0.8} 
          color="#ffffff"
        />
        <pointLight position={[0, 0, 10]} intensity={0.5} color="#8b5cf6" />
        <pointLight position={[-10, 10, -10]} intensity={0.3} color="#06d6a0" />
        <pointLight position={[10, -10, -10]} intensity={0.3} color="#f72585" />
        
        {/* Main Scene */}
        <EcosystemScene />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.3}
          maxDistance={25}
          minDistance={10}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 4}
        />
        
        {/* Fog for depth */}
        <fog attach="fog" args={['#000011', 15, 35]} />
      </Canvas>
    </div>
  );
}