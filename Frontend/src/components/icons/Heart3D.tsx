import React from 'react';
import { Icon3D } from './Icon3D';
import { Mesh } from 'three';

export const Heart3D: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 1, 
  color = '#4CAF50',
  className = '' 
}) => {
  return (
    <Icon3D size={size} className={className}>
      <mesh>
        <torusGeometry args={[0.6, 0.3, 8, 20]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <coneGeometry args={[0.4, 0.6, 8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
    </Icon3D>
  );
};

