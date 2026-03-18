export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">You&apos;re offline</h1>
        <p className="text-sm text-slate-400 mb-6">
          PowerIntake can&apos;t reach the network right now. Some data may be
          unavailable until you&apos;re back online.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Check your connection and try again.</span>
        </div>
      </div>
    </div>
  );
}
