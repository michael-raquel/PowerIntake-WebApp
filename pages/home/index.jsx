"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ExternalLink, Clock, User, Tag, Building2, ArrowUpRight, Flag, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useRouter } from 'next/navigation';
import { useFetchMyTeamUsers } from '@/hooks/UseFetchMyTeam';
import useManagerCheck from '@/hooks/UseManagerCheck';

const images = [
  { src: '/homebanner.png', alt: 'Home Banner' },
  { src: '/fosteringaccountability.png', alt: 'Fostering Accountability' },
  { src: '/improvingaccessibility.png', alt: 'Improving Accessibility' },
  { src: '/powerintakeexceptionalservice.png', alt: 'Power Intake Exceptional Service' },
];

const footerLinks = [
  { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
  { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
  { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
  { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
];

const IN_PROGRESS_STATUSES = new Set([
  'Assigned', 'Information Provided', 'Escalate To Onsite',
  'Client Responded', 'Reschedule', 'Scheduling Required',
  'Working Issue Now', 'Waiting', 'Waiting Approval', 'Pending Closure',
  'Technician Rejected',
]);

const STATUS_CONFIG = {
  'New': { pill: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900', dot: 'bg-green-500' },
  'Assigned': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Escalate To Onsite': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Information Provided': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Client Responded': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Reschedule': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Scheduling Required': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Working Issue Now': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Waiting': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Waiting Approval': { pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
  'Pending Closure': { pill: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900', dot: 'bg-amber-500' },
  'Work Completed': { pill: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900', dot: 'bg-purple-500' },
  'Problem Solved': { pill: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900', dot: 'bg-purple-500' },
  'Cancelled': { pill: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900', dot: 'bg-rose-500' },
  'Technician Rejected': { pill: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900', dot: 'bg-rose-500' },
  'Merged': { pill: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900', dot: 'bg-rose-500' },
};
const DEFAULT_STATUS = { pill: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', dot: 'bg-gray-400' };
const DOT_COLORS = {
  green: 'bg-green-500', blue: 'bg-blue-500', red: 'bg-red-500',
  purple: 'bg-purple-500', gray: 'bg-gray-400', orange: 'bg-orange-500',
};

const DotRow = ({ color, label }) => (
  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[color] ?? 'bg-gray-400'}`} />
    <span className="truncate text-[9px] sm:text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 leading-none">{label}</span>
  </div>
);

const StatCard = ({ icon, label, value, dots }) => (
  <div className="group bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 flex flex-col gap-2">
    <div className="flex items-start justify-between gap-1">
      <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 truncate leading-tight">{label}</p>
      <Image src={icon} alt="" width={20} height={20}
        className="w-4 h-4 sm:w-5 sm:h-5 opacity-50 group-hover:opacity-90 group-hover:scale-110 transition-all shrink-0" />
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
    {dots?.length > 0 && (
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-gray-100 dark:border-gray-800">
        {dots.map((d, i) => <DotRow key={i} color={d.color} label={d.label} />)}
      </div>
    )}
  </div>
);

const TabBar = ({ active, onChange, tabs }) => (
  <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
    <nav className="flex gap-x-1">
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={`px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-t-lg border-b-2 cursor-pointer ${active === tab.value
            ? 'border-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-400 font-semibold'
            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.04]'
            }`}>
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
);

const TicketCard = ({ ticket, onClick, showOwner }) => {
  const { pill, dot } = STATUS_CONFIG[ticket.v_status] ?? DEFAULT_STATUS;
  const createdAt = new Date(ticket.v_createdat);
  const dateLabel = createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeLabel = createdAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

  const clientInitial = ticket.v_tenantname ? ticket.v_tenantname.charAt(0).toUpperCase() : '?';

  const metadataItems = [
    ticket.v_source && { label: 'Source', value: ticket.v_source },
    { label: 'Client', value: ticket.v_tenantname },
    showOwner && { label: 'Requester', value: ticket.v_username },
    { label: 'Category', value: ticket.v_ticketcategory },
    ticket.v_technicianname && { label: 'Technician', value: ticket.v_technicianname },
  ].filter(Boolean);

  const mobileGridData = [
    { label: 'Requester', value: ticket.v_username || '—' },
    { label: 'Technician', value: ticket.v_technicianname || '—' },
    { label: 'Category', value: ticket.v_ticketcategory || '—' },
    { label: 'Source', value: ticket.v_source || '—' },
    ticket.v_target && { label: 'Target', value: new Date(ticket.v_target).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) },
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onClick(ticket.v_ticketuuid)}
      className="w-full text-left group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 relative"
    >
      <div className="sm:hidden">

        <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/40">
          <div className="w-6 h-6 rounded-md bg-violet-600 dark:bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
            {clientInitial}
          </div>
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-300 truncate leading-snug">
            {ticket.v_tenantname || '—'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 pt-2.5 mb-2">
          <span className="text-[11px] font-mono font-bold text-violet-600 dark:text-violet-400">
            #{ticket.v_ticketnumber}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${pill}`}>
            {ticket.v_status}
          </span>
        </div>

        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed px-3 mb-3">
          {ticket.v_title}
        </p>

        <div className="border-t border-gray-100 dark:border-gray-700/60 mb-2.5" />

        <div className="grid grid-cols-2 gap-1.5 px-3 mb-2.5">
          {mobileGridData.map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-50 dark:bg-gray-900/60 rounded-md px-2.5 py-1.5 min-w-0 border border-gray-100 dark:border-gray-700/50"
            >
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">{label}</p>
              <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
            </div>
          ))}
        </div>

      </div>

      <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-100/80 dark:border-gray-700/40 gap-2">
        <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate">{dateLabel} · {timeLabel}</span>
        <span className="text-[9px] font-semibold text-violet-500 dark:text-violet-400 whitespace-nowrap shrink-0">View details →</span>
      </div>

      <div className="hidden sm:block">
        <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-l-xl transition-all duration-200" />
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 dark:border-gray-800 gap-2">
          <span className="text-[11px] sm:text-xs font-mono font-semibold text-violet-600 dark:text-violet-400 shrink-0">#{ticket.v_ticketnumber}</span>
          <span className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${pill}`}>
            {ticket.v_status}
          </span>
        </div>
        <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2">
          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">{ticket.v_title}</p>
        </div>
        <div className="px-3 sm:px-4 pb-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-gray-600 dark:text-gray-400">
            {metadataItems.map((item, index) => (
              <span key={item.label} className="inline-flex items-center gap-1">
                <span className="text-[9px] sm:text-[10px] tracking-wider text-gray-400 dark:text-gray-500">{item.label}:</span>
                <span className="text-[11px] sm:text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.value}</span>
                {index < metadataItems.length - 1 && (
                  <span className="text-gray-300 dark:text-gray-600 ml-1">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 gap-2">
          <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 truncate">{dateLabel} · {timeLabel}</span>
          <span className="text-[9px] sm:text-[10px] text-violet-500 dark:text-violet-400 font-medium whitespace-nowrap shrink-0">View details →</span>
        </div>
      </div>
    </button>
  );
};

export default function HomePage() {
  const { account, tokenInfo } = useAuth();
  const router = useRouter();
  const { isManager } = useManagerCheck();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('my-ticket');

  const roles = tokenInfo?.account?.roles ?? [];
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isAdmin = roles.includes('Admin');
  const userId = tokenInfo?.account?.localAccountId;

  const nextSlide = useCallback(() => setCurrentSlide(p => (p + 1) % images.length), []);
  useEffect(() => { const t = setInterval(nextSlide, 5000); return () => clearInterval(t); }, [nextSlide]);

  useEffect(() => {
    const carousel = document.querySelector('.carousel-container');
    if (!carousel) return;
    let touchStartX = 0;
    const handleTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        setCurrentSlide(p => diff > 0 ? (p + 1) % images.length : (p - 1 + images.length) % images.length);
      }
    };
    carousel.addEventListener('touchstart', handleTouchStart);
    carousel.addEventListener('touchend', handleTouchEnd);
    return () => {
      carousel.removeEventListener('touchstart', handleTouchStart);
      carousel.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const tabs = useMemo(() => {
    const t = [];
    if (isSuperAdmin) {
      t.push({ label: 'My Clients', value: 'my-client' });
      t.push({ label: 'My Company', value: 'my-company' });
    } else if (isAdmin) {
      t.push({ label: 'My Company', value: 'my-company' });
    }
    if (isManager) t.push({ label: 'My Team', value: 'my-team' });
    t.push({ label: 'My Tickets', value: 'my-ticket' });
    return t;
  }, [isSuperAdmin, isAdmin, isManager]);

  const safeActiveTab = useMemo(() => {
    const tabValues = tabs.map(t => t.value);
    return tabValues.includes(activeTab) ? activeTab : 'my-ticket';
  }, [tabs, activeTab]);

  const ticketQuery = useMemo(() => {
    if (!userId || safeActiveTab === 'my-team') return { enabled: false };
    if (safeActiveTab === 'my-company') return { enabled: true, scope: 'my-company', entratenantid: tokenInfo?.account?.tenantId };
    if (safeActiveTab === 'my-client') return { enabled: true, scope: 'my-client', entrauserid: null };
    return { enabled: true, scope: 'my-ticket', entrauserid: userId };
  }, [userId, safeActiveTab, tokenInfo?.account?.tenantId]);

  const { tickets: myTickets = [] } = useFetchTicket(ticketQuery);
  const { data: teamTickets = [] } = useFetchMyTeamUsers({ managerentrauserid: userId, enabled: !!userId && safeActiveTab === 'my-team' });

  const tickets = safeActiveTab === 'my-team' && isManager ? teamTickets : myTickets;

  const stats = useMemo(() => {
    const total = tickets.length;
    const newCount = tickets.filter(t => t.v_status === 'New').length;
    const inProgressCount = tickets.filter(t => IN_PROGRESS_STATUSES.has(t.v_status)).length;
    const cancelledOnlyCount = tickets.filter(t => t.v_status === 'Cancelled').length;
    const mergedCount = tickets.filter(t => t.v_status === 'Merged').length;
    const cancelledCount = cancelledOnlyCount + mergedCount;
    const workCompletedCount = tickets.filter(t => t.v_status === 'Work Completed').length;
    const problemSolvedCount = tickets.filter(t => t.v_status === 'Problem Solved').length;
    const completedCount = workCompletedCount + problemSolvedCount;
    const completionRate = Math.round((completedCount / (total - cancelledCount)) * 100) || 0;
    return { total, newCount, inProgressCount, cancelledOnlyCount, mergedCount, cancelledCount, workCompletedCount, problemSolvedCount, completedCount, completionRate };
  }, [tickets]);

  const recentTickets = useMemo(() =>
    [...tickets].filter(t => t.v_status !== 'Work Completed' && t.v_status !== 'Problem Solved')
      .sort((a, b) => new Date(b.v_createdat) - new Date(a.v_createdat)).slice(0, 5), [tickets]);

  const handleTicketClick = useCallback((uuid) => {
    router.push(`/ticket?uuid=${uuid}&tab=${safeActiveTab}`);
  }, [router, safeActiveTab]);

  return (
    <div className="min-h-[100dvh] flex flex-col p-4 pb-0">
      <div className="flex flex-col gap-4 flex-1">
        <div className="relative w-full overflow-hidden rounded-2xl carousel-container group" style={{ paddingBottom: 'max(110px, 13%)' }}>
          <div className="absolute inset-0 flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {images.map((img, idx) => (
              <div key={idx} className="relative w-full flex-shrink-0 h-full">
                <Image src={img.src} alt={img.alt} fill className="object-cover object-center" priority={idx === 0} sizes="100vw" />
              </div>
            ))}
          </div>
          <button onClick={() => setCurrentSlide(p => (p - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:opacity-70 transition-all duration-200 bg-black/30 hover:bg-black/50 rounded-full p-1.5 backdrop-blur-sm z-20" aria-label="Previous">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => setCurrentSlide(p => (p + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:opacity-70 transition-all duration-200 bg-black/30 hover:bg-black/50 rounded-full p-1.5 backdrop-blur-sm z-20" aria-label="Next">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentSlide(idx)} className={`transition-all duration-300 rounded-full ${idx === currentSlide ? 'w-4 h-1.5 bg-white/80' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-l-xl" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Welcome back, <span className="text-purple-600 dark:text-purple-400">{account?.name || 'User'}</span></h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl">A quick and efficient way to request assistance. Get the help you need, when you need it.</p>
            </div>
            <button onClick={() => router.push('/ticket?create=true')} className="self-start sm:self-center inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-medium rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap">Submit Ticket <span>→</span></button>
          </div>
        </div>

        <TabBar active={safeActiveTab} onChange={setActiveTab} tabs={tabs} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon="/icons/myticket.svg" label="My Tickets" value={stats.total} dots={[{ color: 'green', label: `${stats.newCount} New` }, { color: 'blue', label: `${stats.inProgressCount} In Progress` }, { color: 'red', label: `${stats.cancelledCount} Cancelled` }, { color: 'purple', label: `${stats.completedCount} Completed` }]} />
          <StatCard icon="/icons/inprogress.svg" label="In Progress" value={stats.inProgressCount} dots={[{ color: 'blue', label: 'Being worked on' }]} />
          <StatCard icon="/icons/completed.svg" label="Cancelled" value={stats.cancelledCount} dots={[{ color: 'red', label: `${stats.cancelledOnlyCount} Cancelled` }, { color: 'orange', label: `${stats.mergedCount} Merged` }]} />
          <StatCard icon="/icons/completionrate.svg" label="Completion Rate" value={`${stats.completionRate}%`} dots={[{ color: 'purple', label: `${stats.workCompletedCount} Work Completed` }, { color: 'green', label: `${stats.problemSolvedCount} Problem Solved` }]} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/10 dark:to-indigo-950/10 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div><h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">Recent tickets</h2><p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your latest 5 active tickets</p></div>
            <button onClick={() => router.push(`/ticket?tab=${safeActiveTab}`)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm transition-all">View all <span>→</span></button>
          </div>
          <div className="p-4 sm:p-6 grid gap-3">
            {recentTickets.map(ticket => <TicketCard key={ticket.v_ticketuuid} ticket={ticket} onClick={handleTicketClick} showOwner={safeActiveTab !== 'my-ticket'} />)}
            {recentTickets.length === 0 && (
              <div className="text-center py-14">
                <div className="text-4xl mb-3 opacity-20">🎫</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No active tickets</p>
                <button onClick={() => router.push('/ticket?create=true')} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-200 dark:border-purple-800 hover:border-purple-300 hover:shadow-sm transition-all">Create your first ticket <span>→</span></button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-6 py-2 flex flex-col sm:flex-row items-center sm:justify-between gap-2">

          <div className="flex items-center gap-2 shrink-0 order-1 sm:order-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">Sparta Services, LLC</p>
          </div>

          <div className="flex items-center gap-1 shrink-0 order-2 sm:order-3 sm:pr-14">
            <div className="hidden sm:flex items-center gap-1">
              {footerLinks.map((link, i) => (
                <span key={link.label} className="flex items-center">
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap">
                    {link.label}<ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                  </a>
                  {i < footerLinks.length - 1 && <span className="w-px h-3 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />}
                </span>
              ))}
            </div>

            <div className="grid sm:hidden grid-cols-2 gap-x-0 gap-y-0">
              {footerLinks.map((link, i) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap ${i % 2 === 0 ? 'justify-end' : 'justify-start'
                    }`}
                >
                  {link.label}<ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap order-3 sm:order-2">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>

        </div>
      </footer>
    </div>
  );
}