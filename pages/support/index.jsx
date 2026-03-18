"use client";

import { useState } from "react";
import { Mail, MessageSquare, PhoneCall, BookOpen, Info } from "lucide-react";
import ComCard, {
  supportCards,
  learnMoreCards,
} from "@/components/support/ComCard";
import ComSupportForm from "@/components/support/ComSupportForm";
import ComFeedbackForm from "@/components/support/ComFeedbackForm";

const supportIcons = [Mail, MessageSquare, PhoneCall];
const learnMoreIcons = [BookOpen, Info];

export default function SupportRoute() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="p-6 rounded-lg">
      <ComSupportForm open={supportOpen} onClose={() => setSupportOpen(false)} />
      <ComFeedbackForm open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <div className="mb-6 px-2 bg-gradient-to-l from-pink-500 to-violet-800 rounded-lg py-4">
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
  );
}