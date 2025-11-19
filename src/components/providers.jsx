"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <AdminProvider>
        <Toaster />
        <Sonner />
        {children}
      </AdminProvider>
    </AuthProvider>
  );
}

