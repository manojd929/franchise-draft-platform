"use client";

import { AppThemeProvider } from "@/components/app-theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DashboardAppearanceProvider } from "@/features/dashboard/dashboard-appearance-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider defaultTheme="dark" enableSystem disableTransitionOnChange>
      <DashboardAppearanceProvider>
        <TooltipProvider delay={200}>
          {children}
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </DashboardAppearanceProvider>
    </AppThemeProvider>
  );
}
