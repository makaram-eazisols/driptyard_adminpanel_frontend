"use client";

import { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2, CheckCircle, ExternalLink, RefreshCw, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { notifySuccess, notifyError } from "@/lib/toast";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending Payment", value: "PENDING_PAYMENT" },
  { label: "Paid (Escrow)", value: "PAID_ESCROW" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Released", value: "RELEASED" },
  { label: "Paid Out", value: "PAID_OUT" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const SUCCESS_STATUSES = ["completed", "paid", "paid_escrow", "released", "paid_out"];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoConfirming, setAutoConfirming] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminOrders({
        page,
        page_size: 10,
        order_number: search || undefined,
        status: status === "all" ? undefined : status
      });
      setOrders(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      notifyError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleReleasePayout = async (orderId) => {
    if (confirm("Are you sure you want to release the payout for this order?")) {
      try {
        await apiClient.releasePayout(orderId);
        notifySuccess("Payout released successfully");
        fetchOrders();
      } catch (error) {
        notifyError(error.response?.data?.detail || "Failed to release payout");
      }
    }
  };

  const handleMarkPaidOut = async (orderId) => {
    if (confirm("Mark this order as manually paid out?")) {
      try {
        await apiClient.markPaidOut(orderId);
        notifySuccess("Order marked as PAID_OUT");
        fetchOrders();
      } catch (error) {
        notifyError(error.response?.data?.detail || "Failed to mark as paid out");
      }
    }
  };

  const handleApproveRefund = async (orderId) => {
    if (confirm("Approve this refund request? (Record only; process refund manually.)")) {
      try {
        await apiClient.approveRefund(orderId);
        notifySuccess("Refund approved");
        fetchOrders();
        return true;
      } catch (error) {
        notifyError(error.response?.data?.detail || "Failed to approve refund");
      }
    }
    return false;
  };

  const handleRejectRefund = async (orderId) => {
    const note = window.prompt("Reject refund request. Optional note for the record:");
    if (note === null) return false; // user cancelled
    try {
      await apiClient.rejectRefund(orderId, { notes: note || undefined });
      notifySuccess("Refund rejected");
      fetchOrders();
      return true;
    } catch (error) {
      notifyError(error.response?.data?.detail || "Failed to reject refund");
      return false;
    }
  };

  const handleMarkRefundPaid = async (orderId) => {
    if (confirm("Record that the refund has been paid to the buyer?")) {
      try {
        await apiClient.markRefundPaid(orderId);
        notifySuccess("Refund marked as paid");
        fetchOrders();
        return true;
      } catch (error) {
        notifyError(error.response?.data?.detail || "Failed to mark refund as paid");
      }
    }
    return false;
  };

  const handleAutoConfirmReceipts = async () => {
    if (confirm("Auto-confirm receipts for orders past delivery date (1 day)?")) {
      setAutoConfirming(true);
      try {
        const result = await apiClient.autoConfirmReceipts(1);
        notifySuccess(result.message || `Auto-confirmed ${result.count || 0} order(s)`);
        fetchOrders();
      } catch (error) {
        notifyError(error.response?.data?.detail || "Failed to auto-confirm receipts");
      } finally {
        setAutoConfirming(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const productUrl = (productId) => {
    const base = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/products/${productId}`;
  };

  const orderDetailFields = (order) => {
    if (!order) return [];
    const productTitle = order.product_details?.title;
    const rows = [
      { label: "Order #", value: order.order_number },
      { label: "Order ID", value: order.id },
      { label: "Product", value: productTitle ? `${productTitle} (ID: ${order.product_details.id})` : String(order.product_details.id) },
      { label: "Date", value: order.created_at ? new Date(order.created_at).toLocaleString() : "—" },
      { label: "Total", value: formatCurrency(order.total_amount) },
      { label: "Unit price", value: formatCurrency(order.unit_price) },
      { label: "Quantity", value: order.quantity },
      { label: "Status", value: order.status },
      { label: "Payment status", value: order.payment_status ?? "—" },
      { label: "Escrow status", value: order.escrow_status ?? "—" },
      { label: "Payout status", value: order.payout_status ?? "—" },
      { label: "Fulfillment", value: order.fulfillment_method ?? "—" },
      { label: "Meetup location", value: order.meetup_location ?? "—" },
      { label: "Shipping address", value: order.shipping_address ?? "—" },
      { label: "Tracking", value: [order.tracking_number, order.carrier].filter(Boolean).join(" — ") || "—" },
      { label: "Buyer confirmed receipt", value: order.buyer_confirmed_receipt ? "Yes" : "No" },
      { label: "Payout requested", value: order.payout_requested ? "Yes" : "No" },
      { label: "Seller bank details", value: order.seller_bank_details ?? "—" },
      { label: "Refund requested", value: order.refund_requested ? "Yes" : "No" },
      { label: "Refund reason", value: order.refund_reason ?? "—" },
      { label: "Refund status", value: order.refund_status ?? "—" },
      { label: "Refund bank details", value: order.refund_bank_details ?? "—" },
      { label: "Notes", value: order.notes ?? "—" },
      { label: "Buyer notes", value: order.buyer_notes ?? "—" },
      { label: "Seller notes", value: order.seller_notes ?? "—" },
    ];
    return rows;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Orders</h1>
            <p className="text-muted-foreground mt-1">Track and manage customer orders and escrow payouts</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAutoConfirmReceipts}
              disabled={autoConfirming}
            >
              {autoConfirming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Auto-Confirm Receipts
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent/10 border-accent text-accent" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value);
                    setPage(1);
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
            <div className="flex items-center gap-4 mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number..."
                  className="pl-10 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Escrow</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px] font-medium" title={order.product_details?.title}>
                              {order.product_details?.title}
                            </span>
                            <span className="text-xs text-muted-foreground">ID: {order.product_details.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium">{order.fulfillment_method || 'delivery'}</span>
                            {order.meetup_location && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={order.meetup_location}>
                                {order.meetup_location}
                              </span>
                            )}
                            {order.payout_requested && (
                              <span className="text-[10px] text-amber-600">Payout req.</span>
                            )}
                            {order.refund_requested && (
                              <span className="text-[10px] text-destructive">Refund req.</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              SUCCESS_STATUSES.includes((order.status || "").toLowerCase())
                                ? "success"
                                : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.escrow_status === 'RELEASED' ? 'success' : 'secondary'}>
                            {order.escrow_status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={order.payout_status === 'PAID_OUT' ? 'success' : 'outline'}>
                              {order.payout_status}
                            </Badge>
                            {order.payout_requested && order.seller_bank_details && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={order.seller_bank_details}>
                                Bank details provided
                              </span>
                            )}
                            {order.refund_requested && (
                              <span className="text-[10px]" title={order.refund_reason}>
                                Refund: {order.refund_status || 'REQUESTED'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailsOrder(order)}
                              title="View full order details"
                            >
                              <FileText className="" />
                            </Button>
                            {order.status === 'PAID_ESCROW' && order.buyer_confirmed_receipt && (
                              <Button
                                size="sm"
                                onClick={() => handleReleasePayout(order.id)}
                                disabled={loading}
                                className="bg-accent text-accent-foreground"
                              >
                                Release Payout
                              </Button>
                            )}
                            {order.status === 'RELEASED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={loading}
                                onClick={() => handleMarkPaidOut(order.id)}
                              >
                                Mark Paid Out
                              </Button>
                            )}
                            {order.refund_requested && (order.refund_status === 'REQUESTED' || order.refund_status === 'APPROVED') && (
                              <>
                                {order.refund_status === 'REQUESTED' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      disabled={loading}
                                      onClick={() => handleApproveRefund(order.id)}
                                    >
                                      Approve Refund
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive border-destructive hover:bg-destructive/10"
                                      disabled={loading}
                                      onClick={() => handleRejectRefund(order.id)}
                                    >
                                      Reject Refund
                                    </Button>
                                  </>
                                )}
                                {order.refund_status === 'APPROVED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-accent text-accent-foreground"
                                    disabled={loading}
                                    onClick={() => handleMarkRefundPaid(order.id)}
                                  >
                                    Mark Refund Paid
                                  </Button>
                                )}
                              </>
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <a href={productUrl(order.product_details.id)} target="_blank" rel="noreferrer" title="Open product page">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center text-sm px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order details modal */}
        <Dialog open={!!detailsOrder} onOpenChange={(open) => !open && setDetailsOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order details — {detailsOrder?.order_number ?? ""}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              {detailsOrder && orderDetailFields(detailsOrder).map(({ label, value }) => (
                <div key={label} className="flex flex-wrap gap-2 border-b border-border/50 pb-2 last:border-0">
                  <span className="font-medium text-muted-foreground min-w-[140px]">{label}</span>
                  <span className="break-words flex-1">{value}</span>
                </div>
              ))}
            </div>
            {detailsOrder?.refund_requested && (detailsOrder?.refund_status === 'REQUESTED' || detailsOrder?.refund_status === 'APPROVED') && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {detailsOrder.refund_status === 'REQUESTED' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleApproveRefund(detailsOrder.id).then((ok) => ok && setDetailsOrder(null))}
                    >
                      Approve Refund
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => handleRejectRefund(detailsOrder.id).then((ok) => ok && setDetailsOrder(null))}
                    >
                      Reject Refund
                    </Button>
                  </>
                )}
                {detailsOrder.refund_status === 'APPROVED' && (
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground"
                    onClick={() => handleMarkRefundPaid(detailsOrder.id).then((ok) => ok && setDetailsOrder(null))}
                  >
                    Mark Refund Paid
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
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
