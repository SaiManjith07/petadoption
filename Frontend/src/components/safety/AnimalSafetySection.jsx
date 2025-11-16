// AnimalSafetySection.jsx
import React from 'react';
import { PawPrint } from 'lucide-react';
import AnimalSafetyCard from './AnimalSafetyCard';
import { safetyTipsData } from './SafetyTipsData';

export default function AnimalSafetySection() {
  return (
    <section className="py-16 px-2 sm:px-6 lg:px-8 bg-gradient-to-br from-mint-50 via-cream-50 to-blue-50 relative">
      {/* Decorative background paw prints (optional) */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-10">
        <PawPrint className="absolute left-8 top-8 w-16 h-16 text-orange-200" />
        <PawPrint className="absolute right-12 bottom-12 w-20 h-20 text-mint-200" />
      </div>
      {/* Section Header */}
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight flex flex-col items-center justify-center">
          Animal Safety Tips
          <span className="mt-2 flex items-center justify-center">
            <span className="w-10 h-1 bg-orange-400 rounded-full mr-2" />
            <PawPrint className="h-6 w-6 text-orange-400" />
            <span className="w-10 h-1 bg-orange-400 rounded-full ml-2" />
          </span>
        </h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Essential safety and care guidelines for pets and domestic animals. Protect, care, and support animals in your community.
        </p>
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {safetyTipsData.map((animal, idx) => (
          <AnimalSafetyCard key={animal.key} {...animal} index={idx} />
        ))}
      </div>
      {/* Mini CTA */}
      <div className="mt-12 flex flex-col items-center">
        <a
          href="/report"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold shadow-md hover:bg-orange-600 transition-all text-lg"
        >
          <PawPrint className="h-5 w-5" />
          Report Found Animal
        </a>
        <span className="mt-2 text-sm text-gray-500">See an animal in need? Help us rescue and reunite.</span>
      </div>
    </section>
  );
}
