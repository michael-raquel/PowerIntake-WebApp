const isCreateMobileLayout = () => typeof window !== 'undefined' && window.innerWidth < 1024;
const isTicketMobileLayout = () => typeof window !== 'undefined' && window.innerWidth < 768;

export const TUTORIAL_IDS = {
  HOME: 'home',
  CREATE: 'create',
  TICKET: 'ticket',
  TICKET_LIST: 'ticket-list',
  TICKET_OPENING: 'ticket-opening',
  MANAGE: 'manage',
};

const TUTORIAL_PLAY_REQUEST_KEY = 'sparta_tutorial_play_request';
const getTutorialScheduleKey = (entrauserid) => `sparta_tutorial_schedule:${entrauserid || 'anonymous'}`;

const getCreateUserInfoSelector = () => (
  isCreateMobileLayout()
    ? '[data-tutorial="create-user-info-mobile"]'
    : '[data-tutorial="create-user-info"]'
);

const getTicketTableSelector = () => (
  isTicketMobileLayout()
    ? '[data-tutorial="ticket-table-area-mobile"]'
    : '[data-tutorial="ticket-table-area"]'
);

const getDummyTicketSelector = () => (
  isTicketMobileLayout()
    ? '[data-tutorial="ticket-dummy-row-mobile"]'
    : '[data-tutorial="ticket-dummy-row-desktop"]'
);

const getTicketTabsSelector = () => '[data-tutorial="ticket-tabs"]';

const getDialogPanelTabsSelector = () => '[data-tutorial="dialog-panel-tabs"]';

const CREATE_STEPS = [
  {
    id: 'create-user-info',
    element: getCreateUserInfoSelector(),
    popover: {
      title: '👤 Your Information',
      description: 'These fields are pre-filled from your account profile, your name, email, department, and contact details.',
      side: 'right',
      align: 'start',
    },
  },
  {
    id: 'create-title-desc',
    element: '[data-tutorial="create-title-desc"]',
    popover: {
      title: '📝 Describe Your Issue',
      description: 'Enter a clear title and a detailed description of your issue. The more detail you provide, the faster we can help. Tip: you can use PowerSuite AI to get suggested fixes before escalating into a ticket.',
      side: 'right',
      align: 'start',
    },
  },
  {
    id: 'create-support-call',
    element: '[data-tutorial="create-support-call"]',
    popover: {
      title: '📅 Schedule a Support Call',
      description: 'Request a scheduled support call. Pick a date and time window when you\'re available for a technician to contact you.',
      side: 'right',
      align: 'start',
    },
  },
  {
    id: 'create-attachments',
    element: '[data-tutorial="create-attachments"]',
    popover: {
      title: '📎 Attachments',
      description: 'Upload screenshots or images that help illustrate the issue. Drag and drop or click to select files.',
      side: 'left',
      align: 'start',
    },
  },
  {
    id: 'create-submit',
    element: '[data-tutorial="create-submit-btn"]',
    popover: {
      title: '🚀 Submit Your Request',
      description: 'When everything looks good, click Submit to send your support request. Click Next to continue into ticket monitoring.',
      side: 'top',
      align: 'end',
    },
  },
];

const TICKET_OPENING_STEPS = [
  {
    id: 'dialog-overview',
    element: '[data-tutorial="dialog-overview"]',
    popover: {
      title: '🗂️ Ticket Details Overview',
      description: 'See the full ticket view, including the issue summary, requester details, and support call information.',
      side: 'left',
      align: 'start',
    },
  },
  {
    id: 'dialog-panel-tabs',
    element: getDialogPanelTabsSelector(),
    popover: {
      title: '📚 Ticket Panels',
      description: 'This is the full panel rail for Notes, User Information, Resolution, Attachments, and Timeline.',
      side: 'right',
      align: 'start',
    },
  },
  {
    id: 'dialog-reactivate',
    element: '[data-tutorial="dialog-reactivate-btn"]',
    popover: {
      title: '🔄 Reactivate Ticket',
      description: 'If the issue returns, use this button to reopen a resolved or cancelled ticket.',
      side: 'bottom',
      align: 'start',
    },
  },
];

