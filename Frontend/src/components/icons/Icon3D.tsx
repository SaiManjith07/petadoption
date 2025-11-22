import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { OrbitControls } from '@react-three/drei';

interface Icon3DProps {
  children: React.ReactNode;
  size?: number;
  rotationSpeed?: number;
  autoRotate?: boolean;
  className?: string;
}

const RotatingIcon = ({ 
  children, 
  rotationSpeed = 0.5,
  autoRotate = true 
}: { 
  children: React.ReactNode;
  rotationSpeed?: number;
  autoRotate?: boolean;
}) => {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += rotationSpeed * 0.01;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export const Icon3D: React.FC<Icon3DProps> = ({
  children,
  size = 1,
  rotationSpeed = 0.5,
  autoRotate = true,
  className = '',
}) => {
  return (
    <div className={`w-full h-full ${className}`} style={{ width: '100%', height: '100%', minHeight: '80px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <RotatingIcon rotationSpeed={rotationSpeed} autoRotate={autoRotate}>
          <group scale={[size, size, size]}>
            {children}
          </group>
        </RotatingIcon>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={rotationSpeed} />
      </Canvas>
    </div>
  );
};

