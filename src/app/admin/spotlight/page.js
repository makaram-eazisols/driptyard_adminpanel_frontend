"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "applied", label: "Applied" },
  { value: "expired", label: "Expired" },
];

function Spotlight() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
      };

      if (productId) {
        params.product_id = productId;
      }

      if (status && status !== "all") {
        params.status = status;
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        params.date_from = fromDate.toISOString();
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        params.date_to = toDate.toISOString();
      }

      const data = await apiClient.getSpotlightHistory(params);
      setHistory(data.history || []);
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
  }, [page, productId, status, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setProductId("");
    setStatus("all");
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  };

  const getStatusBadge = (item) => {
    const action = item.action?.toLowerCase() || "";
    if (action === "applied") {
      return <Badge variant="success" className="text-xs">Applied</Badge>;
    }
    if (action === "expired") {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{action || "—"}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };


  const hasActiveFilters = productId || (status && status !== "all") || dateFrom || dateTo;

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
                  {[productId, status && status !== "all" ? status : null, dateFrom, dateTo].filter(Boolean).length}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-id">Product ID</Label>
                <Input
                  id="product-id"
                  placeholder="Enter product ID"
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
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
                <Label>Date From</Label>
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
                <Label>Date To</Label>
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
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No spotlight history found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[300px]">Product</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Seller</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Applied At</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">End Time</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Duration</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Applied By</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => {
                    const productId = item.product_id;
                    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard-finalized-frontend.vercel.app";
                    // Ensure proper URL construction with /products/ path
                    // Remove trailing slash and check if /products/ already exists
                    let baseUrl = websiteUrl.endsWith('/') ? websiteUrl.slice(0, -1) : websiteUrl;
                    // If baseUrl already ends with /products, use it as is, otherwise add /products
                    if (!baseUrl.endsWith('/products')) {
                      baseUrl = `${baseUrl}/products`;
                    }
                    const productUrl = productId ? `${baseUrl}/${productId}` : null;
                    
                    const handleRowClick = () => {
                      if (productUrl) {
                        window.open(productUrl, "_blank");
                      }
                    };
                    
                    return (
                      <TableRow 
                        key={item.id || item.spotlight_id} 
                        className={`hover:bg-muted/30 transition-colors ${productUrl ? "cursor-pointer" : ""}`}
                        onDoubleClick={productUrl ? handleRowClick : undefined}
                      >
                        <TableCell className="py-3 px-4 max-w-[300px]">
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-muted/50 shadow-sm flex-shrink-0">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_title || "Product"}
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
                                {item.product_title || "Untitled listing"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">@{item.seller_username || "—"}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">{formatDate(item.start_time || item.created_at)}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">{formatDate(item.end_time)}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">
                            {item.duration_hours ? `${item.duration_hours} hours` : "—"}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">@{item.applied_by_username || "—"}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {getStatusBadge(item)}
                        </TableCell>
                      </TableRow>
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
