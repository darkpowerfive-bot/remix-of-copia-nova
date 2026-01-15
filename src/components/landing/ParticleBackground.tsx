import { useEffect, useRef, useState, memo } from "react";

interface ParticleBackgroundProps {
  particleCount?: number;
  className?: string;
}

// Optimized: Uses CSS animations instead of canvas for GPU acceleration
// Only animates when visible via Intersection Observer
export const ParticleBackground = memo(({ particleCount = 30, className = "" }: ParticleBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [particles] = useState(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.4 + 0.1,
    }))
  );

  // Intersection Observer - only animate when visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <style>{`
        @keyframes floatParticle {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: var(--particle-opacity);
          }
          25% { 
            transform: translate(30px, -40px) scale(1.1);
            opacity: calc(var(--particle-opacity) * 1.2);
          }
          50% { 
            transform: translate(-20px, -60px) scale(0.9);
            opacity: calc(var(--particle-opacity) * 0.8);
          }
          75% { 
            transform: translate(-40px, -30px) scale(1.05);
            opacity: var(--particle-opacity);
          }
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.8) 0%, rgba(245, 158, 11, 0) 70%);
          will-change: transform, opacity;
        }
        .particle-animate {
          animation: floatParticle var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        .particle-paused {
          animation-play-state: paused;
        }
      `}</style>
      
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`particle ${isVisible ? 'particle-animate' : 'particle-paused'}`}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size * 4}px`,
            height: `${particle.size * 4}px`,
            '--particle-opacity': particle.opacity,
            '--duration': `${particle.duration}s`,
            '--delay': `${particle.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

ParticleBackground.displayName = 'ParticleBackground';
