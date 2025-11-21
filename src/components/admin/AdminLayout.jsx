"use client";

import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { cn } from "@/lib/utils";

const LayoutContent = ({ children }) => {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <SidebarInset 
      className={cn(
        "flex flex-col h-screen transition-all duration-200 ease-linear",
        isExpanded && "md:ml-[var(--sidebar-width)]"
      )}
    >
      <AdminHeader />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </SidebarInset>
  );
};

export const AdminLayout = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
};

