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
import ConfirmActionDialog from "@/components/modals/ConfirmActionDialog";
import TextPromptDialog from "@/components/modals/TextPromptDialog";

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
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    confirmClassName: "",
    onConfirm: null,
  });
  const [promptDialog, setPromptDialog] = useState({
    open: false,
    title: "",
    description: "",
    value: "",
    placeholder: "",
    submitLabel: "Submit",
    onSubmit: null,
  });
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState({ pending: 0, paid: 0 });

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

  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const data = await apiClient.getAdminTransactions({ page: 1, page_size: 200 });
      setTransactions(data.items || []);
      setTransactionSummary({
        pending: Number(data.pending_payments || 0),
        paid: Number(data.paid_payments || 0),
      });
    } catch (error) {
      notifyError(error.response?.data?.detail || "Failed to fetch transactions");
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const handleReleasePayout = (orderId) => {
    setConfirmDialog({
      open: true,
      title: "Release payout?",
      description: "Are you sure you want to release the payout for this order?",
      confirmLabel: "Release Payout",
      confirmClassName: "",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await apiClient.releasePayout(orderId);
          notifySuccess("Payout released successfully");
          fetchOrders();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        } catch (error) {
          notifyError(error.response?.data?.detail || "Failed to release payout");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleMarkPaidOut = (orderId) => {
    setConfirmDialog({
      open: true,
      title: "Mark order paid out?",
      description: "Mark this order as manually paid out?",
      confirmLabel: "Mark Paid Out",
      confirmClassName: "",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await apiClient.markPaidOut(orderId);
          notifySuccess("Order marked as PAID_OUT");
          fetchOrders();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        } catch (error) {
          notifyError(error.response?.data?.detail || "Failed to mark as paid out");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleApproveRefund = (orderId) => {
    setConfirmDialog({
      open: true,
      title: "Approve refund request?",
      description: "This is record-only. Process the actual refund manually.",
      confirmLabel: "Approve Refund",
      confirmClassName: "bg-green-600 text-white hover:bg-green-700",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await apiClient.approveRefund(orderId);
          notifySuccess("Refund approved");
          fetchOrders();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        } catch (error) {
          notifyError(error.response?.data?.detail || "Failed to approve refund");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRejectRefund = (orderId) => {
    setPromptDialog({
      open: true,
      title: "Reject refund request",
      description: "Add an optional note for the record.",
      value: "",
      placeholder: "Optional note...",
      submitLabel: "Reject Refund",
      onSubmit: async (note) => {
        setActionLoading(true);
        try {
          await apiClient.rejectRefund(orderId, { notes: note || undefined });
          notifySuccess("Refund rejected");
          fetchOrders();
          setPromptDialog((prev) => ({ ...prev, open: false }));
        } catch (error) {
          notifyError(error.response?.data?.detail || "Failed to reject refund");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleMarkRefundPaid = (orderId) => {
    setConfirmDialog({
      open: true,
      title: "Mark refund paid?",
      description: "Record that the refund has been paid to the buyer?",
      confirmLabel: "Mark Refund Paid",
      confirmClassName: "",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await apiClient.markRefundPaid(orderId);
          notifySuccess("Refund marked as paid");
          fetchOrders();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        } catch (error) {
          notifyError(error.response?.data?.detail || "Failed to mark refund as paid");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleAutoConfirmReceipts = () => {
    setConfirmDialog({
      open: true,
      title: "Auto-confirm receipts?",
      description: "Auto-confirm receipts for orders past delivery date (1 day)?",
      confirmLabel: "Run Auto-Confirm",
      confirmClassName: "",
      onConfirm: async () => {
        setActionLoading(true);
        setAutoConfirming(true);
        try {
          const result = await apiClient.autoConfirmReceipts(1);
          notifySuccess(result.message || `Auto-confirmed ${result.count || 0} order(s)`);
          fetchOrders();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        } catch (error) {
          notifyError(error.response?.data?.detail || "Failed to auto-confirm receipts");
        } finally {
          setActionLoading(false);
          setAutoConfirming(false);
        }
      },
    });
  };

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    const formatted = new Intl.NumberFormat('en-SG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
    return `S$${formatted}`;
  };

  const productUrl = (productId) => {
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app";
    // Ensure proper URL construction with /products/ path
    let baseUrl = websiteUrl.endsWith("/") ? websiteUrl.slice(0, -1) : websiteUrl;
    if (!baseUrl.endsWith("/products")) {
      baseUrl = `${baseUrl}/products`;
    }
    return productId ? `${baseUrl}/${productId}` : null;
  };

  const orderDetailFields = (order) => {
    if (!order) return [];
    const productTitle = order.product_details?.title;
    const totalAmount = Number(order.total_amount ?? order.total ?? 0);
    const shippingCost = Number(order.shipping_cost || 0);
    const buyerPlatformFee = Number(order.buyer_platform_fee || 0);
    const sellerPlatformFee = Number(order.seller_platform_fee || order.driptyard_fee || 0);
    const stripeFee = Number(order.stripe_fee || 0);
    const promoDiscount = Number(order.discount_amount || 0);
    const payableAmount = (totalAmount - sellerPlatformFee - stripeFee) + promoDiscount;
    const rows = [
      { label: "Order #", value: order.order_number },
      { label: "Order ID", value: order.id },
      { label: "Product", value: productTitle ? `${productTitle} (ID: ${order.product_details.id})` : String(order.product_details.id) },
      { label: "Date", value: order.created_at ? new Date(order.created_at).toLocaleString() : "—" },
      { label: "Total Amount", value: formatCurrency(totalAmount) },
      { label: "Unit price", value: formatCurrency(order.unit_price) },
      { label: "Quantity", value: order.quantity },
      { label: "Shipping Cost", value: formatCurrency(shippingCost) },
      { label: "Buyer Platform Fee", value: formatCurrency(buyerPlatformFee) },
      { label: "Seller Platform Fee", value: formatCurrency(sellerPlatformFee) },
      { label: "Stripe Fee (Seller)", value: formatCurrency(stripeFee) },
      { label: "Promo Code", value: order.promo_code ?? "—" },
      { label: "Promo Discount", value: formatCurrency(promoDiscount) },
      { label: "Payable Amount", value: formatCurrency(payableAmount) },
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
              onClick={() => {
                setTransactionsOpen(true);
                fetchTransactions();
              }}
            >
              Transactions
            </Button>
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
                        <TableCell>
                          {(() => {
                            const totalAmount = Number(order.total_amount ?? order.total ?? 0);
                            const platformFees = Number(order.seller_platform_fee ?? order.driptyard_fee ?? 0);
                            const stripeFees = Number(order.stripe_fee || 0);
                            const promoDiscount = Number(order.discount_amount || 0);
                            const payableAmount = (totalAmount - platformFees - stripeFees) + promoDiscount;
                            return (
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-semibold text-sm">{formatCurrency(totalAmount)}</span>
                            <span className="text-muted-foreground">
                              Total Amount: {formatCurrency(totalAmount)}
                            </span>
                            <span className="text-muted-foreground">
                              Platform Fees: {formatCurrency(platformFees)}
                            </span>
                            <span className="text-muted-foreground">
                              Stripe Fees: {formatCurrency(stripeFees)}
                            </span>
                            {promoDiscount > 0 && (
                              <span className="text-muted-foreground">
                                Promo Discount{order.promo_code ? ` (${order.promo_code})` : ""}: +{formatCurrency(promoDiscount)}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              Payable Amount: {formatCurrency(payableAmount)}
                            </span>
                          </div>
                            );
                          })()}
                        </TableCell>
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
                      onClick={() => {
                        handleApproveRefund(detailsOrder.id);
                        setDetailsOrder(null);
                      }}
                    >
                      Approve Refund
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        handleRejectRefund(detailsOrder.id);
                        setDetailsOrder(null);
                      }}
                    >
                      Reject Refund
                    </Button>
                  </>
                )}
                {detailsOrder.refund_status === 'APPROVED' && (
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground"
                    onClick={() => {
                      handleMarkRefundPaid(detailsOrder.id);
                      setDetailsOrder(null);
                    }}
                  >
                    Mark Refund Paid
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={transactionsOpen} onOpenChange={setTransactionsOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transactions</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Pending Payments</p>
                  <p className="text-xl font-semibold">{formatCurrency(transactionSummary.pending)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Paid Payments</p>
                  <p className="text-xl font-semibold">{formatCurrency(transactionSummary.paid)}</p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading transactions...</TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{tx.transaction_type}</TableCell>
                        <TableCell>{tx.event_type}</TableCell>
                        <TableCell>{tx.order_number || "—"}</TableCell>
                        <TableCell>{tx.status || "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
        <ConfirmActionDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open && !actionLoading) {
              setConfirmDialog((prev) => ({ ...prev, open: false }));
            }
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          confirmClassName={confirmDialog.confirmClassName}
          onConfirm={confirmDialog.onConfirm}
          isLoading={actionLoading}
        />
        <TextPromptDialog
          open={promptDialog.open}
          onOpenChange={(open) => {
            if (!open && !actionLoading) {
              setPromptDialog((prev) => ({ ...prev, open: false }));
            }
          }}
          title={promptDialog.title}
          description={promptDialog.description}
          value={promptDialog.value}
          placeholder={promptDialog.placeholder}
          submitLabel={promptDialog.submitLabel}
          onChange={promptDialog.onSubmit}
          isLoading={actionLoading}
        />
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
