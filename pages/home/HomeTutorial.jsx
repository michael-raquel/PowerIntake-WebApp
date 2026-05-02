"use client";

import { useMemo, useCallback } from 'react';
import ComUserTutorial from '@/components/tutorial/ComUserTutorial';
import { useUpdateTutorial } from '@/hooks/UseUpdateTutorial';
import {
  clearTutorialPlayRequest,
  getHomeTutorialSteps,
  getTutorialPlayRequest,
  hasSeenTutorial,
  isTutorialScheduled,
  markTutorialSeen,
  setTutorialScheduled,
  TUTORIAL_IDS,
} from '@/lib/tutorialSteps/userTutorial';

export default function HomeTutorial({ userId, isManager, isAdmin, isManagerLoading }) {
  const { updateTutorial } = useUpdateTutorial();

  const homeTutorialSteps = useMemo(
    () => getHomeTutorialSteps({ isManager, isAdmin }),
    [isManager, isAdmin]
  );

  const shouldRunHomeTutorial = useMemo(() => {
    if (!userId || isManagerLoading) return false;
    const forceStart = getTutorialPlayRequest() === TUTORIAL_IDS.HOME;
    const scheduled = isTutorialScheduled(userId, TUTORIAL_IDS.HOME);
    const unseen = !hasSeenTutorial(userId, TUTORIAL_IDS.HOME);
    return forceStart || scheduled || unseen;
  }, [userId, isManagerLoading]);

  const handleHomeTutorialComplete = useCallback(() => {
    if (!userId) return;
    markTutorialSeen(userId, TUTORIAL_IDS.HOME);
    setTutorialScheduled(userId, TUTORIAL_IDS.HOME, false);
    if (getTutorialPlayRequest() === TUTORIAL_IDS.HOME) {
      clearTutorialPlayRequest();
    }
    updateTutorial({ entrauserid: userId, tutorial_name: TUTORIAL_IDS.HOME }).catch(() => {});
  }, [userId, updateTutorial]);

  return (
    <ComUserTutorial
      steps={homeTutorialSteps}
      autoStart={shouldRunHomeTutorial && !isManagerLoading}
      startDelay={1000}
      onComplete={handleHomeTutorialComplete}
    />
  );
}