"use client";

export const supportCards = [
  {
    title: "Email Support",
    description: "For general inquiries and support. (This feature will be available in version 2.0)",
    cta: "Contact App Support",
    iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
  },
  {
    title: "Give Feedback",
    description: "Share your thoughts and help us improve the app experience. (This feature will be available in version 2.0)",
    cta: "Give App Feedback",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    title: "Call Support Team",
    description: "Speak directly with our MSP experts.",
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
    telephone: "877-655-3469",
    localNumber: "425-655-3468",
  },
];

export const learnMoreCards = [
  {
    title: "Guidelines & FAQs",
    description: "Find answers to common questions and comprehensive usage guidelines.",
    badge: "Coming soon",
    iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    title: "App Version Info",
    description: "Current version details and comprehensive update history.",
    iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "v0.0.0-local",
    release: `Released ${process.env.NEXT_PUBLIC_APP_RELEASE_DATE || "August 01, 2025"}`,
  },
];
//jasperwitnessserer1auralacaespaeaheyhuhhehi
export default function ComCard({
  title,
  description,
  Icon,
  iconBg,
  footer,
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-dashed border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h4>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
      <div className="mt-6">{footer}</div>
    </div>
  );
}
