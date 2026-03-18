export default function ManageTabs({ tabs, activeTab, onTabChange }) {
    
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
        className={`px-4 py-2  border-b-2 text-[10px] sm:text-sm font-medium transition-all duration-100 transform cursor-pointer ${
                    activeTab === tab.id
                        ? "border-violet-600 text-violet-600 font-semibold scale-100 dark:border-violet-400 dark:text-violet-400"
                        : "border-transparent text-gray-600 hover:text-gray-800 hover:scale-110 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}