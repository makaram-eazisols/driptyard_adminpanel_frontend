"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, X, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { notifyError } from "@/lib/toast";
import { format, parseISO } from "date-fns";

const SUCCESS_ORDER_STATUSES = ["completed", "shipped", "delivered", "paid"];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  // const [searchOrderNumber, setSearchOrderNumber] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [currentPage, status]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
      };

      // Filter by status
      if (status && status !== "all") {
        params.status = status;
      }

      // Commented out search functionality
      // if (searchOrderNumber.trim()) {
      //   params.order_number = searchOrderNumber.trim();
      // }

      const data = await apiClient.getAdminOrders(params);
      setOrders(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total ?? 0);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      notifyError(error.response?.data?.detail || "Failed to fetch orders");
      setOrders([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Commented out search handlers
  // const handleSearchChange = (e) => {
  //   setSearchOrderNumber(e.target.value);
  //   setCurrentPage(1);
  // };

  // const handleSearchKeyDown = (e) => {
  //   if (e.key === "Enter") {
  //     fetchOrders();
  //   }
  // };

  const handleClearFilters = () => {
    setStatus("all");
    setCurrentPage(1);
  };

  const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "processing", label: "Processing" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    // { value: "delivered", label: "Delivered" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const hasActiveFilters = status && status !== "all";

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "—";
      const date = parseISO(dateString);
      return format(date, "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Orders</h1>
            <p className="text-muted-foreground mt-1">Track and manage customer orders</p>
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
                  1
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
              {/* Commented out search functionality */}
              {/* <div className="space-y-2 w-full md:w-auto md:min-w-[250px]">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by order number..."
                    className="pl-10 bg-background"
                    value={searchOrderNumber}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
              </div> */}
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value);
                    setCurrentPage(1);
                  }}
                >
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
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Report</TableHead>
                      {/* <TableHead className="text-right">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const orderId = order.order_number || order.id || "—";
                      const productName = order.product_details?.title || "—";
                      const sellerName = order.product_details?.seller_username || "—";
                      const orderDate = order.created_at || null;
                      const orderTotal = order.total_amount || 0;
                      const orderStatus = order.status || "pending";
                      const orderReport = order.order_report;

                      return (
                        <TableRow key={order.id || orderId}>
                          <TableCell className="font-medium">{orderId}</TableCell>
                          <TableCell>{productName}</TableCell>
                          <TableCell className="text-muted-foreground">{sellerName}</TableCell>
                          <TableCell>{formatDate(orderDate)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(orderTotal)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                SUCCESS_ORDER_STATUSES.includes((orderStatus || "").toLowerCase())
                                  ? "success"
                                  : "destructive"
                              }
                            >
                              {orderStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {orderReport ? (
                              <div className="flex items-center gap-2">
                                {/* <AlertCircle className="h-4 w-4 text-[#E74C3C]" /> */}
                                <span className="text-sm text-foreground">
                                  {orderReport.reason || "No reason provided"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                            {/* <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                          </TableCell> */}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Orders />
    </ProtectedRoute>
  );
}
