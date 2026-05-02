"use client";

import { useMemo, useCallback } from "react";
import ComUserTutorial from "@/components/tutorial/ComUserTutorial";
import { useUpdateTutorial } from "@/hooks/UseUpdateTutorial";
import {
  clearTutorialPlayRequest,
  getManageTutorialSteps,
  getTutorialPlayRequest,
  hasSeenTutorial,
  isTutorialScheduled,
  markTutorialSeen,
  setTutorialScheduled,
  TUTORIAL_IDS,
} from "@/lib/tutorialSteps/userTutorial";

export default function ManageTutorial({ userId, isManager, isAdmin, isManagerLoading }) {
  const { updateTutorial } = useUpdateTutorial();

  const manageTutorialSteps = useMemo(
    () => getManageTutorialSteps({ isManager, isAdmin }),
    [isManager, isAdmin]
  );

  const shouldRunManageTutorial = useMemo(() => {
    if (!userId || isManagerLoading || manageTutorialSteps.length === 0) return false;
    const forceStart = getTutorialPlayRequest() === TUTORIAL_IDS.MANAGE;
    const scheduled = isTutorialScheduled(userId, TUTORIAL_IDS.MANAGE);
    const unseen = !hasSeenTutorial(userId, TUTORIAL_IDS.MANAGE);
    return forceStart || scheduled || unseen;
  }, [userId, isManagerLoading, manageTutorialSteps.length]);

  const runWindowHelper = useCallback((helperName, retries = 40, delayMs = 150) => {
    return new Promise((resolve) => {
      let attempt = 0;
      const tryRun = () => {
        const helper = window?.[helperName];
        if (typeof helper === "function") { helper(); resolve(true); return; }
        attempt += 1;
        if (attempt >= retries) { resolve(false); return; }
        setTimeout(tryRun, delayMs);
      };
      tryRun();
    });
  }, []);

  const waitForElement = useCallback((selector, retries = 40, delayMs = 150) => {
    return new Promise((resolve) => {
      if (typeof selector !== "string" || !selector.trim()) { resolve(false); return; }
      let attempt = 0;
      const tryFind = () => {
        if (document.querySelector(selector)) { resolve(true); return; }
        attempt += 1;
        if (attempt >= retries) { resolve(false); return; }
        setTimeout(tryFind, delayMs);
      };
      tryFind();
    });
  }, []);

  const handleManageTutorialBeforeStart = useCallback(async () => {
    const firstStepId = manageTutorialSteps[0]?.id;
    if (firstStepId === "manage-my-team-tab") {
      await runWindowHelper("__tutorialOpenManageTeam");
      await waitForElement('[data-tutorial="manage-my-team-tab"]', 40, 150);
      return;
    }
    if (firstStepId === "manage-my-company-tab") {
      await runWindowHelper("__tutorialOpenManageCompany");
      await waitForElement('[data-tutorial="manage-my-company-tab"]', 40, 150);
    }
  }, [manageTutorialSteps, runWindowHelper, waitForElement]);

  const handleManageTutorialNextStep = useCallback(async ({ currentStep, nextStep }) => {
    if (
      (currentStep?.id === "manage-my-team-tab" || currentStep?.id === "manage-my-team-body") &&
      nextStep?.id === "manage-my-company-tab"
    ) {
      await runWindowHelper("__tutorialOpenManageCompany");
      await waitForElement('[data-tutorial="manage-my-company-tab"]', 40, 150);
    }
  }, [runWindowHelper, waitForElement]);

  const handleManageTutorialPrevStep = useCallback(async ({ currentStep, nextStep }) => {
    if (
      currentStep?.id === "manage-my-company-tab" &&
      (nextStep?.id === "manage-my-team-tab" || nextStep?.id === "manage-my-team-body")
    ) {
      await runWindowHelper("__tutorialOpenManageTeam");
      await waitForElement(
        nextStep?.id === "manage-my-team-tab"
          ? '[data-tutorial="manage-my-team-tab"]'
          : '[data-tutorial="manage-my-team-body"]',
        40,
        150
      );
    }
  }, [runWindowHelper, waitForElement]);

  const handleManageTutorialComplete = useCallback(() => {
    if (!userId) return;
    markTutorialSeen(userId, TUTORIAL_IDS.MANAGE);
    setTutorialScheduled(userId, TUTORIAL_IDS.MANAGE, false);
    if (getTutorialPlayRequest() === TUTORIAL_IDS.MANAGE) {
      clearTutorialPlayRequest();
    }
    updateTutorial({ entrauserid: userId, tutorial_name: TUTORIAL_IDS.MANAGE }).catch(() => {});
  }, [userId, updateTutorial]);

  return (
    <ComUserTutorial
      steps={manageTutorialSteps}
      autoStart={Boolean(shouldRunManageTutorial) && manageTutorialSteps.length > 0}
      startDelay={1000}
      onBeforeStart={handleManageTutorialBeforeStart}
      onNextStep={handleManageTutorialNextStep}
      onPrevStep={handleManageTutorialPrevStep}
      onComplete={handleManageTutorialComplete}
    />
  );
}