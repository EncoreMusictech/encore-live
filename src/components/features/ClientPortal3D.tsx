import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingProfile({ position, scale = 1, color = "#8b5cf6" }: { position: [number, number, number], scale?: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.12;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Profile card */}
        <boxGeometry args={[1, 1.2, 0.05]} />
        <meshPhongMaterial color="#f8fafc" />
        
        {/* Profile picture area */}
        <mesh position={[0, 0.3, 0.026]}>
          <cylinderGeometry args={[0.2, 0.2, 0.01, 32]} />
          <meshPhongMaterial color={color} />
        </mesh>
        
        {/* Person icon */}
        <mesh position={[0, 0.35, 0.032]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhongMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.25, 0.032]}>
          <cylinderGeometry args={[0.12, 0.08, 0.08, 16]} />
          <meshPhongMaterial color="#ffffff" />
        </mesh>
        
        {/* Name and info lines */}
        {[0.05, -0.1, -0.25].map((y, i) => (
          <mesh key={i} position={[0, y, 0.026]}>
            <boxGeometry args={[0.7, 0.03, 0.005]} />
            <meshPhongMaterial color="#94a3b8" />
          </mesh>
        ))}
        
        {/* Role badge */}
        <mesh position={[0, -0.4, 0.026]}>
          <boxGeometry args={[0.5, 0.08, 0.005]} />
          <meshPhongMaterial color={color} />
        </mesh>
      </mesh>
    </Float>
  );
}

function FloatingNotification({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.6 + position[0]) * 0.1;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.8 + position[0]) * 0.15;
    }
  });

  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Notification bubble */}
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshPhongMaterial color="#ef4444" />
        
        {/* Notification dot */}
        <mesh position={[0, 0, 0.31]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshPhongMaterial color="#ffffff" />
        </mesh>
        
        {/* Exclamation mark */}
        <mesh position={[0, 0.05, 0.32]}>
          <boxGeometry args={[0.03, 0.1, 0.01]} />
          <meshPhongMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, -0.05, 0.32]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshPhongMaterial color="#ef4444" />
        </mesh>
      </mesh>
    </Float>
  );
}

function SecurityLock({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.15;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1.0} rotationIntensity={0.2} floatIntensity={0.2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {/* Lock body */}
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshPhongMaterial color="#059669" />
        
        {/* Lock shackle */}
        <mesh position={[0, 0.6, 0]}>
          <torusGeometry args={[0.25, 0.05, 8, 16]} />
          <meshPhongMaterial color="#065f46" />
        </mesh>
        
        {/* Keyhole */}
        <mesh position={[0, 0, 0.16]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshPhongMaterial color="#064e3b" />
        </mesh>
        <mesh position={[0, -0.15, 0.16]}>
          <boxGeometry args={[0.04, 0.15, 0.02]} />
          <meshPhongMaterial color="#064e3b" />
        </mesh>
      </mesh>
    </Float>
  );
}

function PortalDashboard() {
  return (
    <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.05}>
      <mesh position={[0, 0, 0]}>
        {/* Main dashboard screen */}
        <boxGeometry args={[3.5, 2.5, 0.2]} />
        <meshPhongMaterial color="#1e293b" />
        
        {/* Screen content area */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[3.3, 2.3, 0.02]} />
          <meshPhongMaterial color="#f1f5f9" />
        </mesh>
        
        {/* Header bar */}
        <mesh position={[0, 1, 0.12]}>
          <boxGeometry args={[3.3, 0.3, 0.01]} />
          <meshPhongMaterial color="#8b5cf6" />
        </mesh>
        
        {/* Dashboard widgets */}
        {[
          [-0.8, 0.3], [0.8, 0.3],
          [-0.8, -0.3], [0.8, -0.3],
          [0, -0.8]
        ].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.12]}>
            <boxGeometry args={[0.6, 0.4, 0.01]} />
            <meshPhongMaterial color={i < 2 ? "#ddd6fe" : i < 4 ? "#e0e7ff" : "#f0fdf4"} />
          </mesh>
        ))}
        
        {/* User avatar in header */}
        <mesh position={[-1.3, 1, 0.13]}>
          <cylinderGeometry args={[0.08, 0.08, 0.005, 16]} />
          <meshPhongMaterial color="#60a5fa" />
        </mesh>
      </mesh>
    </Float>
  );
}

export default function ClientPortal3D() {
  return (
    <div className="w-full h-80 relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
        
        <PortalDashboard />
        
        {/* Floating profiles */}
        <FloatingProfile position={[-3.2, 1, -1]} scale={0.7} color="#8b5cf6" />
        <FloatingProfile position={[3.5, 0.5, 0.8]} scale={0.8} color="#3b82f6" />
        <FloatingProfile position={[-2.5, -1.8, 1]} scale={0.6} color="#10b981" />
        <FloatingProfile position={[2.8, -1.5, -0.5]} scale={0.9} color="#f59e0b" />
        
        {/* Floating notifications */}
        <FloatingNotification position={[-3.8, -0.2, 0]} scale={0.8} />
        <FloatingNotification position={[1.5, 2.2, -1]} scale={0.7} />
        <FloatingNotification position={[4, -0.8, 0.5]} scale={0.6} />
        
        {/* Security locks */}
        <SecurityLock position={[-1.8, 2.5, -0.8]} scale={0.8} />
        <SecurityLock position={[3.2, 1.8, 0.2]} scale={0.7} />
        <SecurityLock position={[-3.5, -1.2, 1]} scale={0.6} />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
}