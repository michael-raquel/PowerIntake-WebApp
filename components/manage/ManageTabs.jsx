export default function ManageTabs({ tabs, activeTab, onTabChange }) {
    //shoutout kay daniel for the help with this component, i was struggling to make it work and he came in clutch with the solution
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <nav className="flex gap-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            {...(tab.dataTutorial ? { "data-tutorial": tab.dataTutorial } : {})}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-t-lg border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.04]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}