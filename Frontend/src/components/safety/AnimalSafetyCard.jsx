// AnimalSafetyCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function AnimalSafetyCard({ name, icon: Icon, tips, color, link, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.5, type: 'spring' }}
      className={`rounded-2xl shadow-lg ${color} p-0 flex flex-col items-center hover:scale-[1.03] hover:shadow-orange-200 transition-all duration-300 overflow-hidden`}
    >
      {/* Animal Image */}
      <div className="w-full h-40 sm:h-44 md:h-48 lg:h-52 overflow-hidden relative">
        <img
          src={image}
          alt={name + ' photo'}
          className="w-full h-full object-cover object-center"
          style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}
        />
        <div className="absolute top-2 left-2 bg-white/80 rounded-full p-2 shadow">
          <Icon className="h-8 w-8 text-orange-500" aria-label={name + ' icon'} />
        </div>
      </div>
      {/* Card Content */}
      <div className="w-full flex flex-col items-center px-6 py-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{name}</h3>
        <ul className="list-disc list-inside text-base text-gray-700 mb-4 space-y-1 text-left w-full max-w-xs mx-auto">
          {tips.map((tip, i) => (
            <li key={i} className="leading-relaxed">{tip}</li>
          ))}
        </ul>
        <a
          href={link}
          className="mt-auto text-orange-600 font-semibold hover:underline hover:text-orange-700 text-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
      </div>
    </motion.div>
  );
}
