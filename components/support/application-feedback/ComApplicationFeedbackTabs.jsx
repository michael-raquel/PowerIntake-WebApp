const tabOptions = [
  { value: "All", label: "All" },
  { value: "Problem", label: "Problem" },
  { value: "Suggestion", label: "Suggestion" },
  { value: "Compliment", label: "Compliment" },
];

export default function ComApplicationFeedbackTabs({
  activeTab = "All",
  onChange,
}) {
  return (
    <div
      role="tablist"
      aria-label="Feedback categories"
      className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-x-auto"
    >
      <nav className="flex gap-x-1 min-w-max">
        {tabOptions.map((tab) => {
          const isActive = tab.value === activeTab;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(tab.value)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-t-lg border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-400 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.04]"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
