'use client';
import { useEffect } from 'react';

/**
 * ClickEffectProvider adds tactile physical and visual feedback across the application:
 * 1. Generates an expanding ripple wave directly centered on the click/touch point.
 * 2. Triggers micro-haptic feedback via navigator.vibrate on mobile devices.
 */
export function ClickEffectProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Find closest interactive element
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest('button, [role="button"], a, input[type="submit"], input[type="button"], .interactive-tap') as HTMLElement | null;
      if (!interactive || interactive.hasAttribute('disabled') || interactive.getAttribute('aria-disabled') === 'true') {
        return;
      }

      // 1. Mobile Physical Haptic Feedback
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        try {
          navigator.vibrate(12); // Short, satisfying tactile tick
        } catch {
          // Ignore if vibration is restricted by browser policy
        }
      }

      // 2. Visual Tactile Ripple Wave
      const rect = interactive.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'tap-ripple-effect';

      // Position ripple centered at the pointer coordinates relative to the button
      const size = Math.max(rect.width, rect.height) * 1.5;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Ensure button can contain ripple without breaking layout
      const originalPosition = window.getComputedStyle(interactive).position;
      if (originalPosition === 'static') {
        interactive.style.position = 'relative';
      }
      interactive.classList.add('has-tap-ripple');
      interactive.appendChild(ripple);

      // Clean up after animation finishes
      const removeRipple = () => {
        ripple.remove();
        if (interactive && !interactive.querySelector('.tap-ripple-effect')) {
          interactive.classList.remove('has-tap-ripple');
        }
      };

      ripple.addEventListener('animationend', removeRipple, { once: true });
      setTimeout(removeRipple, 450);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return <>{children}</>;
}
