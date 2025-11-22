import React from 'react';
import { Icon3D } from './Icon3D';

export const Building3D: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 1, 
  color = '#4CAF50',
  className = '' 
}) => {
  return (
    <Icon3D size={size} className={className}>
      {/* Main building */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.25, 0.1, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial color="#FF8A42" emissive="#FF8A42" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.25, 0.1, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial color="#FF8A42" emissive="#FF8A42" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.25, -0.2, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial color="#FF8A42" emissive="#FF8A42" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.25, -0.2, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial color="#FF8A42" emissive="#FF8A42" emissiveIntensity={0.5} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.6, 0.3, 4]} />
        <meshStandardMaterial color="#2E7D32" metalness={0.7} roughness={0.3} />
      </mesh>
    </Icon3D>
  );
};