const getHomeSteps = ({ isManager = false, isAdmin = false }) => {
  const steps = [
    {
      id: 'home-my-ticket-tab',
      element: '[data-tutorial="home-my-tickets-tab"]',
      popover: {
        title: '🎫 Your Tickets Tab',
        description: 'This is your personal workspace. All tickets you\'ve submitted appear here.',
        side: 'bottom',
        align: 'start',
      },
    },
  ];

  if (isManager) {
    steps.push({
      id: 'home-my-team-tab',
      element: '[data-tutorial="home-my-team-tab"]',
      popover: {
        title: '👥 My Team Tab',
        description: 'View all tickets submitted by your team members.',
        side: 'bottom',
        align: 'start',
      },
    });
  }

  if (isAdmin) {
    steps.push({
      id: 'home-my-company-tab',
      element: '[data-tutorial="home-my-company-tab"]',
      popover: {
        title: '🏢 My Company Tab',
        description: 'View all tickets submitted across the company in one place.',
        side: 'bottom',
        align: 'start',
      },
    });
  }

  steps.push(
    {
      id: 'home-stat-cards',
      element: '[data-tutorial="home-stat-cards"]',
      popover: {
        title: '📊 Ticket Summary',
        description: 'A quick overview of your tickets, total, new, in progress, and completion rate.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      id: 'home-recent-tickets',
      element: '[data-tutorial="home-recent-tickets"]',
      popover: {
        title: '🕒 Recent Tickets',
        description: 'Your 5 most recent active tickets, each showing the status, category, and assigned technician.',
        side: 'top',
        align: 'start',
      },
    },
    // {
    //   id: 'home-submit',
    //   element: '[data-tutorial="home-submit-btn"]',
    //   popover: {
    //     title: '✉️ Submit a Ticket',
    //     description: 'Use this button to open a new support request.',
    //     side: 'bottom',
    //     align: 'end',
    //   },
    // }
  );

  return steps;
};

const getTicketSteps = () => [
  {
    id: 'ticket-tabs',
    element: '[data-tutorial="ticket-tabs"]',
    popover: {
      title: '🎫 Ticket Tabs',
      description: 'Use this tab bar to switch between the ticket views available to your role.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    id: 'ticket-table',
    element: getTicketTableSelector(),
    popover: {
      title: '📋 Tickets List',
      description: 'All submitted tickets appear here. You can search, filter by status or category, and sort by any column.',
      side: 'top',
      align: 'start',
    },
  },
  {
    id: 'ticket-open-dummy',
    element: getDummyTicketSelector(),
    popover: {
      title: '🔍 Example Ticket',
      description: 'This sample row opens the ticket details flow. Click it to continue into the opening tutorial.',
      side: 'top',
      align: 'start',
      nextBtnText: 'Done',
    },
  },
];

const getTicketOpeningSteps = () => TICKET_OPENING_STEPS;

const getManageSteps = ({ isManager = false, isAdmin = false }) => {
  const steps = [];

  if (isManager) {
    steps.push({
      id: 'manage-my-team-tab',
      element: '[data-tutorial="manage-my-team-tab"]',
      popover: {
        title: '👥 Manage: My Team',
        description: 'View and track your team\'s overall ticket status from this tab.',
        side: 'bottom',
        align: 'start',
      },
    });

    steps.push({
      id: 'manage-my-team-body',
      element: '[data-tutorial="manage-my-team-body"]',
      popover: {
        title: '📊 Team Users Summary',
        description: 'See your team members, their ticket counts, and overall progress at a glance.',
        side: 'top',
        align: 'start',
      },
    });
  }

  if (isAdmin) {
    steps.push({
      id: 'manage-my-company-tab',
      element: '[data-tutorial="manage-my-company-tab"]',
      popover: {
        title: '🏢 Manage: My Company',
        description: 'Admins can view and monitor all company-wide tickets from here.',
        side: 'bottom',
        align: 'start',
      },
    });

    steps.push({
      id: 'manage-my-company-body',
      element: '[data-tutorial="manage-my-company-body"]',
      popover: {
        title: '📊 Company Users Summary',
        description: 'See all users company-wide, their ticket counts, and overall progress.',
        side: 'top',
        align: 'start',
      },
    });
  }

  return steps;
};

export const getHomeTutorialSteps = ({ isManager = false, isAdmin = false } = {}) =>
  getHomeSteps({ isManager, isAdmin });

export const getCreateTutorialSteps = () => CREATE_STEPS;

export const getTicketTutorialSteps = ({ isManager = false, isAdmin = false } = {}) => [
  ...getTicketSteps({ isManager, isAdmin }),
];

export const getTicketOpeningTutorialSteps = () => getTicketOpeningSteps();

export const getManageTutorialSteps = ({ isManager = false, isAdmin = false } = {}) =>
  getManageSteps({ isManager, isAdmin });

export const requestTutorialPlay = (tutorialId) => {
  if (typeof window === 'undefined' || !tutorialId) return;
  window.sessionStorage.setItem(TUTORIAL_PLAY_REQUEST_KEY, String(tutorialId));
};

export const getTutorialPlayRequest = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(TUTORIAL_PLAY_REQUEST_KEY);
};

export const clearTutorialPlayRequest = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(TUTORIAL_PLAY_REQUEST_KEY);
};

