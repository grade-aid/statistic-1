import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

const Confetti = ({ trigger, onComplete }: ConfettiProps) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; emoji: string; left: number; delay: number }>>([]);

  useEffect(() => {
    if (trigger) {
      // Create confetti pieces
      const emojis = ['🎉', '✨', '🎊', '⭐', '🌟', '💫'];
      const pieces = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 100,
        delay: Math.random() * 1000
      }));
      
      setConfettiPieces(pieces);
      
      // Clear confetti after animation
      const timeout = setTimeout(() => {
        setConfettiPieces([]);
        onComplete?.();
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete]);

  if (!trigger || confettiPieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute text-2xl animate-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}ms`
          }}
        >
          {piece.emoji}
        </div>
      ))}
    </div>
  );
};

export default Confetti;