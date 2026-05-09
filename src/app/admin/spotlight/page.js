"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Star, ChevronLeft, ChevronRight, ChevronDown, Filter, X,
  Edit2, Trash2, MoreVertical, Loader2, ExternalLink, Plus,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { notifyError, notifySuccess } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "removed", label: "Removed" },
  { value: "expired", label: "Expired" },
  { value: "paused", label: "Paused" },
];

// Convert a local datetime-local string ("YYYY-MM-DDTHH:mm") to an ISO UTC string
function localInputToISO(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

// Convert a Date to the "YYYY-MM-DDTHH:mm" format expected by <input type="datetime-local">
function dateToInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

// Min datetime value = "now" rounded to next minute
function nowInputMin() {
  const d = new Date(Date.now() + 60000);
  return dateToInputValue(d);
}

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

  // Edit dialog state
  const [editItem, setEditItem] = useState(null);
  const [editEndTime, setEditEndTime] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Add spotlight dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Remove dialog state
  const [removeItem, setRemoveItem] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const canSpotlight = user?.is_admin || user?.permissions?.can_spotlight === true;
  const canRemoveSpotlight = user?.is_admin || user?.permissions?.can_remove_spotlight === true;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };

      if (status && status !== "all") params.status = status;

      if (dateFrom) {
        const d = new Date(dateFrom);
        params.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00.000Z`;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        params.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T23:59:59.999Z`;
      }

      const data = await apiClient.getSpotlightHistory(params);
      setSpotlights(data.spotlights || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      setPageSize(data.page_size || 20);
    } catch {
      notifyError("Failed to load spotlight history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [page, status, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setStatus("all");
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  };

  const getStatusBadge = (item) => {
    const val = (item.action?.toLowerCase() || item.status?.toLowerCase() || "");
    if (val === "active") return <Badge variant="success" className="text-xs">Active</Badge>;
    if (val === "expired") return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    if (val === "removed") return <Badge variant="destructive" className="text-xs">Removed</Badge>;
    if (val === "edited") return <Badge variant="outline" className="text-xs">Edited</Badge>;
    if (val === "paused") return <Badge variant="outline" className="text-xs">Paused</Badge>;
    return <Badge variant="outline" className="text-xs capitalize">{val || "—"}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try { return format(new Date(dateString), "MMM dd, yyyy HH:mm"); }
    catch { return dateString; }
  };

  const formatEndTime = (dateString, isUntilSold) => {
    if (isUntilSold) return "Until Sold";
    return formatDate(dateString);
  };

  const formatPlanLabel = (code) => {
    if (!code) return "—";
    return code.split(/[_-]+/).filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const isUntilSoldSpotlight = (s) => {
    const code = (s.package_code || s.products?.[0]?.package_code || "").toLowerCase();
    if (code === "spotlight" || code === "center_stage") return true;
    // Heuristic: end_time more than 1 year from now → treat as until-sold
    if (s.end_time) {
      const endMs = new Date(s.end_time).getTime();
      if (endMs - Date.now() > 365 * 24 * 3600 * 1000) return true;
    }
    return false;
  };

  const shouldShowActions = (item) => {
    const s = (item.action?.toLowerCase() || item.status?.toLowerCase() || "");
    return s === "active" || s === "paused";
  };

  const toggleExpand = (spotlightId) => {
    const next = new Set(expandedRows);
    next.has(spotlightId) ? next.delete(spotlightId) : next.add(spotlightId);
    setExpandedRows(next);
  };

  const hasActiveFilters = (status && status !== "all") || dateFrom || dateTo;

  // ── Open edit dialog ──────────────────────────────────────────────────────
  const openEdit = (spotlight) => {
    const sellerUsername = spotlight.products?.[0]?.seller_username || null;
    setEditItem({ ...spotlight, seller_username: sellerUsername });
    // Pre-fill end time with current end_time (if not until-sold) or blank
    if (!isUntilSoldSpotlight(spotlight) && spotlight.end_time) {
      setEditEndTime(dateToInputValue(new Date(spotlight.end_time)));
    } else {
      setEditEndTime("");
    }
  };

  // ── Submit edit ───────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editItem) return;
    if (!editEndTime) {
      notifyError("Please select an end date and time.");
      return;
    }
    const selectedDate = new Date(editEndTime);
    if (selectedDate <= new Date()) {
      notifyError("End time must be in the future.");
      return;
    }

    setEditLoading(true);
    try {
      const productIds = [editItem.product_id || editItem.id];
      const response = await apiClient.bulkEditProductsSpotlight(productIds, {
        custom_end_time: selectedDate.toISOString(),
      });
      notifySuccess(response.message || "Spotlight updated successfully");
      setEditItem(null);
      setEditEndTime("");
      fetchHistory();
    } catch (error) {
      notifyError(error.response?.data?.detail || "Failed to edit spotlight");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Submit add spotlight ──────────────────────────────────────────────────
  const handleAdd = async () => {
    const pid = parseInt(addProductId, 10);
    if (!addProductId || isNaN(pid) || pid <= 0) {
      notifyError("Please enter a valid product ID.");
      return;
    }
    if (!addEndTime) {
      notifyError("Please select an end date and time.");
      return;
    }
    const selectedDate = new Date(addEndTime);
    if (selectedDate <= new Date()) {
      notifyError("End time must be in the future.");
      return;
    }

    setAddLoading(true);
    try {
      await apiClient.addProductToSpotlight(pid, {
        custom_end_time: selectedDate.toISOString(),
      });
      notifySuccess("Spotlight applied successfully");
      setAddOpen(false);
      setAddProductId("");
      setAddEndTime("");
      fetchHistory();
    } catch (error) {
      notifyError(error.response?.data?.detail || "Failed to apply spotlight");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Submit remove ─────────────────────────────────────────────────────────
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
      notifyError(error.response?.data?.detail || "Failed to remove spotlight");
    } finally {
      setRemoveLoading(false);
    }
  };

  const buildProductUrl = (productId) => {
    if (!productId) return null;
    const base = (process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app").replace(/\/$/, "");
    return `${base}/products/${productId}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Spotlight History</h1>
            <p className="text-muted-foreground mt-1">View and manage spotlight application history</p>
          </div>
          <div className="flex gap-2">
            {canSpotlight && (
              <Button
                className="bg-[#E0B74F] text-[#0B0B0D] hover:bg-[#E0B74F]/90 flex items-center gap-2"
                onClick={() => { setAddOpen(true); setAddProductId(""); setAddEndTime(""); }}
              >
                <Plus className="h-4 w-4" />
                Apply Spotlight
              </Button>
            )}
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
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Started Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal border-border bg-background text-foreground hover:border-[#E0B74F] hover:bg-background hover:text-foreground transition-colors">
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setPage(1); }} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Ended Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal border-border bg-background text-foreground hover:border-[#E0B74F] hover:bg-background hover:text-foreground transition-colors">
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setPage(1); }} disabled={(d) => dateFrom && d < dateFrom} initialFocus />
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
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
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
                    <TableHead className="h-12 px-4 font-semibold text-secondary w-12" />
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[300px]">Listing</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Seller</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Started At</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">End Time</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Duration</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Plan</TableHead>
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
                    const hasChildren = spotlight.products?.length > 0;
                    const productUrl = buildProductUrl(spotlight.product_id);
                    const sellerUsername = spotlight.products?.[0]?.seller_username;
                    const untilSold = isUntilSoldSpotlight(spotlight);

                    return (
                      <>
                        <TableRow
                          key={spotlight.id}
                          className={`hover:bg-muted/30 transition-colors ${productUrl ? "cursor-pointer" : ""}`}
                          onDoubleClick={productUrl ? () => window.open(productUrl, "_blank") : undefined}
                        >
                          <TableCell className="py-3 px-4">
                            {hasChildren ? (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleExpand(spotlight.id); }}>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            ) : <div className="w-6" />}
                          </TableCell>

                          <TableCell className="py-3 px-4 max-w-[300px]">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-muted/50 shadow-sm flex-shrink-0">
                                {spotlight.product_image
                                  ? <img src={spotlight.product_image} alt={spotlight.product_title || "Product"} className="h-full w-full object-cover" />
                                  : <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">No Image</div>
                                }
                              </div>
                              <p className="font-semibold text-sm text-primary leading-tight break-words min-w-0 flex-1">
                                {spotlight.product_title || "Untitled listing"}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">
                              {sellerUsername ? `@${sellerUsername}` : "—"}
                            </p>
                          </TableCell>

                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">{formatDate(spotlight.start_time)}</p>
                          </TableCell>

                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">
                              {untilSold
                                ? <span className="text-xs font-medium text-amber-600">Until Sold</span>
                                : formatDate(spotlight.end_time)
                              }
                            </p>
                          </TableCell>

                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">
                              {untilSold ? "—" : (spotlight.duration_hours ? `${spotlight.duration_hours}h` : "—")}
                            </p>
                          </TableCell>

                          <TableCell className="py-3 px-4">
                            <p className="text-sm text-foreground">
                              {formatPlanLabel(spotlight.package_code || spotlight.products?.[0]?.package_code)}
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
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(productUrl, "_blank")}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Listing
                                    </DropdownMenuItem>
                                  )}
                                  {canSpotlight && shouldShowActions(spotlight) && (
                                    <DropdownMenuItem
                                      className="cursor-pointer group flex items-center gap-2 hover:bg-[#E0B74F] hover:text-[#0B0B0D] focus:bg-[#E0B74F] focus:text-[#0B0B0D] transition-colors"
                                      onClick={() => openEdit(spotlight)}
                                    >
                                      <Edit2 className="h-4 w-4 text-accent transition-colors group-hover:text-[#0B0B0D] group-focus:text-[#0B0B0D]" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {canRemoveSpotlight && shouldShowActions(spotlight) && (
                                    <DropdownMenuItem className="text-destructive cursor-pointer focus:text-destructive" onClick={() => setRemoveItem(spotlight)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>

                        {/* Child rows */}
                        {isExpanded && hasChildren && spotlight.products.map((child) => (
                          <TableRow key={child.id} className="bg-muted/20 hover:bg-muted/30 transition-colors">
                            <TableCell className="py-3 px-4">
                              <div className="w-6 ml-4 border-l-2 border-muted-foreground/30" />
                            </TableCell>
                            <TableCell className="py-3 px-4 max-w-[300px]">
                              <div className="flex items-center gap-3 ml-4">
                                <div className="h-10 w-10 rounded-lg border border-border overflow-hidden bg-muted/50 shadow-sm flex-shrink-0">
                                  {child.product_image
                                    ? <img src={child.product_image} alt={child.product_title || "Product"} className="h-full w-full object-cover" />
                                    : <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">No Image</div>
                                  }
                                </div>
                                <p className="font-medium text-sm text-primary leading-tight break-words min-w-0 flex-1">
                                  {child.product_title || "Untitled listing"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="text-sm text-foreground">{child.seller_username ? `@${child.seller_username}` : "—"}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="text-sm text-foreground">{formatDate(child.start_time)}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="text-sm text-foreground">{formatDate(child.end_time)}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="text-sm text-foreground">{child.duration_hours ? `${child.duration_hours}h` : "—"}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="text-sm text-foreground">{formatPlanLabel(child.package_code || spotlight.package_code)}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="text-sm text-foreground">@{child.applied_by_username || "—"}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {getStatusBadge(child)}
                            </TableCell>
                            {(canSpotlight || canRemoveSpotlight) && <TableCell />}
                          </TableRow>
                        ))}
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
                        {totalCount === 0 ? "0" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)}`}
                      </span>
                      <span className="ml-1 text-muted-foreground">of {totalCount}</span>
                    </div>
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Apply Spotlight Dialog ─────────────────────────────────── */}
        {canSpotlight && (
          <Dialog open={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); setAddProductId(""); setAddEndTime(""); } }}>
            <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" />
                  Apply Spotlight
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="add-product-id">Product ID</Label>
                  <Input
                    id="add-product-id"
                    type="number"
                    min="1"
                    placeholder="Enter product ID"
                    value={addProductId}
                    onChange={(e) => setAddProductId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The product must be verified and active.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-end-time">End Date &amp; Time</Label>
                  <Input
                    id="add-end-time"
                    type="datetime-local"
                    min={nowInputMin()}
                    value={addEndTime}
                    onChange={(e) => setAddEndTime(e.target.value)}
                    className="block w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    The spotlight will stay active until this date. Start time is set to now.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setAddOpen(false); setAddProductId(""); setAddEndTime(""); }} disabled={addLoading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={addLoading || !addProductId || !addEndTime}
                    className="bg-[#E0B74F] text-[#0B0B0D] hover:bg-[#E0B74F]/90"
                  >
                    {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Apply Spotlight
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* ── Edit Spotlight Dialog ──────────────────────────────────── */}
        {canSpotlight && (
          <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) { setEditItem(null); setEditEndTime(""); } }}>
            <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-accent" />
                  Edit Spotlight
                </DialogTitle>
              </DialogHeader>
              {editItem && (
                <div className="space-y-5 py-2">
                  {/* Info row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Listing</p>
                      <p className="text-sm font-semibold text-primary leading-tight">{editItem.product_title || "Untitled listing"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Seller</p>
                      <p className="text-sm font-medium text-foreground">
                        {editItem.seller_username ? `@${editItem.seller_username}` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Current end time info */}
                  {editItem.end_time && (
                    <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      Current end time:{" "}
                      <span className="font-medium text-foreground">
                        {isUntilSoldSpotlight(editItem)
                          ? "Until Sold"
                          : formatDate(editItem.end_time)
                        }
                      </span>
                    </div>
                  )}

                  {/* New end time picker */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-end-time">New End Date &amp; Time</Label>
                    <Input
                      id="edit-end-time"
                      type="datetime-local"
                      min={nowInputMin()}
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="block w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      The spotlight will stay active until the selected date and time.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = buildProductUrl(editItem?.product_id);
                        if (url) window.open(url, "_blank");
                      }}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Listing
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { setEditItem(null); setEditEndTime(""); }} disabled={editLoading}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEdit}
                        disabled={editLoading || !editEndTime}
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

        {/* ── Remove Spotlight Dialog ────────────────────────────────── */}
        {canRemoveSpotlight && (
          <AlertDialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Spotlight?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove the spotlight for &quot;{removeItem?.product_title || "this listing"}&quot;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removeLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={removeLoading}>
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
