import React from 'react';
import { Icon3D } from './Icon3D';

export const Award3D: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 1, 
  color = '#4CAF50',
  className = '' 
}) => {
  return (
    <Icon3D size={size} className={className}>
      {/* Main star */}
      <mesh>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Center circle */}
      <mesh position={[0, 0, 0.1]}>
        <torusGeometry args={[0.3, 0.1, 8, 20]} />
        <meshStandardMaterial color="#FF8A42" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Ribbon */}
      <mesh position={[0, -0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.05]} />
        <meshStandardMaterial color="#FFF3D6" metalness={0.3} roughness={0.7} />
      </mesh>
    </Icon3D>
  );
};

