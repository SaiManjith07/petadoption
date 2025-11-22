import React from 'react';
import { Icon3D } from './Icon3D';

export const Shield3D: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 1, 
  color = '#4CAF50',
  className = '' 
}) => {
  return (
    <Icon3D size={size} className={className}>
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.3, 0]} scale={[0.3, 0.3, 0.3]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#FF8A42" metalness={0.9} roughness={0.1} />
      </mesh>
    </Icon3D>
  );
};

