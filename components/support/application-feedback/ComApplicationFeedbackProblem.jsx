import ComApplicationFeedbackBoard from "./ComApplicationFeedbackBoard";

const classification = "Problem";

export default function ComApplicationFeedbackProblem({ items = [], ...props }) {
  const filteredItems = items.filter(
    (item) => item.classification === classification
  );

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
        No problem feedback yet.
      </div>
    );
  }

  return <ComApplicationFeedbackBoard items={filteredItems} {...props} />;
}
