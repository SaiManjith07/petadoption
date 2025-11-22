// AnimalSafetySection.jsx
import React from 'react';
import { PawPrint } from 'lucide-react';
import AnimalSafetyCard from './AnimalSafetyCard';
import { safetyTipsData } from './SafetyTipsData';

export default function AnimalSafetySection() {
  return (
    <section className="py-16 px-2 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-4 gap-3">
          <PawPrint className="h-8 w-8 text-orange-500" />
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Animal Safety Tips</h2>
          <PawPrint className="h-8 w-8 text-orange-500" />
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Essential safety and care guidelines for pets and domestic animals. Protect, care, and support animals in your community.
        </p>
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {safetyTipsData.map((animal, idx) => (
          <AnimalSafetyCard key={animal.key} {...animal} index={idx} />
        ))}
      </div>
    </section>
  );
}
