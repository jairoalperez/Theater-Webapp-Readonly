'use client';

import type { Variants, Transition } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import React from 'react';

const gVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear',
    },
  },
};

const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 50,
  damping: 10,
};

const LoaderPinwheelIcon = ({ isAnimating }: { isAnimating?: boolean }) => {
  const controls = useAnimation();

  // Si isAnimating es verdadero, la animación comienza automáticamente
  React.useEffect(() => {
    if (isAnimating) {
      controls.start('animate');
    } else {
      controls.start('normal');
    }
  }, [isAnimating, controls]);

  return (
    <div className="cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={controls}
        variants={gVariants}
        transition={defaultTransition}
      >
        <g>
          <path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />
          <path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />
          <path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />
        </g>
        <circle cx="12" cy="12" r="10" />
      </motion.svg>
    </div>
  );
};

export { LoaderPinwheelIcon };
