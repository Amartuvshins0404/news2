"use client";

import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive" | "success";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, duration, variant = "default" } = options;

    const message = title ?? description ?? "Notification";
    const toastOptions = {
      description: title && description ? description : undefined,
      duration,
    };

    if (variant === "destructive") {
      sonnerToast.error(message, toastOptions);
      return;
    }

    if (variant === "success") {
      sonnerToast.success(message, toastOptions);
      return;
    }

    sonnerToast(message, toastOptions);
  }, []);

  return { toast };
}
