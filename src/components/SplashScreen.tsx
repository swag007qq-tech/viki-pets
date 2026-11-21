import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { BackgroundWaves } from './BackgroundWaves';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onCompleteRef.current();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      role="presentation"
      aria-label="Viki pets"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onComplete}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#FDF5EE] select-none"
    >
      <BackgroundWaves />

      <div className="relative z-10 flex items-center justify-center px-6">
        {/* Soft warm ambient glow behind the mascot logo */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: [0, 0.85, 0.65], scale: [0.75, 1.06, 1] }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="pointer-events-none absolute h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(235,204,182,0.65)_0%,rgba(253,245,238,0)_72%)] sm:h-[360px] sm:w-[360px] md:h-[420px] md:w-[420px]"
        />

        {/* Animated Viki pets logo (no spinner or loading indicator) */}
        <motion.img
          src="/assets/viki-splash-logo.png"
          alt="Viki pets"
          draggable={false}
          initial={{ opacity: 0, scale: 0.82, y: 18 }}
          animate={{
            opacity: 1,
            scale: [0.82, 1.04, 1],
            y: [18, -4, 0, -5, 0],
          }}
          transition={{
            opacity: { duration: 0.5, ease: 'easeOut' },
            scale: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 2, ease: 'easeInOut' },
          }}
          className="relative h-auto w-[230px] max-w-[78vw] object-contain drop-shadow-[0_14px_30px_rgba(128,89,65,0.16)] sm:w-[310px] md:w-[360px]"
        />
      </div>
    </motion.div>
  );
}
