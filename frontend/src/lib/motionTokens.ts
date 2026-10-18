import { Transition, Variants } from 'framer-motion';

export const springSmooth: Transition = {
  type: 'spring',
  damping: 28,
  stiffness: 220,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: 'spring',
  damping: 24,
  stiffness: 300,
  mass: 0.8,
};

export const springStamp: Transition = {
  type: 'spring',
  damping: 18,
  stiffness: 360,
  mass: 1.1,
};

export const panelSlideVariants: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springSmooth,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  },
};

export const railSlideVariants: Variants = {
  hidden: { x: -360, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springSmooth,
  },
};

export const verdictStampVariants: Variants = {
  initial: { scale: 1.6, opacity: 0, rotate: -8 },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: -1.5,
    transition: springStamp,
  },
};

export const modalFadeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSnappy,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.16 },
  },
};
