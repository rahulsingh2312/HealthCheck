import React, { useState, useEffect, useCallback } from 'react';

interface Particle {
  id: string;
  left: number;
  delay: number;
  angle: number;
  scale: number;
  speed: number;
}

interface TokenConfettiProps {
  symbol?: string;
  isActive: boolean;
}

const TokenConfetti: React.FC<TokenConfettiProps> = ({ symbol = "🪙", isActive }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const createParticle = useCallback((index: number): Particle => ({
    id: `particle-${Date.now()}-${index}`,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    angle: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    speed: 3 + Math.random() * 2
  }), []);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Initial batch of particles
    setParticles(Array.from({ length: 50 }, (_, i) => createParticle(i)));

    // Continuously add new particles
    const intervalId = setInterval(() => {
      setParticles(prev => {
        // Remove particles that have completed their animation
        const activeParticles = prev.filter(p => {
          const element = document.getElementById(p.id);
          return element?.offsetTop !== undefined && element.offsetTop < window.innerHeight;
        });
        
        // Add new particles
        const newParticles = Array.from({ length: 10 }, (_, i) => createParticle(i));
        
        return [...activeParticles, ...newParticles].slice(-100); // Keep max 100 particles
      });
    }, 200);

    return () => {
      clearInterval(intervalId);
      setParticles([]);
    };
  }, [isActive, createParticle]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          id={particle.id}
          key={particle.id}
          className="absolute -top-8 animate-confetti-fall"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.speed}s`,
            transform: `rotate(${particle.angle}deg) scale(${particle.scale})`
          } as React.CSSProperties}
        >
          <div className="text-2xl select-none">
            {symbol}
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall var(--duration, 3s) linear forwards;
        }
      `}</style>
    </div>
  );
};

export default TokenConfetti;