"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useRouter } from 'next/navigation';

const images = [
  { src: '/homebanner.png', alt: 'Home Banner' },
  { src: '/fosteringaccountability.png', alt: 'Fostering Accountability' },
  { src: '/improvingaccessibility.png', alt: 'Improving Accessibility' },
  { src: '/powerintakeexceptionalservice.png', alt: 'Power Intake Exceptional Service' },
];

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
  const { tickets, loading, error } = useFetchTicket({
    entrauserid: userId,
    enabled: !!userId,
  });

  const totalTickets = tickets.length;
  const inProgressTickets = tickets.filter(t => {
    const status = t.v_status;
    return status && status !== 'Submitted' && status !== 'Closed';
  }).length;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const closedThisWeek = tickets.filter(t => {
    if (t.v_status !== 'Closed') return false;
    const closedDate = t.v_closuredate ? new Date(t.v_closuredate) : null;
    return closedDate && closedDate >= startOfWeek && closedDate <= endOfWeek;
  }).length;

  const completionRate = totalTickets > 0 ? Math.round((closedThisWeek / totalTickets) * 100) : 0;

  const handleSubmitTicket = () => {
    router.push('/ticket?create=true');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (!userId || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="relative w-full overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
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

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6">
          <div className="space-y-1 md:space-y-2">
            <h2 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">
              Welcome back, {account?.name || 'User'}
            </h2>
            <p className="text-xs md:text-base text-gray-500 dark:text-gray-400">
              A quick and efficient way to request assistance. Get the help you need, when you need it.
            </p>
          </div>
          <button
            onClick={handleSubmitTicket}
            className="mt-3 md:mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-5 py-1.5 md:py-2 rounded-full font-medium transition text-xs md:text-base dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            Submit Ticket
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">My Tickets</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalTickets}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                +{tickets.filter(t => t.v_status === 'Submitted').length} new this week
              </p>
            </div>
            <Image src="/icons/myticket.svg" alt="" width={28} height={28} className="opacity-80" />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{inProgressTickets}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tickets being worked on</p>
            </div>
            <Image src="/icons/inprogress.svg" alt="" width={28} height={28} className="opacity-80" />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{closedThisWeek}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Closed tickets this week</p>
            </div>
            <Image src="/icons/completed.svg" alt="" width={28} height={28} className="opacity-80" />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{completionRate}%</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Overall closed tickets</p>
            </div>
            <Image src="/icons/completionrate.svg" alt="" width={28} height={28} className="opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Tickets</h2>
            <button
              onClick={() => router.push('/ticket')}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              See all tickets →
            </button>
          </div>
          <div className="space-y-3">
            {tickets.slice(0, 5).map(ticket => (
              <div
                key={ticket.v_ticketuuid}
                onClick={() => router.push('/ticket')}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition flex justify-between items-start gap-2"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">{ticket.v_title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{ticket.v_ticketnumber}</span>
                    <span>•</span>
                    <span>{new Date(ticket.v_createdat).toLocaleString()}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusClass(ticket.v_status)}`}>
                  {ticket.v_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}