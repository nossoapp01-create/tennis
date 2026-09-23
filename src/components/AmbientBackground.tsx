import React, { useEffect, useState } from 'react';

export const AmbientBackground: React.FC = () => {
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

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Dynamic Cursor Light Aura (Leve brilho sutil acompanhando a navegação) */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-15 transition-all duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 70%)',
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Primary Top-Right Luxury Gold Ambient Pool */}
      <div className="ambient-glow-gold absolute -top-24 -right-24 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-amber-500/18 via-yellow-600/12 to-transparent blur-[160px]" />

      {/* Secondary Center-Left Deep Sapphire Atmosphere Pool */}
      <div className="ambient-glow-indigo absolute top-1/3 -left-32 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-indigo-600/14 via-blue-500/8 to-transparent blur-[170px]" />

      {/* Mid-Lower Warm Amber Ambient Pool */}
      <div className="ambient-glow-amber absolute top-2/3 right-10 w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-amber-600/12 via-amber-400/8 to-transparent blur-[160px]" />

      {/* Bottom Emerald Subtle Vault Glow */}
      <div className="absolute -bottom-20 left-1/4 w-[600px] h-[500px] rounded-full bg-gradient-to-t from-emerald-500/8 via-teal-500/5 to-transparent blur-[150px] opacity-20" />

      {/* Ultra-subtle Micro-Grid / Dot Sheen for Luxury Architectural Depth */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
