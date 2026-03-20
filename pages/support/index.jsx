"use client";

import { useState } from "react";
import { Mail, MessageSquare, PhoneCall, BookOpen, Info, ExternalLink } from "lucide-react";
import ComCard, { supportCards, learnMoreCards } from "@/components/support/ComCard";
import ComSupportForm from "@/components/support/ComSupportForm";
import ComFeedbackForm from "@/components/support/ComFeedbackForm";

const supportIcons = [Mail, MessageSquare, PhoneCall];
const learnMoreIcons = [BookOpen, Info];

export default function SupportRoute() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 pb-0 md:pb-0">

      <ComSupportForm open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ComFeedbackForm open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <div className="flex-1 flex flex-col gap-6">

        <div className="px-2 bg-gradient-to-l from-pink-500 to-violet-800 rounded-lg py-4">
          <h2 className="font-bold text-sm sm:text-lg text-white">
            Power Intake Help Center
          </h2>
          <p className="text-xs sm:text-sm text-gray-200 mt-1">
            Improving Accessibility | Fostering Accountability | Exceptional Service
          </p>
        </div>

        <div className="space-y-12">

          <section>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Need help? We have got your back
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  We would love to hear from you. Whether you have a question, feedback, or need
                  assistance, here is how you can reach us.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {supportCards.map((card, index) => {
                const Icon = supportIcons[index] || Mail;
                return (
                  <ComCard
                    key={card.title}
                    title={card.title}
                    description={card.description}
                    Icon={Icon}
                    iconBg={card.iconBg}
                    footer={
                      card.cta ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (card.title === "Email Support") setSupportOpen(true);
                            if (card.title === "Give Feedback") setFeedbackOpen(true);
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                        >
                          {card.cta}
                        </button>
                      ) : (
                        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-center dark:border-orange-900/50 dark:bg-orange-950/40">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            +1 425-655-3468
                          </p>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Mon-Fri, 5AM-5PM PST
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
                            Available 24/7, after regular business hours.
                          </p>
                        </div>
                      )
                    }
                  />
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Learn more
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Explore additional resources and information to get the most out of our app.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {learnMoreCards.map((card, index) => {
                const Icon = learnMoreIcons[index] || Info;
                return (
                  <ComCard
                    key={card.title}
                    title={card.title}
                    description={card.description}
                    Icon={Icon}
                    iconBg={card.iconBg}
                    footer={
                      card.badge ? (
                        <button
                          type="button"
                          className="w-fit rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400"
                          disabled
                        >
                          {card.badge}
                        </button>
                      ) : (
                        <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-center dark:border-sky-900/40 dark:bg-sky-950/40">
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {card.version}
                          </p>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {card.release}
                          </p>
                        </div>
                      )
                    }
                  />
                );
              })}
            </div>
          </section>

        </div>
      </div>

      <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative">
          <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            Sparta Services, LLC
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block absolute left-1/2 -translate-x-1/2">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
          <div className="flex flex-nowrap justify-center sm:justify-end sm:flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full sm:w-auto">
            <a href="https://www.spartaserv.com/terms-conditions" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              Terms
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://www.spartaserv.com/privacy-policy" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              Privacy Policy
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://www.spartaserv.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              spartaserv.com
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://Portal.SpartaServ.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              Portal
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 sm:hidden text-center">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}