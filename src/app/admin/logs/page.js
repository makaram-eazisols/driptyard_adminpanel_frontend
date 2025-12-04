"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileText, Loader2, Filter, X, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { notifyError } from "@/lib/toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

function Logs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("all");
  const [action, setAction] = useState("all");
  const [date, setDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [availableActions, setAvailableActions] = useState([]);
  const [actionsLoaded, setActionsLoaded] = useState(false);

  // Fetch available actions once on mount (without filters)
  useEffect(() => {
    fetchAvailableActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, role, action, date]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Fetch all available actions once (without filters) for persistent dropdown
  const fetchAvailableActions = async () => {
    try {
      const params = {
        page: 1,
        page_size: 1, // Just need the available_actions field
      };
      
      const data = await apiClient.getAdminLogs(params);
      
      if (data.available_actions && Array.isArray(data.available_actions) && data.available_actions.length > 0) {
        setAvailableActions(data.available_actions.sort());
        setActionsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch available actions:", error);
      // Don't show error toast for this background operation
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
      };

      if (role && role !== "all") {
        params.is_admin = role === "admin";
      }

      if (action && action !== "all") {
        // URL encode the action value (e.g., "Applied Spotlight" becomes "Applied+Spotlight")
        params.action = action;
      }

      if (date) {
        // Format date as YYYY-MM-DD
        params.date = format(date, "yyyy-MM-dd");
      }

      const data = await apiClient.getAdminLogs(params);
      
      // Extract logs data
      const logsData = data.logs || data.items || [];
      
      // Update available_actions if not loaded yet (fallback)
      if (!actionsLoaded && data.available_actions && Array.isArray(data.available_actions) && data.available_actions.length > 0) {
        setAvailableActions(data.available_actions.sort());
        setActionsLoaded(true);
      }
      
      setLogs(logsData);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || logsData.length || 0);
      setPageSize(data.page_size || pageSize);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      notifyError(error.response?.data?.detail || error.message || "Failed to fetch logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setRole("all");
    setAction("all");
    setDate(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = role !== "all" || action !== "all" || date !== null;

  const ROLE_OPTIONS = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "moderator", label: "Moderator" },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary">Logs & Audit Trails</h1>
              <p className="text-muted-foreground">Security Logs Table</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[role !== "all" ? role : null, action !== "all" ? action : null, date ? "date" : null].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="rounded-lg border border-border bg-background p-4 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => {
                      setRole(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                  <Label htmlFor="action">Action</Label>
                  <Select
                    value={action}
                    onValueChange={(value) => {
                      setAction(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger id="action">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {availableActions.map((actionItem) => (
                        <SelectItem key={actionItem} value={actionItem}>
                          {actionItem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-border bg-background text-foreground hover:border-[#E0B74F] hover:bg-background hover:text-foreground transition-colors"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          setDate(selectedDate);
                          setCurrentPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No logs found</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Timestamp</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Admin</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Action</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={log.id || log.log_id || index} className="hover:bg-muted/50">
                        <TableCell className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            {formatDateTime(log.timestamp || log.created_at || log.date)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-foreground">
                              {log.admin || log.admin_name || log.admin_username || log.user || "N/A"}
                            </div>
                            {log.is_admin !== undefined && (
                              <Badge
                                variant={log.is_admin ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {log.is_admin ? "Admin" : "Moderator"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            {log.action || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            {log.target || log.target_id || log.target_name || "N/A"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-end mt-8">
                  <div className="inline-flex items-center divide-x divide-border rounded-xl border border-border bg-background shadow-sm">
                    <div className="px-4 py-2 text-sm font-medium">
                      <span className="text-primary">
                        {totalCount === 0
                          ? "0"
                          : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)}`}
                      </span>
                      <span className="ml-1 text-muted-foreground">of {totalCount}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                      className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default Logs;

