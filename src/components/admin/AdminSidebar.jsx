"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Package2,
  Users2,
  Flag,
  Star,
  ChevronRight,
  Shield,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const buildMenuItems = (user) => {
  const isAdmin = user?.is_admin;
  const perms = user?.permissions || {};

  const can = (field) => {
    if (isAdmin) return true;
    return !!perms[field];
  };

  const items = [];

  if (can("can_see_dashboard")) {
    items.push({ title: "Dashboard", url: "/admin", icon: Home, end: true });
  }

  if (can("can_see_users")) {
    items.push({ title: "Users", url: "/admin/users", icon: Users2 });
  }

  if (can("can_see_listings")) {
    const listingsChildren = [{ title: "Listings", url: "/admin/products", icon: Package2 }];
    if (can("can_see_spotlight_history")) {
      listingsChildren.push({ title: "Spotlight History", url: "/admin/spotlight", icon: Star });
    }
    items.push({
      title: "Listings",
      icon: Package2,
      children: listingsChildren,
    });
  }

  if (can("can_see_flagged_content")) {
    items.push({ title: "Flagged Content", url: "/admin/flagged", icon: Flag });
  }

  // Only admins see Roles & Permissions management
  if (isAdmin || user?.role === "admin") {
    items.push({ title: "Roles & Permissions", url: "/admin/roles-permissions", icon: Shield });
  }

  return items;
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const menuItems = buildMenuItems(user);
  const [openMenu, setOpenMenu] = useState(() => {
    const parent = menuItems.find((item) => item.children?.some((child) => pathname?.startsWith(child.url)));
    return parent ? parent.title : null;
  });

  useEffect(() => {
    const parent = menuItems.find((item) => item.children?.some((child) => pathname?.startsWith(child.url)));
    if (parent) {
      setOpenMenu(parent.title);
    }
  }, [pathname, menuItems]);

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
                const hasChildren = Array.isArray(item.children);
                const isExpanded = openMenu === item.title;

                if (hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => setOpenMenu(isExpanded ? null : item.title)}
                        className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-foreground/70 hover:bg-muted hover:text-foreground"
                        isActive={item.children?.some((child) => pathname?.startsWith(child.url))}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" strokeWidth={2} />
                          <span className="text-sm">{item.title}</span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform text-muted-foreground group-data-[active=true]:text-primary",
                            isExpanded && "rotate-90",
                          )}
                          strokeWidth={2}
                        />
                      </SidebarMenuButton>
                      {isExpanded && (
                        <SidebarMenuSub className="mt-2 space-y-1 !mx-0 !translate-x-0 border-l border-border/70 pl-4 ml-4">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.url || pathname?.startsWith(child.url);
                            return (
                              <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton asChild isActive={isChildActive}>
                                  <NavLink
                                    href={child.url}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-foreground/70",
                                      !isChildActive && "hover:bg-muted",
                                      isChildActive &&
                                        "bg-primary text-primary-foreground font-medium shadow-sm",
                                    )}
                                  >
                                    <child.icon className="h-4 w-4" strokeWidth={2} />
                                    <span className="text-sm">{child.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                const isActive =
                  pathname === item.url || (item.url !== "/admin" && pathname?.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        href={item.url}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground/70 transition-all",
                          !isActive && "hover:bg-muted hover:text-foreground",
                        )}
                        activeClassName="bg-primary text-primary-foreground font-semibold shadow-md"
                      >
                        <item.icon className="h-5 w-5 transition-colors" strokeWidth={2} />
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

