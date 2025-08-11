"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import React from "react";

export function Toaster() {
  const { toasts } = useToast();

  // Debug: Log toast data to help identify empty toasts
  React.useEffect(() => {
    if (toasts.length > 0) {
      console.log(
        "🔔 Current toasts:",
        toasts.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          variant: t.variant,
        }))
      );
    }
  }, [toasts]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
