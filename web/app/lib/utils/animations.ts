'use client'

export function createAnimation(
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: KeyframeAnimationOptions
): Animation {
  return new Animation(new KeyframeEffect(null, keyframes, options))
}

export const commonAnimations = {
  fadeIn: {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 200, fill: 'forwards' },
  },
  fadeOut: {
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
    options: { duration: 200, fill: 'forwards' },
  },
  slideIn: {
    keyframes: [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
    options: { duration: 300, fill: 'forwards' },
  },
  slideOut: {
    keyframes: [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(10px)', opacity: 0 }],
    options: { duration: 300, fill: 'forwards' },
  },
  scaleIn: {
    keyframes: [{ transform: 'scale(0.95)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
    options: { duration: 200, fill: 'forwards' },
  },
  scaleOut: {
    keyframes: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.95)', opacity: 0 }],
    options: { duration: 200, fill: 'forwards' },
  },
}
