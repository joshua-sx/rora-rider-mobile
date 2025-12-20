import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast } from "../components/Toast";

type ToastContextType = {
	showToast: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

type ToastData = {
	id: number;
	message: string;
	duration: number;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastData[]>([]);
	const [nextId, setNextId] = useState(0);

	const showToast = useCallback((message: string, duration = 3000) => {
		const id = nextId;
		setNextId((prev) => prev + 1);

		// Add new toast to queue
		setToasts((prev) => [...prev, { id, message, duration }]);

		// Auto-remove after duration + animation time
		setTimeout(() => {
			setToasts((prev) => prev.filter((toast) => toast.id !== id));
		}, duration + 400); // 400ms for enter/exit animations
	}, [nextId]);

	const handleDismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	// Only show the first toast in the queue
	const currentToast = toasts[0];

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{currentToast && (
				<Toast
					message={currentToast.message}
					duration={currentToast.duration}
					onDismiss={() => handleDismiss(currentToast.id)}
				/>
			)}
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
