"use client";

import { useToast } from "./toast-provider";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border shadow-lg rounded-md p-4 w-80 flex justify-between items-start"
        >
          <div>
            {toast.title && (
              <p className="font-semibold text-gray-900">{toast.title}</p>
            )}
            {toast.description && (
              <p className="text-sm text-gray-600">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="ml-3 text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}