const readScheduledTutorialIds = (entrauserid) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getTutorialScheduleKey(entrauserid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
};

const writeScheduledTutorialIds = (entrauserid, tutorialIds) => {
  if (typeof window === 'undefined') return;
  const unique = [...new Set((tutorialIds ?? []).filter(Boolean).map(String))];
  if (unique.length === 0) {
    window.localStorage.removeItem(getTutorialScheduleKey(entrauserid));
    return;
  }
  window.localStorage.setItem(getTutorialScheduleKey(entrauserid), JSON.stringify(unique));
};

export const getScheduledTutorialIds = (entrauserid) => readScheduledTutorialIds(entrauserid);

export const isTutorialScheduled = (entrauserid, tutorialId) => {
  if (typeof window === 'undefined' || !tutorialId) return false;
  return readScheduledTutorialIds(entrauserid).includes(String(tutorialId));
};

export const setTutorialScheduled = (entrauserid, tutorialId, enabled) => {
  if (typeof window === 'undefined' || !tutorialId) return;
  const current = readScheduledTutorialIds(entrauserid);
  const next = enabled
    ? [...new Set([...current, String(tutorialId)])]
    : current.filter((id) => id !== String(tutorialId));
  writeScheduledTutorialIds(entrauserid, next);
};

export const setTutorialSchedule = (entrauserid, tutorialIds = []) => {
  if (typeof window === 'undefined') return;
  writeScheduledTutorialIds(entrauserid, tutorialIds);
};

export const clearTutorialSchedule = (entrauserid) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getTutorialScheduleKey(entrauserid));
};

export const consumeTutorialPlayRequest = () => {
  const requested = getTutorialPlayRequest();
  if (!requested) return null;
  clearTutorialPlayRequest();
  return requested;
};

export const getTutorialSeenKey = (entrauserid, tutorialId) =>
  `sparta_tutorial_seen:${entrauserid || 'anonymous'}:${tutorialId}`;

export const hasSeenTutorial = (entrauserid, tutorialId) => {
  if (typeof window === 'undefined' || !tutorialId) return false;
  return window.localStorage.getItem(getTutorialSeenKey(entrauserid, tutorialId)) === 'true';
};

export const markTutorialSeen = (entrauserid, tutorialId) => {
  if (typeof window === 'undefined' || !tutorialId) return;
  window.localStorage.setItem(getTutorialSeenKey(entrauserid, tutorialId), 'true');
};

// Call this once after useFetchUserSettings resolves to seed localStorage from DB.
export const syncSeenTutorialsFromDB = (entrauserid, seentutorials) => {
  if (typeof window === 'undefined' || !entrauserid || !seentutorials) return;
  Object.entries(seentutorials).forEach(([tutorialId, seen]) => {
    if (seen === true || seen === 'true') {
      window.localStorage.setItem(getTutorialSeenKey(entrauserid, tutorialId), 'true');
    }
  });
};