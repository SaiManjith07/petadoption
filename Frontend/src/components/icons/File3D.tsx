import React from 'react';
import { Icon3D } from './Icon3D';

export const File3D: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 1, 
  color = '#4CAF50',
  className = '' 
}) => {
  return (
    <Icon3D size={size} className={className}>
      <mesh>
        <boxGeometry args={[0.8, 1, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0.06]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color="#FF8A42" metalness={0.8} roughness={0.2} />
      </mesh>
    </Icon3D>
  );
};

