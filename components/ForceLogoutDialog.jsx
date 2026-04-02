import { useEffect, useRef, useState, useCallback } from "react";

export default function ForceLogoutDialog({ seconds = 10, onLogout }) {
	const [remaining, setRemaining] = useState(() => Math.max(1, Number(seconds) || 10));
	const intervalRef = useRef(null);
	const firedRef = useRef(false);

	const clearTimer = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		firedRef.current = false;
		clearTimer();

		intervalRef.current = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					clearTimer();
					if (!firedRef.current) {
						firedRef.current = true;
						onLogout?.();
					}
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return clearTimer;
	}, [onLogout, clearTimer]);

	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="force-logout-title"
				aria-describedby="force-logout-desc"
				className="w-[90%] max-w-md rounded-2xl border border-gray-200/20 bg-white p-6 text-gray-900 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
			>
				<h2 id="force-logout-title" className="text-lg font-semibold">
					Account Updated
				</h2>
				<p id="force-logout-desc" className="mt-2 text-sm text-gray-600 dark:text-gray-300">
					Your account permissions were changed. You will be logged out automatically.
				</p>
				<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
					Logging out in {remaining}s.
				</p>
				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={() => onLogout?.()}
						className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
					>
						Logout now
					</button>
				</div>
			</div>
		</div>
	);
}
