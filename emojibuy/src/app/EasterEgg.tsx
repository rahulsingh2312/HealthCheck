import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Particle {
  id: string;
  left: number;
  delay: number;
  angle: number;
  scale: number;
  speed: number;
  symbol: string;
}

interface TokenConfettiProps {
  symbols?: string[];
  isActive: boolean;
  audioUrl?: string;
}

const TokenConfetti: React.FC<TokenConfettiProps> = ({ 
  symbols = [""], 
  isActive, 
  audioUrl 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const createParticle = useCallback((index: number, symbols: string[]): Particle => ({
    id: `particle-${Date.now()}-${index}`,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    angle: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    speed: 3 + Math.random() * 2,
    symbol: symbols[Math.floor(Math.random() * symbols.length)]
  }), []);

  // Comprehensive audio setup and playback
  useEffect(() => {
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Only attempt to play if active and audioUrl is provided
    if (isActive && audioUrl) {
      console.log('Attempting to play audio:', audioUrl);

      // Create new audio element
      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;

      // Add event listeners for debugging
      audioElement.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
      });

      audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });

      // Attempt to play
      const playPromise = audioElement.play();

      // Handle play promise
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio started playing successfully');
          })
          .catch((error) => {
            console.error('Error playing audio:', error);
            
            // Specific error handling
            if (error.name === 'NotAllowedError') {
              console.warn('Audio playback was prevented. This might be due to autoplay restrictions.');
            }
          });
      }

      // Cleanup function
      return () => {
        audioElement.pause();
        audioElement.currentTime = 0;
      };
    }
  }, [isActive, audioUrl]);

  // Particle generation and management (same as previous version)
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Initial batch of particles
    setParticles(Array.from({ length: 50 }, (_, i) => createParticle(i, symbols)));

    // Continuously add new particles
    const intervalId = setInterval(() => {
      setParticles(prev => {
        // Remove particles that have completed their animation
        const activeParticles = prev.filter(p => {
          const element = document.getElementById(p.id);
          return element?.offsetTop !== undefined && element.offsetTop < window.innerHeight;
        });

        // Add new particles
        const newParticles = Array.from({ length: 10 }, (_, i) => createParticle(i, symbols));

        return [...activeParticles, ...newParticles].slice(-100); // Keep max 100 particles
      });
    }, 200);

    return () => {
      clearInterval(intervalId);
      setParticles([]);
    };
  }, [isActive, createParticle, symbols]);

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
            {particle.symbol}
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