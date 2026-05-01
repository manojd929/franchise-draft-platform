"use client";

import { AppThemeProvider } from "@/components/app-theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider delay={200}>
        {children}
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </AppThemeProvider>
  );
}
