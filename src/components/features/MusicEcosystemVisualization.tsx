import React from 'react';

const MusicEcosystemVisualization: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Navigate the Complex <span className="bg-gradient-accent bg-clip-text text-transparent">Music Ecosystem</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From PROs to streaming platforms, manage all your music rights in one unified platform
          </p>
        </div>

        {/* Central Visualization */}
        <div className="relative max-w-4xl mx-auto">
          {/* Central Artist */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-sm">ARTIST</span>
            </div>
          </div>

          {/* Inner Ring - PROs */}
          <div className="relative w-80 h-80 mx-auto animate-spin-slow">
            {[
              { name: "ASCAP", color: "bg-blue-500", angle: 0 },
              { name: "BMI", color: "bg-gray-700", angle: 90 },
              { name: "SESAC", color: "bg-red-500", angle: 180 },
              { name: "MLC", color: "bg-green-500", angle: 270 },
            ].map((org, index) => (
              <div
                key={org.name}
                className={`absolute w-16 h-16 ${org.color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${org.angle}deg) translateY(-120px) rotate(-${org.angle}deg)`,
                }}
              >
                {org.name}
              </div>
            ))}
          </div>

          {/* Outer Ring - Platforms */}
          <div className="absolute inset-0 w-96 h-96 mx-auto animate-spin-reverse">
            {[
              { name: "Spotify", color: "bg-green-600", angle: 0 },
              { name: "Apple", color: "bg-gray-600", angle: 45 },
              { name: "YouTube", color: "bg-red-600", angle: 90 },
              { name: "Amazon", color: "bg-blue-600", angle: 135 },
              { name: "Netflix", color: "bg-red-700", angle: 180 },
              { name: "Hulu", color: "bg-green-700", angle: 225 },
              { name: "PRS", color: "bg-red-800", angle: 270 },
              { name: "PPL", color: "bg-orange-600", angle: 315 },
            ].map((platform) => (
              <div
                key={platform.name}
                className={`absolute w-12 h-12 ${platform.color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${platform.angle}deg) translateY(-160px) rotate(-${platform.angle}deg)`,
                }}
              >
                {platform.name}
              </div>
            ))}
          </div>

          {/* Connecting Lines */}
          <div className="absolute inset-0">
            {/* Inner circle connections */}
            <svg className="w-full h-full" viewBox="0 0 384 384">
              <g className="animate-pulse">
                <circle
                  cx="192"
                  cy="192"
                  r="120"
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="10,5"
                />
                <circle
                  cx="192"
                  cy="192"
                  r="160"
                  fill="none"
                  stroke="rgba(96, 165, 250, 0.2)"
                  strokeWidth="2"
                  strokeDasharray="15,10"
                />
              </g>
            </svg>
          </div>

          {/* Floating Music Notes */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { top: '10%', left: '20%', delay: '0s' },
              { top: '20%', right: '15%', delay: '0.5s' },
              { top: '70%', left: '10%', delay: '1s' },
              { top: '80%', right: '25%', delay: '1.5s' },
              { top: '30%', left: '5%', delay: '2s' },
              { top: '60%', right: '5%', delay: '2.5s' },
            ].map((note, index) => (
              <div
                key={index}
                className="absolute text-4xl text-blue-400 animate-bounce opacity-60"
                style={{
                  ...note,
                  animationDelay: note.delay,
                  animationDuration: '3s',
                }}
              >
                ♪
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <p className="text-gray-300 text-lg leading-relaxed">
            The music industry ecosystem is incredibly complex, with dozens of stakeholders, 
            rights organizations, and platforms. Our platform simplifies this complexity by 
            providing a single hub to manage all your music rights and royalties.
          </p>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </section>
  );
};

export default MusicEcosystemVisualization;