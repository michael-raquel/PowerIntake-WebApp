"use client";

import { useEffect, useMemo, useCallback } from 'react';
import ComUserTutorial from '@/components/tutorial/ComUserTutorial';
import { useUpdateTutorial } from '@/hooks/UseUpdateTutorial';
import {
  clearTutorialPlayRequest,
  getTutorialPlayRequest,
  getTicketOpeningTutorialSteps,
  getTicketTutorialSteps,
  hasSeenTutorial,
  isTutorialScheduled,
  markTutorialSeen,
  setTutorialScheduled,
  TUTORIAL_IDS,
} from '@/lib/tutorialSteps/userTutorial';

export default function TicketTutorial({
  userId,
  isManager,
  isAdmin,
  isManagerLoading,
  shouldRunTicketTutorial,
  setShouldRunTicketTutorial,
  shouldRunTicketOpeningTutorial,
  setShouldRunTicketOpeningTutorial,
  setShowCreateTicket,
  setShouldRunCreateTutorial,
}) {
  const { updateTutorial } = useUpdateTutorial();

  const ticketTutorialSteps = useMemo(
    () => getTicketTutorialSteps({ isManager, isAdmin }),
    [isManager, isAdmin]
  );

  const ticketOpeningTutorialSteps = useMemo(
    () => getTicketOpeningTutorialSteps(),
    []
  );

  const isManagerCheckReady = Boolean(userId) && !isManagerLoading;

  const runWindowHelper = useCallback((helperName, retries = 40, delayMs = 150) => {
    return new Promise((resolve) => {
      let attempt = 0;
      const tryRun = () => {
        const helper = window?.[helperName];
        if (typeof helper === 'function') {
          helper();
          resolve(true);
          return;
        }
        attempt += 1;
        if (attempt >= retries) {
          resolve(false);
          return;
        }
        setTimeout(tryRun, delayMs);
      };
      tryRun();
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const requested = getTutorialPlayRequest();
    const forceCreate = requested === TUTORIAL_IDS.CREATE;
    const forceTicketList = requested === TUTORIAL_IDS.TICKET_LIST || requested === TUTORIAL_IDS.TICKET;
    const forceTicketOpening = requested === TUTORIAL_IDS.TICKET_OPENING;
    const createScheduled = isTutorialScheduled(userId, TUTORIAL_IDS.CREATE);
    const ticketListScheduled = isTutorialScheduled(userId, TUTORIAL_IDS.TICKET_LIST) || isTutorialScheduled(userId, TUTORIAL_IDS.TICKET);
    const openingScheduled = isTutorialScheduled(userId, TUTORIAL_IDS.TICKET_OPENING);

    if (typeof setShouldRunCreateTutorial === 'function') {
      setShouldRunCreateTutorial(forceCreate || createScheduled || !hasSeenTutorial(userId, TUTORIAL_IDS.CREATE));
    }

    if (forceCreate && typeof setShowCreateTicket === 'function') {
      setShowCreateTicket(true);
    }

    if (!isManagerCheckReady) return;

    if (typeof setShouldRunTicketTutorial === 'function') {
      setShouldRunTicketTutorial(
        forceTicketList || ticketListScheduled || (!requested && !hasSeenTutorial(userId, TUTORIAL_IDS.TICKET_LIST) && !hasSeenTutorial(userId, TUTORIAL_IDS.TICKET))
      );
    }

    if (forceTicketOpening || openingScheduled) {
      runWindowHelper('__tutorialInjectDummy').catch(() => {});
      if (typeof setShouldRunTicketOpeningTutorial === 'function') {
        setShouldRunTicketOpeningTutorial(false);
      }
      return;
    }

    if (typeof setShouldRunTicketOpeningTutorial === 'function') {
      setShouldRunTicketOpeningTutorial(false);
    }
  }, [
    userId,
    isManagerCheckReady,
    runWindowHelper,
    setShouldRunCreateTutorial,
    setShowCreateTicket,
    setShouldRunTicketTutorial,
    setShouldRunTicketOpeningTutorial,
  ]);

  const waitForElement = useCallback((selector, retries = 40, delayMs = 150) => {
    return new Promise((resolve) => {
      if (typeof selector !== 'string' || !selector.trim()) {
        resolve(false);
        return;
      }
      let attempt = 0;
      const tryFind = () => {
        if (document.querySelector(selector)) {
          resolve(true);
          return;
        }
        attempt += 1;
        if (attempt >= retries) {
          resolve(false);
          return;
        }
        setTimeout(tryFind, delayMs);
      };
      tryFind();
    });
  }, []);

  const waitForAnyElement = useCallback((selectors, retries = 40, delayMs = 150) => {
    return new Promise((resolve) => {
      let attempt = 0;
      const tryFind = () => {
        const found = selectors.some((selector) => document.querySelector(selector));
        if (found) {
          resolve(true);
          return;
        }
        attempt += 1;
        if (attempt >= retries) {
          resolve(false);
          return;
        }
        setTimeout(tryFind, delayMs);
      };
      tryFind();
    });
  }, []);

  const cleanupTicketTutorialArtifacts = useCallback(() => {
    if (window.__tutorialCloseDummyTicket) window.__tutorialCloseDummyTicket();
    if (window.__tutorialRemoveDummy) window.__tutorialRemoveDummy();
  }, []);

  const handleTicketListTutorialBeforeStart = useCallback(async () => {
    await waitForElement('[data-tutorial="ticket-tabs"]', 45, 150);
    await runWindowHelper('__tutorialInjectDummy');
    await waitForAnyElement([
      '[data-tutorial="ticket-dummy-row-mobile"]',
      '[data-tutorial="ticket-dummy-row-desktop"]',
    ], 45, 150);
  }, [runWindowHelper, waitForAnyElement, waitForElement]);

  const handleTicketOpeningTutorialBeforeStart = useCallback(async () => {
    await runWindowHelper('__tutorialOpenDummyTicket');
    await waitForElement('[data-tutorial="dialog-overview"]', 45, 150);
  }, [runWindowHelper, waitForElement]);

  const handleTicketListTutorialComplete = useCallback(() => {
    if (!userId) return;
    markTutorialSeen(userId, TUTORIAL_IDS.TICKET_LIST);
    setTutorialScheduled(userId, TUTORIAL_IDS.TICKET_LIST, false);
    setTutorialScheduled(userId, TUTORIAL_IDS.TICKET, false);
    if (
      getTutorialPlayRequest() === TUTORIAL_IDS.TICKET_LIST ||
      getTutorialPlayRequest() === TUTORIAL_IDS.TICKET
    ) {
      clearTutorialPlayRequest();
    }
    if (typeof setShouldRunTicketTutorial === 'function') setShouldRunTicketTutorial(false);
    updateTutorial({ entrauserid: userId, tutorial_name: TUTORIAL_IDS.TICKET_LIST }).catch(() => {});
  }, [userId, setShouldRunTicketTutorial, updateTutorial]);

  const handleTicketOpeningTutorialComplete = useCallback(() => {
    cleanupTicketTutorialArtifacts();
    if (!userId) return;
    markTutorialSeen(userId, TUTORIAL_IDS.TICKET_OPENING);
    setTutorialScheduled(userId, TUTORIAL_IDS.TICKET_OPENING, false);
    if (getTutorialPlayRequest() === TUTORIAL_IDS.TICKET_OPENING) {
      clearTutorialPlayRequest();
    }
    if (typeof setShouldRunTicketOpeningTutorial === 'function') setShouldRunTicketOpeningTutorial(false);
    updateTutorial({ entrauserid: userId, tutorial_name: TUTORIAL_IDS.TICKET_OPENING }).catch(() => {});
  }, [cleanupTicketTutorialArtifacts, userId, setShouldRunTicketOpeningTutorial, updateTutorial]);

  return (
    <>
      <ComUserTutorial
        steps={ticketTutorialSteps}
        autoStart={Boolean(shouldRunTicketTutorial) && ticketTutorialSteps.length > 0}
        startDelay={1000}
        onBeforeStart={handleTicketListTutorialBeforeStart}
        onComplete={handleTicketListTutorialComplete}
      />
      <ComUserTutorial
        steps={ticketOpeningTutorialSteps}
        autoStart={Boolean(shouldRunTicketOpeningTutorial) && !shouldRunTicketTutorial && ticketOpeningTutorialSteps.length > 0}
        startDelay={600}
        onBeforeStart={handleTicketOpeningTutorialBeforeStart}
        onComplete={handleTicketOpeningTutorialComplete}
      />
    </>
  );
}