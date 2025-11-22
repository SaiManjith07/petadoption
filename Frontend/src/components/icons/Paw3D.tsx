import React from 'react';
import { Icon3D } from './Icon3D';

export const Paw3D: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 1, 
  color = '#4CAF50',
  className = '' 
}) => {
  return (
    <Icon3D size={size} className={className}>
      {/* Main pad */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Top left pad */}
      <mesh position={[-0.3, 0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Top right pad */}
      <mesh position={[0.3, 0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Bottom left pad */}
      <mesh position={[-0.25, -0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Bottom right pad */}
      <mesh position={[0.25, -0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
    </Icon3D>
  );
};

