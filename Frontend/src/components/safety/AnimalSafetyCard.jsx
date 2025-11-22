// AnimalSafetyCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function AnimalSafetyCard({ name, icon: Icon, tips, color, link, image, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`rounded-xl shadow-md ${color} p-0 flex flex-col hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100`}
    >
      {/* Animal Image */}
      {image && (
        <div className="w-full h-48 overflow-hidden relative">
          <img
            src={image}
            alt={`${name} safety tips`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 bg-white/90 rounded-full p-2 shadow-sm">
            <Icon className="h-6 w-6 text-orange-500" aria-label={`${name} icon`} />
          </div>
        </div>
      )}
      {/* Card Content */}
      <div className="w-full flex flex-col px-5 py-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3">{name}</h3>
        <ul className="space-y-2 text-sm text-gray-700 mb-4">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-1">•</span>
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
        {link && (
          <a
            href={link}
            className="mt-auto text-orange-600 font-semibold hover:text-orange-700 text-sm transition-colors"
          >
            Learn More →
          </a>
        )}
      </div>
    </motion.div>
  );
}
