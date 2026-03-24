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
    <div className="min-h-[100dvh] flex flex-col p-4 pb-0">

      <ComSupportForm open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ComFeedbackForm open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <div className="flex flex-col gap-4 flex-1">

        <div className="px-4 bg-gradient-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">
                  Power Intake Help Center
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Improving Accessibility | Fostering Accountability | Exceptional Service
                </p>
              </div>
            </div>
          </div>
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
                          <div className="flex gap-4 justify-center">
                            {card.telephone && (
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                <span className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Telephone</span>
                                +1 {card.telephone}
                              </p>
                            )}
                            {card.localNumber && (
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                <span className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Local number</span>
                                +1 {card.localNumber}
                              </p>
                            )}
                          </div>
                          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
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
  <div className="px-6 py-2 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
    <div className="flex items-center gap-2 shrink-0 order-1 sm:order-1">
      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
      <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">Sparta Services, LLC</p>
    </div>
    <div className="flex items-center gap-1 shrink-0 order-2 sm:order-3">
      {[
        { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
        { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
        { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
        { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
      ].map((link, i, arr) => (
        <span key={link.label} className="flex items-center">
          <a href={link.href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap">
            {link.label}
            <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
          </a>
          {i < arr.length - 1 && (
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
  );
}