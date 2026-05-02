"use client";

import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function ComUserTutorial({
  steps = [],
  autoStart = false,
  startDelay = 1000,
  onBeforeStart,
  onAfterStart,
  onNextStep,
  onPrevStep,
  onComplete,
}) {
  const driverRef = useRef(null);
  const stepRef = useRef(0);
  const hasStartedRef = useRef(false);
  const internalDestroyRef = useRef(false);
  const completedRef = useRef(false);

  const finishTutorial = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const destroyActiveDriver = useCallback(() => {
    const activeDriver = driverRef.current;
    if (!activeDriver) return;
    driverRef.current = null;
    internalDestroyRef.current = true;
    activeDriver.destroy();
  }, []);

  const handleMove = useCallback(
    async (direction, activeDriver) => {
      const currentIndex = stepRef.current;
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      const currentStep = steps[currentIndex];
      const nextStep = steps[nextIndex];
      const handler = direction === 'next' ? onNextStep : onPrevStep;

      if (handler) {
        const shouldContinue = await handler({
          direction,
          currentIndex,
          nextIndex,
          currentStep,
          nextStep,
          driver: activeDriver,
        });

        if (shouldContinue === false) {
          return;
        }
      }

      stepRef.current = nextIndex;

      if (direction === 'next') {
        activeDriver.moveNext();
      } else {
        activeDriver.movePrevious();
      }
    },
    [steps, onNextStep, onPrevStep]
  );

  const startTutorial = useCallback(async () => {
    if (!Array.isArray(steps) || steps.length === 0) return;

    destroyActiveDriver();
    completedRef.current = false;
    stepRef.current = 0;

    if (onBeforeStart) {
      try {
        await onBeforeStart();
      } catch (error) {
        console.error('Tutorial onBeforeStart failed:', error);
      }
    }

    const tour = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      disableActiveInteraction: true,
      overlayClickBehavior: 'close',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done ✓',
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: 'tutorial-popover',
      steps,
      onPopoverRender: (popover, { driver: activeDriver }) => {
        const existingSkip = popover.footerButtons.querySelector('[data-tutorial-skip="true"]');
        if (!existingSkip) {
          const skipBtn = document.createElement('button');
          skipBtn.type = 'button';
          skipBtn.textContent = 'Skip';
          skipBtn.setAttribute('data-tutorial-skip', 'true');
          skipBtn.addEventListener('click', () => {
            finishTutorial();
            activeDriver.destroy();
          });

          popover.footerButtons.prepend(skipBtn);
        }

        requestAnimationFrame(() => {
          const progressEl = document.querySelector('.driver-popover-progress-text');
          if (!progressEl) return;
          progressEl.textContent = `${Math.min(stepRef.current + 1, steps.length)} of ${steps.length}`;
        });
      },
      onNextClick: async (_element, _step, { driver: activeDriver }) => {
        await handleMove('next', activeDriver);
      },
      onPrevClick: async (_element, _step, { driver: activeDriver }) => {
        await handleMove('prev', activeDriver);
      },
      onDestroyStarted: (_element, _step, { driver: activeDriver }) => {
        if (internalDestroyRef.current) {
          internalDestroyRef.current = false;
          activeDriver.destroy();
          return;
        }

        finishTutorial();
        activeDriver.destroy();
      },
    });

    driverRef.current = tour;
    tour.drive();
    onAfterStart?.();
  }, [steps, destroyActiveDriver, onBeforeStart, finishTutorial, handleMove, onAfterStart]);

  useEffect(() => {
    if (!autoStart) return;
    if (!Array.isArray(steps) || steps.length === 0) return;
    if (hasStartedRef.current) return;

    const timer = setTimeout(() => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;
      startTutorial();
    }, startDelay);

    return () => clearTimeout(timer);
  }, [autoStart, steps, startDelay, startTutorial]);

  useEffect(() => () => {
    destroyActiveDriver();
  }, [destroyActiveDriver]);

  return null;
}