"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Phone, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useRouter } from 'next/navigation';

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

const getStatusClass = (status) => {
  const statusMap = {
    Submitted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return statusMap[status] || statusMap.Closed;
};

const StatCard = ({ icon, label, value, subtext, color }) => (
  <div className={`group bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-${color}-200 dark:hover:border-${color}-800 transition-all duration-200`}>
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">{value}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1 sm:mt-2 flex items-center gap-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full bg-${color}-500`} /> {subtext}
        </p>
      </div>
      <div className="relative ml-2 sm:ml-3">
        <div className={`absolute inset-0 bg-${color}-100 dark:bg-${color}-900/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity`} />
        <Image src={icon} alt="" width={24} height={24} className="relative w-5 h-5 sm:w-7 sm:h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const { account, tokenInfo } = useAuth();
  const router = useRouter();

  const [currentSlide, setCurrentSlide] = useState(0);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % images.length);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  const userId = tokenInfo?.account?.localAccountId;
  const { tickets, loading, error } = useFetchTicket({ entrauserid: userId, enabled: !!userId });

  const totalTickets = tickets.length;
  const inProgressTickets = tickets.filter(t => t.v_status && t.v_status !== 'Submitted' && t.v_status !== 'Closed').length;

  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const closedThisWeek = tickets.filter(t =>
    t.v_status === 'Closed' && t.v_closuredate &&
    new Date(t.v_closuredate) >= startOfWeek && new Date(t.v_closuredate) <= endOfWeek
  ).length;

  const completionRate = totalTickets > 0 ? Math.round((closedThisWeek / totalTickets) * 100) : 0;

  const handleSubmitTicket = () => router.push('/ticket?create=true');

  if (!userId || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6">
        <div className="w-full space-y-8">
          <div className="relative w-full overflow-hidden rounded-2xl aspect-[3/1] bg-gray-200 dark:bg-gray-800 animate-pulse" />
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 space-y-2 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6">
        <div className="max-w-6xl mx-auto text-red-500 dark:text-red-400 text-center py-8">
          Failed to load ticket data.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6">
      <div className="w-full space-y-8">
        <div className="relative w-full overflow-hidden rounded-2xl">
          <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {images.map((img, idx) => (
              <div key={idx} className="relative w-full flex-shrink-0">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1200}
                  height={400}
                  className="w-full h-auto object-contain"
                  priority={idx === 0}
                  sizes="100vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-4 sm:p-5 md:p-7 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-l-xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, <span className="text-purple-600 dark:text-purple-400">{account?.name || 'User'}</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-2xl">
                A quick and efficient way to request assistance. Get the help you need, when you need it.
              </p>
            </div>
            <button onClick={handleSubmitTicket} className="inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm md:text-base font-medium rounded-full shadow-md hover:shadow-lg transition-all self-start">
              Submit Ticket <span className="text-sm sm:text-base">→</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon="/icons/myticket.svg" label="My Tickets" value={totalTickets} subtext={`+${tickets.filter(t => t.v_status === 'Submitted').length} new this week`} color="purple" />
          <StatCard icon="/icons/inprogress.svg" label="In Progress" value={inProgressTickets} subtext="Tickets being worked on" color="blue" />
          <StatCard icon="/icons/completed.svg" label="This Week" value={closedThisWeek} subtext="Closed tickets this week" color="emerald" />
          <StatCard icon="/icons/completionrate.svg" label="Completion Rate" value={`${completionRate}%`} subtext="Overall closed tickets" color="purple" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/10 dark:to-indigo-950/10 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Recent tickets</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your latest 5 tickets</p>
              </div>
              <button onClick={() => router.push('/ticket')} className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md hover:shadow-purple-100/20 dark:hover:shadow-purple-900/20 transition-all duration-200">
                <span>View all</span>
                <span className="relative w-4 h-4 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <span className="absolute inset-0 bg-purple-100 dark:bg-purple-900/30 rounded-full scale-0 group-hover:scale-100 transition-transform" />
                  <span className="relative text-purple-600 dark:text-purple-400">→</span>
                </span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {tickets.slice(0, 5).map(ticket => (
              <div key={ticket.v_ticketuuid} onClick={() => router.push('/ticket')} className="group relative bg-white dark:bg-gray-800/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700/50 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg hover:shadow-purple-100/10 dark:hover:shadow-purple-900/10 transition-all duration-200">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 to-indigo-400 dark:from-purple-500 dark:to-indigo-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full">#{ticket.v_ticketnumber}</span>
                    <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {new Date(ticket.v_createdat).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${getStatusClass(ticket.v_status)}`}>
                    {ticket.v_status}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">{ticket.v_title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 dark:bg-purple-600 opacity-50"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500 dark:bg-purple-500"></span>
                    </span>
                    <span>Opened</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">/</span>
                  <time dateTime={ticket.v_createdat} className="font-mono text-gray-500 dark:text-gray-400">
                    {new Date(ticket.v_createdat).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </time>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 opacity-20">🎫</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">No tickets yet</p>
                <button onClick={() => router.push('/ticket?create=true')} className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md hover:shadow-purple-100/20 dark:hover:shadow-purple-900/20 transition-all">
                  <span>Create your first ticket</span>
                  <span className="text-base">→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:justify-between gap-8">
            <div className="space-y-3">
              <p className="text-base font-semibold text-gray-900 dark:text-white">Sparta Services, LLC</p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" /><span>14205 SE 36th St Ste 100, Bellevue, WA 98006</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" /><a href="tel:4255228050" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">425.522.8050</a></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {footerLinks.map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors flex items-center gap-1">
                  {link.label} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}