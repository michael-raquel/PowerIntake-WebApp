"use client";
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Phone, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useFetchMyTeamUsers } from '@/hooks/UseFetchMyTeam';

const images = [
  { src: '/homebanner.png', alt: 'Home Banner' },
  { src: '/fosteringaccountability.png', alt: 'Fostering Accountability' },
  { src: '/improvingaccessibility.png', alt: 'Improving Accessibility' },
  { src: '/powerintakeexceptionalservice.png', alt: 'Power Intake Exceptional Service' },
];

const footerLinks = [
  { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
  { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
  { href: 'https://www.spartaserv.com', label: 'spartaserv.com' },
  { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
];

const tabs = [
  { label: 'My Clients', value: 'my-client' },
  { label: 'My Company', value: 'my-company' },
  { label: 'My Team', value: 'my-team' },
  { label: 'My Tickets', value: 'my-ticket' },
];

const STATUS_CLASSES = {
  Submitted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};
const getStatusClass = (status) => STATUS_CLASSES[status] ?? STATUS_CLASSES.Closed;

const StatCard = ({ icon, label, value, subtext, color }) => (
  <div className={`group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200`}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full bg-${color}-500 shrink-0`} />
          <span className="truncate">{subtext}</span>
        </p>
      </div>
      <Image src={icon} alt="" width={28} height={28} className="w-6 h-6 sm:w-7 sm:h-7 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0" />
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 space-y-3 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
  </div>
);

// NEW: move Tabs out of HomePage
const Tabs = ({ active, onChange, tabs }) => {
  return (
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium rounded-t-md ${
            active === tab.value
              ? 'border-b-2 border-violet-600 text-violet-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default function HomePage() {
  const { account, tokenInfo } = useAuth();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('my-ticket');

  const goToSlide = useCallback((idx) => setCurrentSlide(idx), []);
  const nextSlide = useCallback(() => setCurrentSlide(prev => (prev + 1) % images.length), []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const userId = tokenInfo?.account?.localAccountId;

  const ticketQuery = useMemo(() => {
    if (!userId) return { enabled: false };

    const base = { enabled: true };

    switch (activeTab) {
      case 'my-client':
        return {
          ...base,
          scope: 'my-client',
          entrauserid: null,
        };
      case 'my-company':
        return {
          ...base,
          scope: 'my-company',
          entratenantid: tokenInfo?.account?.tenantId,
        };
      case 'my-team':
        // useFetchTicket disabled for team view; use useFetchMyTeamUsers instead
        return { enabled: false };
      case 'my-ticket':
      default:
        return {
          ...base,
          scope: 'my-ticket',
          entrauserid: userId,
        };
    }
  }, [userId, activeTab, tokenInfo?.account?.tenantId]);

  const {
    tickets: myTickets = [],
    loading: loadingMyTickets,
    error: errorMyTickets,
  } = useFetchTicket(ticketQuery);

  const {
    data: teamTickets = [],
    loading: loadingTeamTickets,
    error: errorTeamTickets,
  } = useFetchMyTeamUsers({
    managerentrauserid: userId,
    enabled: !!userId,
  });

  const isManager = (teamTickets?.length ?? 0) > 0;

  const visibleTabs = useMemo(
    () => (isManager ? tabs : tabs.filter(t => t.value !== 'my-team')),
    [isManager]
  );

  // NEW: derive a safe active tab instead of setting state in an effect
  const safeActiveTab = useMemo(
    () => (visibleTabs.some(t => t.value === activeTab) ? activeTab : 'my-ticket'),
    [visibleTabs, activeTab]
  );

  const isTeamView = safeActiveTab === 'my-team' && isManager;
  const tickets = isTeamView ? teamTickets : myTickets;
  const loading = isTeamView ? loadingTeamTickets : loadingMyTickets;
  const error = isTeamView ? errorTeamTickets : errorMyTickets;

  const totalTickets = tickets.length ?? 0;
  const inProgressTickets =
    tickets.filter(t => t.v_status &&
      t.v_status !== 'Assigned'
      && t.v_status !== 'New'
      && t.v_status !== 'Information Provided'
      && t.v_status !== 'Escalate to Onsite'
      && t.v_status !== 'Client Responded'
      && t.v_status !== 'Rescheduled'
      && t.v_status !== 'Scheduling Required'
      && t.v_status !== 'Working Issue Now'
      && t.v_status !== 'Waiting'
      && t.v_status !== 'Assigned'
      && t.v_status !== 'Waiting for Approval'
      && t.v_status !== 'Rescheduled').length ?? 0;
  const Completed = tickets.filter(t =>
    t.v_status === 'Work Completed'
    || t.v_status === 'Problem Solved').length ?? 0;

  //for inprogress
  //assigned, new,  information provided, 
  // escalate to onsite, client responded,
  //  reschedule Scheduling Required, Working Issue Now, 
  // Client Responded, Waiting, Rescheduled, Information provided,
  //  assigned and waiting approval

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const cancelledTicket = tickets.filter(t =>
    t.v_status === 'Cancelled' || t.v_status === 'Technician Rejected' || t.v_status === 'Merged'
  ).length ?? 0;


  const completionRate = Math.round((Completed / (totalTickets - cancelledTicket)) * 100);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6 pb-0 md:pb-0">
      <div className="w-full space-y-6 sm:space-y-8">

        <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: 'max(110px, 17%)' }}>
          <div
            className="absolute inset-0 flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {images.map((img, idx) => (
              <div key={idx} className="relative w-full flex-shrink-0 h-full">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover object-center"
                  priority={idx === 0}
                  sizes="100vw"
                />
              </div>
            ))}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${idx === currentSlide
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-l-xl" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, <span className="text-purple-600 dark:text-purple-400">{account?.name || 'User'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                A quick and efficient way to request assistance. Get the help you need, when you need it.
              </p>
            </div>
            <button
              onClick={() => router.push('/ticket?create=true')}
              className="self-start sm:self-center inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-medium rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              Submit Ticket <span>→</span>
            </button>
          </div>
        </div>


        <Tabs active={safeActiveTab} onChange={setActiveTab} tabs={visibleTabs} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon="/icons/myticket.svg" label="My Tickets" value={totalTickets} subtext={`+${cancelledTicket} Cancelled`} color="purple" />
          <StatCard icon="/icons/inprogress.svg" label="In Progress" value={inProgressTickets} subtext="Tickets being worked on" color="blue" />
          <StatCard icon="/icons/completed.svg" label="Completed" value={Completed} subtext="Completed Tickets" color="emerald" />
          <StatCard icon="/icons/completionrate.svg" label="Completion Rate" value={`${completionRate}%`} subtext="Overall closed tickets" color="purple" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/10 dark:to-indigo-950/10 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">Recent tickets</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your latest 5 tickets</p>
            </div>
            <button
              onClick={() => router.push('/ticket')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm transition-all"
            >
              View all <span>→</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-3">
            {tickets.slice(0, 5).map(ticket => (
              <div
                key={ticket.v_ticketuuid}
                onClick={() => router.push('/ticket')}
                className="group relative bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700/50 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full shrink-0">
                      #{ticket.v_ticketnumber}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {new Date(ticket.v_createdat).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full shrink-0 ${getStatusClass(ticket.v_status)}`}>
                    {ticket.v_status}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white line-clamp-1">{ticket.v_title}</h3>
                <p className="text-xs text-gray-400 mt-1.5 font-mono">
                  {new Date(ticket.v_createdat).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            ))}

            {tickets.length === 0 && (
              <div className="text-center py-14">
                <div className="text-4xl mb-3 opacity-20">🎫</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No tickets yet</p>
                <button
                  onClick={() => router.push('/ticket?create=true')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-200 dark:border-purple-800 hover:border-purple-300 hover:shadow-sm transition-all"
                >
                  Create your first ticket <span>→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-gray-200 dark:border-gray-800">
          <div className="px-6 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative">
            <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Sparta Services, LLC
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block absolute left-1/2 -translate-x-1/2">
              &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
            </p>
            <div className="flex flex-nowrap justify-center sm:justify-end sm:flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full sm:w-auto">
              {footerLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
                  style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}
                >
                  {link.label}
                  <ExternalLink
                    style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }}
                    className="opacity-60 flex-shrink-0"
                  />
                </a>
              ))}
            </div>

          </div>
        </footer>
      </div>
    </div>
  );
}