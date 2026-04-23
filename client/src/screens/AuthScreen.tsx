import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { SPRING_SNAPPY } from '@/lib/motion';

// Animated soundwave background canvas
function SoundwaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Draw subtle horizontal wave lines
      const lineCount = 12;
      const spacing = h / (lineCount + 1);

      for (let i = 0; i < lineCount; i++) {
        const baseY = spacing * (i + 1);
        const opacity = 0.03 + 0.02 * Math.sin(i * 0.5 + time * 0.3);
        const amplitude = 8 + 6 * Math.sin(i * 0.7 + time * 0.2);
        const frequency = 0.003 + 0.001 * Math.sin(i * 0.3);
        const speed = 0.5 + i * 0.1;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.lineWidth = 1;

        for (let x = 0; x <= w; x += 3) {
          const y = baseY +
            amplitude * Math.sin(x * frequency + time * speed * 0.02) +
            (amplitude * 0.5) * Math.sin(x * frequency * 2.3 + time * speed * 0.015 + i);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw dot grid that fades at edges
      const dotSpacing = 40;
      const dotRadius = 0.8;
      const centerX = w / 2;
      const centerY = h / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let x = dotSpacing; x < w; x += dotSpacing) {
        for (let y = dotSpacing; y < h; y += dotSpacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const fade = Math.max(0, 1 - dist / (maxDist * 0.7));
          const pulse = 0.02 + 0.01 * Math.sin(x * 0.01 + y * 0.01 + time * 0.5);

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${fade * pulse})`;
          ctx.fill();
        }
      }

      time += 1;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 1 }}
      aria-hidden="true"
    />
  );
}

export function AuthScreen() {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useStore((s) => s.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = displayName.trim();
    if (!trimmed) { setError('Please enter your name.'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!res.ok) { 
        const data = await res.json(); 
        setError(data.error || data.message || 'Something went wrong.'); 
        return; 
      }
      setUser((await res.json()).user);
    } catch { setError('Could not connect to the server.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden" style={{ backgroundColor: '#050507' }}>

      <SoundwaveBackground />

      {/* Accent glow - flat color with blur, no gradient */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          backgroundColor: 'rgba(139,92,246,0.06)',
          filter: 'blur(100px)',
        }}
      />

      {/* Content */}
      <div className="w-full max-w-[380px] relative z-10">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-6"
          >
            <img
              src="/logo.svg"
              alt="Fathom"
              className="w-24 h-24"
              style={{
                filter: 'drop-shadow(0 0 50px rgba(139,92,246,0.4)) drop-shadow(0 0 100px rgba(139,92,246,0.15))',
              }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="text-display"
            style={{ color: 'var(--text-primary)' }}
          >
            Fathom
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-body mt-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Learn anything through AI podcasts
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 p-6 rounded-2xl"
          style={{
            backgroundColor: 'rgba(20, 20, 22, 0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 16px 64px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <label htmlFor="displayName" className="text-caption block mb-2 text-[var(--text-tertiary)]">
              Your name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              autoFocus
              aria-label="Display name"
              className="w-full min-h-[48px] sm:min-h-[40px] rounded-xl text-body px-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-[3px] transition-all duration-200"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-body text-[var(--error)]" role="alert">
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02, boxShadow: '0 4px 24px rgba(139,92,246,0.4)' } : undefined}
            whileTap={!isLoading ? { scale: 0.98 } : undefined}
            transition={SPRING_SNAPPY}
            aria-label={isLoading ? 'Creating account' : 'Start Learning'}
            className="w-full min-h-[48px] sm:min-h-[40px] rounded-xl px-4 py-3.5 text-body font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-[3px] transition-all duration-200"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 2px 16px rgba(139,92,246,0.3)' }}
          >
            {isLoading ? 'Creating account...' : 'Start Learning'}
          </motion.button>

          {/* Screen reader announcement for loading state */}
          <div role="status" aria-live="polite" className="sr-only">
            {isLoading ? 'Creating your account, please wait.' : ''}
          </div>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-caption text-[var(--text-muted)]"
        >
          No account needed. Your data stays on this device.
        </motion.p>
      </div>
    </div>
  );
}
