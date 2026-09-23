import React, { useEffect, useState } from 'react';

interface AmbientBackgroundProps {
  theme?: 'dark' | 'light';
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ theme = 'dark' }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 30 });

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Throttled mouse position for subtle dynamic lighting
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const xPercent = Math.round((e.clientX / window.innerWidth) * 100);
        const yPercent = Math.round((e.clientY / window.innerHeight) * 100);
        setMousePos({ x: xPercent, y: yPercent });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const isLight = theme === 'light';

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none transition-colors duration-500"
      aria-hidden="true"
    >
      {/* Dynamic Cursor Light Aura (Leve brilho sutil acompanhando a navegação) */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[140px] transition-all duration-700 ease-out"
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(245, 158, 11, 0.08) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 70%)',
          opacity: isLight ? 0.4 : 0.15,
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Primary Top-Right Luxury Ambient Pool */}
      <div
        className={`ambient-glow-gold absolute -top-24 -right-24 w-[750px] h-[750px] rounded-full blur-[160px] ${
          isLight
            ? 'bg-gradient-to-br from-amber-300/25 via-yellow-200/20 to-transparent'
            : 'bg-gradient-to-br from-amber-500/18 via-yellow-600/12 to-transparent'
        }`}
      />

      {/* Secondary Center-Left Atmosphere Pool */}
      <div
        className={`ambient-glow-indigo absolute top-1/3 -left-32 w-[700px] h-[700px] rounded-full blur-[170px] ${
          isLight
            ? 'bg-gradient-to-tr from-sky-200/25 via-indigo-100/20 to-transparent'
            : 'bg-gradient-to-tr from-indigo-600/14 via-blue-500/8 to-transparent'
        }`}
      />

      {/* Mid-Lower Warm Ambient Pool */}
      <div
        className={`ambient-glow-amber absolute top-2/3 right-10 w-[650px] h-[650px] rounded-full blur-[160px] ${
          isLight
            ? 'bg-gradient-to-bl from-amber-200/20 via-orange-100/15 to-transparent'
            : 'bg-gradient-to-bl from-amber-600/12 via-amber-400/8 to-transparent'
        }`}
      />

      {/* Bottom Subtle Vault / Gallery Glow */}
      <div
        className={`absolute -bottom-20 left-1/4 w-[600px] h-[500px] rounded-full blur-[150px] ${
          isLight
            ? 'bg-gradient-to-t from-emerald-200/15 via-teal-100/10 to-transparent opacity-40'
            : 'bg-gradient-to-t from-emerald-500/8 via-teal-500/5 to-transparent opacity-20'
        }`}
      />

      {/* Micro-Grid / Dot Sheen for Luxury Architectural Depth */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isLight ? 0.04 : 0.025,
          backgroundImage: isLight
            ? `radial-gradient(rgba(0, 0, 0, 0.4) 1px, transparent 1px)`
            : `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
