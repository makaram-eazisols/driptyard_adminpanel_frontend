"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  // Don't protect the login page - allow unauthenticated access
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protect all other admin routes
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

