"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, ChevronLeft, ChevronRight, ChevronDown, Filter, X, Edit2, Trash2, MoreVertical, Loader2, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { notifyError, notifySuccess } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "removed", label: "Removed" },
  { value: "expired", label: "Expired" },   
  { value: "paused", label: "Paused" },
];

function Spotlight() {
  const { user } = useAuth();
  const [spotlights, setSpotlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editItem, setEditItem] = useState(null);
  const [editDuration, setEditDuration] = useState("24");
  const [editCustomDate, setEditCustomDate] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [removeItem, setRemoveItem] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const { toast } = useToast();

  // Check permissions
  const canSpotlight = user?.is_admin || user?.permissions?.can_spotlight === true;
  const canRemoveSpotlight = user?.is_admin || user?.permissions?.can_remove_spotlight === true;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
      };

      if (status && status !== "all") {
        params.status = status;
      }

      if (dateFrom) {
        // Use local date components to avoid timezone shift
        const fromDate = new Date(dateFrom);
        const year = fromDate.getFullYear();
        const month = String(fromDate.getMonth() + 1).padStart(2, '0');
        const day = String(fromDate.getDate()).padStart(2, '0');
        params.date_from = `${year}-${month}-${day}T00:00:00.000Z`;
      }

      if (dateTo) {
        // Use local date components to avoid timezone shift
        const toDate = new Date(dateTo);
        const year = toDate.getFullYear();
        const month = String(toDate.getMonth() + 1).padStart(2, '0');
        const day = String(toDate.getDate()).padStart(2, '0');
        params.date_to = `${year}-${month}-${day}T23:59:59.999Z`;
      }

      const data = await apiClient.getSpotlightHistory(params);
      setSpotlights(data.spotlights || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      setPageSize(data.page_size || 20);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load spotlight history",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, status, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setStatus("all");
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  };

  const getStatusBadge = (item) => {
    const action = item.action?.toLowerCase() || "";
    const status = item.status?.toLowerCase() || "";
    const statusValue = action || status;
    
    if (statusValue === "active") {
      return <Badge variant="success" className="text-xs">Active</Badge>;
    }
    if (statusValue === "expired") {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    if (statusValue === "removed") {
      return <Badge variant="destructive" className="text-xs">Removed</Badge>;
    }
    if (statusValue === "edited") {
      return <Badge variant="outline" className="text-xs">Edited</Badge>;
    }
    if (statusValue === "paused") {
      return <Badge variant="outline" className="text-xs">Paused</Badge>;
    }
    return <Badge variant="outline" className="text-xs capitalize">{statusValue || "—"}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  // Check if spotlight should show Edit/Remove actions
  // Show for active spotlights (including expired ones that were previously active)
  // Don't show for removed spotlights
  const shouldShowActions = (item) => {
    const action = item.action?.toLowerCase() || "";
    const status = item.status?.toLowerCase() || "";
    // Show if active (regardless of whether expired or not)
    // Don't show if already removed
    return action === "active" || status === "active";
  };

  // Toggle expand/collapse for a row
  const toggleExpand = (spotlightId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(spotlightId)) {
      newExpanded.delete(spotlightId);
    } else {
      newExpanded.add(spotlightId);
    }
    setExpandedRows(newExpanded);
  };


  const hasActiveFilters = (status && status !== "all") || dateFrom || dateTo;

  // Individual edit handler
  const handleEdit = async () => {
    if (!editItem) return;

    setEditLoading(true);
    try {
      const productIds = [editItem.product_id || editItem.id];
      let requestData = {};

      if (editDuration === "custom" && editCustomDate) {
        const now = new Date();
        const selectedDate = new Date(editCustomDate);
        if (selectedDate > now) {
          requestData.custom_end_time = selectedDate.toISOString();
        } else {
          notifyError("Custom date must be in the future");
          setEditLoading(false);
          return;
        }
      } else {
        requestData.duration_hours = parseInt(editDuration);
      }

      const response = await apiClient.bulkEditProductsSpotlight(productIds, requestData);
      notifySuccess(response.message || "Spotlight updated successfully");
      setEditItem(null);
      setEditDuration("24");
      setEditCustomDate(null);
      fetchHistory();
    } catch (error) {
      console.error("Failed to edit spotlight:", error);
      notifyError(error.response?.data?.detail || "Failed to edit spotlight");
    } finally {
      setEditLoading(false);
    }
  };

  // Individual remove handler
  const handleRemove = async () => {
    if (!removeItem) return;

    setRemoveLoading(true);
    try {
      const productIds = [removeItem.product_id || removeItem.id];
      const response = await apiClient.bulkRemoveProductsSpotlight(productIds);
      notifySuccess(response.message || "Spotlight removed successfully");
      setRemoveItem(null);
      fetchHistory();
    } catch (error) {
      console.error("Failed to remove spotlight:", error);
      notifyError(error.response?.data?.detail || "Failed to remove spotlight");
    } finally {
      setRemoveLoading(false);
    }
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Spotlight History</h1>
            <p className="text-muted-foreground mt-1">View and manage spotlight application history</p>
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
                  {[status && status !== "all" ? status : null, dateFrom, dateTo].filter(Boolean).length}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Started Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border bg-background text-foreground hover:border-[#E0B74F] hover:bg-background hover:text-foreground transition-colors"
                    >
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => {
                        setDateFrom(date);
                        setPage(1);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Ended Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border bg-background text-foreground hover:border-[#E0B74F] hover:bg-background hover:text-foreground transition-colors"
                    >
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => {
                        setDateTo(date);
                        setPage(1);
                      }}
                      disabled={(date) => dateFrom && date < dateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : spotlights.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No spotlight history found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-12 px-4 font-semibold text-secondary w-12"></TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[300px]">Listing</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Seller</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Started At</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">End Time</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Duration</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Applied By</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                    {(canSpotlight || canRemoveSpotlight) && (
                      <TableHead className="h-12 px-4 text-right font-semibold text-secondary">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spotlights.map((spotlight) => {
                    const isExpanded = expandedRows.has(spotlight.id);
                    const hasChildren = spotlight.products && spotlight.products.length > 0;
                    const productId = spotlight.product_id;
                    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app";
                    let baseUrl = websiteUrl.endsWith('/') ? websiteUrl.slice(0, -1) : websiteUrl;
                    if (!baseUrl.endsWith('/products')) {
                      baseUrl = `${baseUrl}/products`;
                    }
                    const productUrl = productId ? `${baseUrl}/${productId}` : null;
                    
                    const handleRowClick = () => {
                      if (productUrl) {
                        window.open(productUrl, "_blank");
                      }
                    };

                    // Render parent row
                    return (
                      <>
                        <TableRow 
                          key={spotlight.id} 
                          className={`hover:bg-muted/30 transition-colors ${productUrl ? "cursor-pointer" : ""}`}
                          onDoubleClick={productUrl ? handleRowClick : undefined}
                        >
                          <TableCell className="py-3 px-4">
                            {hasChildren ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(spotlight.id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <div className="w-6" />
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4 max-w-[300px]">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-muted/50 shadow-sm flex-shrink-0">
                                {spotlight.product_image ? (
                                  <img
                                    src={spotlight.product_image}
                                    alt={spotlight.product_title || "Product"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-primary leading-tight break-words">
                                  {spotlight.product_title || "Untitled listing"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">@{spotlight.applied_by_username || "—"}</p>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">{formatDate(spotlight.start_time)}</p>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">{formatDate(spotlight.end_time)}</p>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">
                              {spotlight.duration_hours ? `${spotlight.duration_hours} hours` : "—"}
                            </p>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">@{spotlight.applied_by_username || "—"}</p>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {getStatusBadge(spotlight)}
                          </TableCell>
                          {(canSpotlight || canRemoveSpotlight) && (
                            <TableCell className="py-3 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {productUrl && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => {
                                        if (productUrl) {
                                          window.open(productUrl, "_blank");
                                        }
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Listing
                                    </DropdownMenuItem>
                                  )}
                                  {canSpotlight && shouldShowActions(spotlight) && (
                                    <DropdownMenuItem
                                      className="cursor-pointer group flex items-center gap-2 hover:bg-[#E0B74F] hover:text-[#0B0B0D] focus:bg-[#E0B74F] focus:text-[#0B0B0D] transition-colors"
                                      onClick={() => {
                                        setEditItem(spotlight);
                                        if (spotlight.duration_hours) {
                                          setEditDuration(String(spotlight.duration_hours));
                                        } else if (spotlight.end_time) {
                                          setEditDuration("custom");
                                          setEditCustomDate(new Date(spotlight.end_time));
                                        } else {
                                          setEditDuration("24");
                                        }
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 text-accent transition-colors group-hover:text-[#0B0B0D] group-focus:text-[#0B0B0D]" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {canRemoveSpotlight && shouldShowActions(spotlight) && (
                                    <DropdownMenuItem
                                      className="text-destructive cursor-pointer focus:text-destructive"
                                      onClick={() => setRemoveItem(spotlight)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Render child rows when expanded */}
                        {isExpanded && hasChildren && spotlight.products.map((childItem) => {
                          const childProductId = childItem.product_id;
                          const childProductUrl = childProductId ? `${baseUrl}/${childProductId}` : null;
                          
                          return (
                            <TableRow 
                              key={childItem.id} 
                              className="bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="py-3 px-4">
                                <div className="w-6 ml-4 border-l-2 border-muted-foreground/30" />
                              </TableCell>
                              <TableCell className="py-3 px-4 max-w-[300px]">
                                <div className="flex items-center gap-3 ml-4">
                                  <div className="h-10 w-10 rounded-lg border border-border overflow-hidden bg-muted/50 shadow-sm flex-shrink-0">
                                    {childItem.product_image ? (
                                      <img
                                        src={childItem.product_image}
                                        alt={childItem.product_title || "Product"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                                        No Image
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-primary leading-tight break-words">
                                      {childItem.product_title || "Untitled listing"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">@{childItem.seller_username || "—"}</p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">{formatDate(childItem.start_time)}</p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">{formatDate(childItem.end_time)}</p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">
                                  {childItem.duration_hours ? `${childItem.duration_hours} hours` : "—"}
                                </p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">@{childItem.applied_by_username || "—"}</p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                {getStatusBadge(childItem)}
                              </TableCell>
                              {/* {(canSpotlight || canRemoveSpotlight) && (
                                <TableCell className="py-3 px-4 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {childProductUrl && (
                                        <DropdownMenuItem
                                          className="cursor-pointer"
                                          onClick={() => {
                                            if (childProductUrl) {
                                              window.open(childProductUrl, "_blank");
                                            }
                                          }}
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          View Listing
                                        </DropdownMenuItem>
                                      )}
                                      {canSpotlight && shouldShowActions(childItem) && (
                                        <DropdownMenuItem
                                          className="cursor-pointer group flex items-center gap-2 hover:bg-[#E0B74F] hover:text-[#0B0B0D] focus:bg-[#E0B74F] focus:text-[#0B0B0D] transition-colors"
                                          onClick={() => {
                                            setEditItem(childItem);
                                            if (childItem.duration_hours) {
                                              setEditDuration(String(childItem.duration_hours));
                                            } else if (childItem.end_time) {
                                              setEditDuration("custom");
                                              setEditCustomDate(new Date(childItem.end_time));
                                            } else {
                                              setEditDuration("24");
                                            }
                                          }}
                                        >
                                          <Edit2 className="h-4 w-4 text-accent transition-colors group-hover:text-[#0B0B0D] group-focus:text-[#0B0B0D]" />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      {canRemoveSpotlight && shouldShowActions(childItem) && (
                                        <DropdownMenuItem
                                          className="text-destructive cursor-pointer focus:text-destructive"
                                          onClick={() => setRemoveItem(childItem)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remove
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )} */}
                            </TableRow>
                          );
                        })}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-end mt-8">
                  <div className="inline-flex items-center divide-x divide-border rounded-xl border border-border bg-background shadow-sm">
                    <div className="px-4 py-2 text-sm font-medium">
                      <span className="text-primary">
                        {totalCount === 0
                          ? "0"
                          : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)}`}
                      </span>
                      <span className="ml-1 text-muted-foreground">of {totalCount}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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

        {/* Edit Spotlight Dialog */}
        {canSpotlight && (
          <Dialog open={!!editItem} onOpenChange={() => {
            setEditItem(null);
            setEditDuration("24");
            setEditCustomDate(null);
          }}>
            <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-accent" />
                  Edit Spotlight
                </DialogTitle>
              </DialogHeader>
              {editItem && (
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Listing</Label>
                      <p className="text-base font-semibold text-primary">{editItem.product_title || "Untitled listing"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Seller</Label>
                      <p className="text-base font-medium text-foreground">@{editItem.seller_username || "—"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Choose New Spotlight Duration</Label>
                    <RadioGroup value={editDuration} onValueChange={setEditDuration} className="flex flex-wrap gap-6 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="24" id="edit-24h" />
                        <Label htmlFor="edit-24h" className="cursor-pointer font-normal">24 Hours</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="72" id="edit-3d" />
                        <Label htmlFor="edit-3d" className="cursor-pointer font-normal">3 Days</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="168" id="edit-7d" />
                        <Label htmlFor="edit-7d" className="cursor-pointer font-normal">7 Days</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="edit-custom" />
                        <Label htmlFor="edit-custom" className="cursor-pointer font-normal">Custom</Label>
                      </div>
                    </RadioGroup>
                    {editDuration === "custom" && (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-2">
                          <Label>Select Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border border-border bg-background hover:border-[#E0B74F] hover:bg-background transition-colors"
                              >
                                {editCustomDate ? (
                                  new Date(editCustomDate).toLocaleDateString()
                                ) : (
                                  <span className="text-muted-foreground">Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={editCustomDate}
                                onSelect={(date) => {
                                  if (date) {
                                    const newDate = new Date(date);
                                    if (editCustomDate) {
                                      newDate.setHours(editCustomDate.getHours(), editCustomDate.getMinutes());
                                    } else {
                                      newDate.setHours(23, 59);
                                    }
                                    setEditCustomDate(newDate);
                                  } else {
                                    setEditCustomDate(null);
                                  }
                                }}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        {editCustomDate && (
                          <div className="space-y-2">
                            <Label>Select Time</Label>
                            <div className="flex items-center gap-2">
                              <Select
                                value={editCustomDate ? String(new Date(editCustomDate).getHours() % 12 || 12) : "1"}
                                onValueChange={(value) => {
                                  if (editCustomDate) {
                                    const newDate = new Date(editCustomDate);
                                    const currentHours = newDate.getHours();
                                    const isPM = currentHours >= 12;
                                    const newHours = isPM ? parseInt(value) + 12 : parseInt(value);
                                    newDate.setHours(newHours % 24, newDate.getMinutes());
                                    setEditCustomDate(newDate);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                      {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-muted-foreground">:</span>
                              <Select
                                value={editCustomDate ? String(new Date(editCustomDate).getMinutes()).padStart(2, "0") : "00"}
                                onValueChange={(value) => {
                                  if (editCustomDate) {
                                    const newDate = new Date(editCustomDate);
                                    newDate.setMinutes(parseInt(value));
                                    setEditCustomDate(newDate);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 60 }, (_, i) => (
                                    <SelectItem key={i} value={String(i).padStart(2, "0")}>
                                      {String(i).padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={editCustomDate && new Date(editCustomDate).getHours() >= 12 ? "PM" : "AM"}
                                onValueChange={(value) => {
                                  if (editCustomDate) {
                                    const newDate = new Date(editCustomDate);
                                    const currentHours = newDate.getHours();
                                    const isPM = value === "PM";
                                    const hour12 = currentHours % 12 || 12;
                                    newDate.setHours(isPM ? hour12 + 12 : hour12 % 12, newDate.getMinutes());
                                    setEditCustomDate(newDate);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app";
                        let baseUrl = websiteUrl.endsWith('/') ? websiteUrl.slice(0, -1) : websiteUrl;
                        if (!baseUrl.endsWith('/products')) {
                          baseUrl = `${baseUrl}/products`;
                        }
                        const productUrl = editItem?.product_id ? `${baseUrl}/${editItem.product_id}` : null;
                        if (productUrl) {
                          window.open(productUrl, "_blank");
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Listing
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditItem(null);
                          setEditDuration("24");
                          setEditCustomDate(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEdit}
                        disabled={editLoading || (editDuration === "custom" && !editCustomDate)}
                        className="border-[#E0B74F] bg-[#E0B74F] text-[#0B0B0D] hover:bg-[#E0B74F]/90"
                      >
                        {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Update Spotlight
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Remove Spotlight Dialog */}
        {canRemoveSpotlight && (
          <AlertDialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Spotlight?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove the spotlight for "{removeItem?.product_title || "this listing"}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removeLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={removeLoading}
                >
                  {removeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      </div>
    </AdminLayout>
  );
}

export default function SpotlightPage() {
  return (
    <ProtectedRoute>
      <Spotlight />
    </ProtectedRoute>
  );
}
