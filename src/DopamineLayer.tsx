import React, { useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  shape: 'circle' | 'square' | 'star';
}

interface DopamineLayerProps {
  triggerConfetti: boolean;
  triggerCelebration: boolean;
  onComplete?: () => void;
}

const COLORS = [
  'var(--mauve)',
  'var(--pink)',
  'var(--green)',
  'var(--teal)',
  'var(--blue)',
  'var(--lavender)',
  'var(--sapphire)',
  'var(--peach)',
];

const DopamineLayer: React.FC<DopamineLayerProps> = ({
  triggerConfetti,
  triggerCelebration,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const createParticles = useCallback((count: number = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: 50 + (Math.random() - 0.5) * 40,
        y: 50 + (Math.random() - 0.5) * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        velocityX: (Math.random() - 0.5) * 100,
        velocityY: -50 - Math.random() * 100,
        rotation: Math.random() * 360,
        shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as Particle['shape'],
      });
    }
    return newParticles;
  }, []);

  useEffect(() => {
    if (triggerConfetti) {
      const newParticles = createParticles(15);
      setParticles(newParticles);

      // Play a subtle "ding" sound
      playCompletionSound();

      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([]);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [triggerConfetti, createParticles]);

  useEffect(() => {
    if (triggerCelebration) {
      setShowCelebration(true);
      const newParticles = createParticles(30);
      setParticles(newParticles);

      // Play celebration sound
      playCelebrationSound();

      const timer = setTimeout(() => {
        setShowCelebration(false);
        setParticles([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [triggerCelebration, createParticles, onComplete]);

  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not available, silently fail
    }
  };

  const playCelebrationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);

        oscillator.start(audioContext.currentTime + i * 0.15);
        oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3);
      });
    } catch (e) {
      // Audio not available, silently fail
    }
  };

  const renderShape = (particle: Particle) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      backgroundColor: particle.color,
      borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'square' ? '2px' : '0',
      transform: `rotate(${particle.rotation}deg)`,
      animation: `confetti-fall 1s ease-out forwards`,
      animationDelay: `${Math.random() * 0.1}s`,
      opacity: 0,
    };

    if (particle.shape === 'star') {
      return (
        <div
          key={particle.id}
          style={{
            ...style,
            backgroundColor: 'transparent',
            width: 0,
            height: 0,
            borderLeft: `${particle.size / 2}px solid transparent`,
            borderRight: `${particle.size / 2}px solid transparent`,
            borderBottom: `${particle.size}px solid ${particle.color}`,
          }}
        />
      );
    }

    return <div key={particle.id} style={style} />;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {particles.map(renderShape)}

      {showCelebration && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--green)',
            textShadow: '0 0 20px rgba(166, 227, 161, 0.5)',
            animation: 'celebration-pop 0.5s ease-out forwards',
            whiteSpace: 'nowrap',
          }}
        >
          ✨ Task Complete! ✨
        </div>
      )}
    </div>
  );
};

export default DopamineLayer;
