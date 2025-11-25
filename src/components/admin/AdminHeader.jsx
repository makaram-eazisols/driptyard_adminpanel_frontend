"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, UserCircle2, LogOut, Settings, User, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday } from "date-fns";

const mockNotifications = [
  {
    id: 1,
    type: "success",
    title: "New Order Received",
    message: "Order #ORD001 has been placed successfully",
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "Product Verification",
    message: "3 products are pending verification",
    time: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
  },
  {
    id: 3,
    type: "warning",
    title: "Low Stock Alert",
    message: "Luxury Watch Collection is running low",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 4,
    type: "success",
    title: "User Verified",
    message: "John Doe's account has been verified",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
];

export const AdminHeader = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        {/* <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search anything..." 
            className="pl-10 border-input bg-background"
          />
        </div> */}
      </div>
      <div className="flex items-center gap-2">
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-muted rounded-lg"
            >
              <Bell className="h-5 w-5 text-foreground/70" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-background"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-lg border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-secondary border border-transparent hover:text-secondary hover:border-border hover:bg-transparent"
                  onClick={() =>
                    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
                  }
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-96">
              <div className="divide-y">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const getIcon = () => {
                      switch (notification.type) {
                        case "success":
                          return <CheckCircle className="h-5 w-5 text-[#2ECC71]" />;
                        case "warning":
                          return <AlertCircle className="h-5 w-5 text-accent" />;
                        default:
                          return <Info className="h-5 w-5 text-secondary" />;
                      }
                    };

                    return (
                      <button
                        key={notification.id}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          notification.read ? "bg-background" : "bg-accent/10"
                        } hover:bg-muted/70`}
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((item) =>
                              item.id === notification.id ? { ...item, read: true } : item,
                            ),
                          )
                        }
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">{getIcon()}</div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {isToday(notification.time) ? "Today" : format(notification.time, "MMM dd, yyyy")} ·{" "}
                              {format(notification.time, "h:mm a")}
                            </p>
                          </div>
                          {!notification.read && <span className="w-2 h-2 rounded-full bg-accent mt-2" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 hover:bg-muted rounded-lg px-3 hover:text-primary">
              <div className="w-8 h-8 rounded-full gradient-driptyard flex items-center justify-center shadow-md">
                <UserCircle2 className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium hidden md:inline">{user?.name || 'Admin'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-semibold">
              <div className="flex flex-col">
                <span>{user?.name || 'Admin User'}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email || 'admin@driptyard.com'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem> */}
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push("/admin/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

