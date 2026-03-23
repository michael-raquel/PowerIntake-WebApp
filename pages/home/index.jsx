"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useRouter } from 'next/navigation';
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

const IN_PROGRESS_STATUSES = new Set([
  'Assigned', 'Information Provided', 'Escalate to Onsite',
  'Client Responded', 'Rescheduled', 'Scheduling Required',
  'Working Issue Now', 'Waiting', 'Waiting Approval','Pending Closure',
]);

const CANCELLED_STATUSES = new Set(['Cancelled', 'Technician Rejected', 'Merged']);

const STATUS_CLASSES = {
  'New': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  'Assigned':               'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Information Provided':   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Escalate to Onsite':     'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Client Responded':       'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Rescheduled':            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Scheduling Required':    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Working Issue Now':      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Waiting':                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Waiting for Approval':   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Work Completed':  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900',
  'Problem Solved':  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900',
  'Cancelled':           'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  'Technician Rejected': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  'Merged':              'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
};

const DOT_COLORS = {
  green:  'bg-green-500',
  blue:   'bg-blue-500',
  red:    'bg-red-500',
  purple: 'bg-purple-500',
  gray:   'bg-gray-400',
  orange: 'bg-orange-500',
};

const DotRow = ({ color, label }) => (
  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[color] ?? 'bg-gray-400'}`} />
    <span className="truncate text-[9px] sm:text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 leading-none">{label}</span>
  </div>
);

const StatCard = ({ icon, label, value, subtext, dots }) => (
  <div className="group bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 flex flex-col gap-2">
    <div className="flex items-start justify-between gap-1">
      <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 truncate leading-tight">{label}</p>
      <Image src={icon} alt="" width={20} height={20}
        className="w-4 h-4 sm:w-5 sm:h-5 opacity-50 group-hover:opacity-90 group-hover:scale-110 transition-all shrink-0" />
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
    {subtext && (
      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 dark:text-gray-500 truncate leading-tight -mt-1">{subtext}</p>
    )}
    {dots?.length > 0 && (
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-gray-100 dark:border-gray-800">
        {dots.map((d, i) => <DotRow key={i} color={d.color} label={d.label} />)}
      </div>
    )}
  </div>
);

const Tabs = ({ active, onChange, tabs }) => (
  <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
    <nav className="flex gap-x-1">
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={`px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-t-lg border-b-2 cursor-pointer ${active === tab.value
            ? "border-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-400 font-semibold"
            : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.04]"
            }`}>
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
);

export default function HomePage() {
  const { account, tokenInfo } = useAuth();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('my-ticket');

  const nextSlide = useCallback(() => setCurrentSlide(p => (p + 1) % images.length), []);
  useEffect(() => { const t = setInterval(nextSlide, 5000); return () => clearInterval(t); }, [nextSlide]);

  const userId = tokenInfo?.account?.localAccountId;

  const ticketQuery = useMemo(() => {
    if (!userId || activeTab === 'my-team') return { enabled: false };
    if (activeTab === 'my-company') return { enabled: true, scope: 'my-company', entratenantid: tokenInfo?.account?.tenantId };
    if (activeTab === 'my-client') return { enabled: true, scope: 'my-client', entrauserid: null };
    return { enabled: true, scope: 'my-ticket', entrauserid: userId };
  }, [userId, activeTab, tokenInfo?.account?.tenantId]);

  const { tickets: myTickets = [], loading: loadingMyTickets, error: errorMyTickets } = useFetchTicket(ticketQuery);
  const { data: teamTickets = [], loading: loadingTeamTickets, error: errorTeamTickets } = useFetchMyTeamUsers({ managerentrauserid: userId, enabled: !!userId });

  const isManager = teamTickets.length > 0;
  const visibleTabs = useMemo(() => isManager ? tabs : tabs.filter(t => t.value !== 'my-team'), [isManager]);
  const safeActiveTab = useMemo(() => visibleTabs.some(t => t.value === activeTab) ? activeTab : 'my-ticket', [visibleTabs, activeTab]);

  const isTeamView = safeActiveTab === 'my-team' && isManager;
  const tickets = isTeamView ? teamTickets : myTickets;
  const loading = isTeamView ? loadingTeamTickets : loadingMyTickets;
  const error = isTeamView ? errorTeamTickets : errorMyTickets;

  const totalTickets = tickets.length;
  const newCount = tickets.filter(t => t.v_status === 'New').length;
  const inProgressCount = tickets.filter(t => IN_PROGRESS_STATUSES.has(t.v_status)).length;
  const cancelledOnlyCount = tickets.filter(t => t.v_status === 'Cancelled').length;
  const techRejectedCount = tickets.filter(t => t.v_status === 'Technician Rejected').length;
  const mergedCount = tickets.filter(t => t.v_status === 'Merged').length;
  const cancelledCount = cancelledOnlyCount + techRejectedCount + mergedCount;
  const workCompletedCount = tickets.filter(t => t.v_status === 'Work Completed').length;
  const problemSolvedCount = tickets.filter(t => t.v_status === 'Problem Solved').length;
  const completedCount = workCompletedCount + problemSolvedCount;
  const completionRate = Math.round((completedCount / (totalTickets - cancelledCount)) * 100) || 0;
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6 pb-0 md:pb-0">
      <div className="w-full space-y-6 sm:space-y-8">

        <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: 'max(110px, 13%)' }}>
          <div className="absolute inset-0 flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {images.map((img, idx) => (
              <div key={idx} className="relative w-full flex-shrink-0 h-full">
                <Image src={img.src} alt={img.alt} fill className="object-cover object-center" priority={idx === 0} sizes="100vw" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentSlide(idx)} aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${idx === currentSlide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`} />
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
            <button onClick={() => router.push('/ticket?create=true')}
              className="self-start sm:self-center inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-medium rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap">
              Submit Ticket <span>→</span>
            </button>
          </div>
        </div>

        <Tabs active={safeActiveTab} onChange={setActiveTab} tabs={visibleTabs} />
 
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon="/icons/myticket.svg" label="My Tickets" value={totalTickets} dots={[
            { color: 'green',  label: `${newCount} New` },
            { color: 'blue',   label: `${inProgressCount} In Progress` },
            { color: 'red',    label: `${cancelledCount} Cancelled` },
            { color: 'purple', label: `${completedCount} Completed` },
          ]} />
          <StatCard icon="/icons/inprogress.svg" label="In Progress" value={inProgressCount} dots={[
            { color: 'blue', label: 'Being worked on' },
          ]} />
          <StatCard icon="/icons/completed.svg" label="Cancelled" value={cancelledCount} dots={[
            { color: 'gray',   label: `${cancelledOnlyCount} Cancelled` },
            { color: 'red',    label: `${techRejectedCount} Technician Rejected` },
            { color: 'orange', label: `${mergedCount} Merged` },
          ]} />
          <StatCard icon="/icons/completionrate.svg" label="Completion Rate" value={`${completionRate}%`} dots={[
            { color: 'purple', label: `${workCompletedCount} Work Completed` },
            { color: 'green',  label: `${problemSolvedCount} Problem Solved` },
          ]} />

        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/10 dark:to-indigo-950/10 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">Recent tickets</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your latest 5 tickets</p>
            </div>
            <button onClick={() => router.push('/ticket')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm transition-all">
              View all <span>→</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-3">
            {tickets.slice(0, 5).map(ticket => (
              <div key={ticket.v_ticketuuid} onClick={() => router.push('/ticket')}
                className="group relative bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700/50 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200">
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
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full shrink-0 ${STATUS_CLASSES[ticket.v_status] ?? STATUS_CLASSES.Closed}`}>
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
                <button onClick={() => router.push('/ticket?create=true')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-200 dark:border-purple-800 hover:border-purple-300 hover:shadow-sm transition-all">
                  Create your first ticket <span>→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-gray-200 dark:border-gray-800 mt-2 ">
          <div className="px-6 py-2 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0 order-1 sm:order-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">Sparta Services, LLC</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 order-2 sm:order-3">
              {footerLinks.map((link, i) => (
                <span key={link.label} className="flex items-center">
                  <a href={link.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap">
                    {link.label}
                    <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                  </a>
                  {i < footerLinks.length - 1 && (
                    <span className="w-px h-3 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />
                  )}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap order-3 sm:order-2">
              &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}