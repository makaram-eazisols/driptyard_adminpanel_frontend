"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package2, 
  Users2, 
  Flag,
  Star,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: Home, end: true },
  { title: "Products", url: "/admin/products", icon: Package2 },
  { title: "Users", url: "/admin/users", icon: Users2 },
  { title: "Flagged Content", url: "/admin/flagged", icon: Flag },
  { title: "Spotlight", url: "/admin/spotlight", icon: Star },
];

export function AdminSidebar() {
  const pathname = usePathname();
  
  return (
    <Sidebar className="border-r border-border bg-card" collapsible="offcanvas">
      <SidebarHeader className="border-b border-border p-6">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Driptyard Admin"
            width={160}
            height={48}
            priority
            className="h-auto w-full max-w-[160px] object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/admin" && pathname?.startsWith(item.url));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        href={item.url}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground/70 transition-all",
                          !isActive && "hover:bg-muted hover:text-foreground",
                        )}
                        activeClassName="bg-primary text-primary-foreground font-semibold shadow-md"
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-colors",
                          )}
                          strokeWidth={2}
                        />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

