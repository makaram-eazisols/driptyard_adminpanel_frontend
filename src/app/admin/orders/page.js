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
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    transaction_type: "all",
    status: "all",
    start_date: "",
    end_date: "",
  });

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
      const data = await apiClient.getAdminTransactions({
        page: 1,
        page_size: 200,
        transaction_type: transactionFilters.transaction_type === "all" ? undefined : transactionFilters.transaction_type,
        status: transactionFilters.status === "all" ? undefined : transactionFilters.status,
        start_date: transactionFilters.start_date || undefined,
        end_date: transactionFilters.end_date || undefined,
      });
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
  }, [transactionFilters]);

  const openInvoice = (tx) => {
    setSelectedTransaction(tx);
    setInvoiceOpen(true);
  };

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

  const handleMarkRefundPaid = (order) => {
    const totalRefundAmount = formatCurrency(order?.total_amount ?? order?.total ?? 0);
    const isCancelledOrder = String(order?.status || "").toUpperCase() === "CANCELLED";
    setConfirmDialog({
      open: true,
      title: "Mark refund paid?",
      description: isCancelledOrder
        ? `This order is cancelled. Refund the full total amount ${totalRefundAmount} to the buyer and confirm once paid.`
        : `Record that the refund amount ${totalRefundAmount} has been paid to the buyer?`,
      confirmLabel: "Mark Refund Paid",
      confirmClassName: "",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await apiClient.markRefundPaid(order.id);
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

  const truncateWithTitle = (value) => {
    const text = String(value || "—");
    if (text.length <= 10) return { short: text, full: text };
    return { short: `${text.slice(0, 10)}...`, full: text };
  };

  const displayType = (value) => {
    if ((value || "").toLowerCase() === "membership") return "Package";
    return value || "—";
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

  const getOrderFinancials = (order) => {
    const totalAmount = Number(order?.total_amount ?? order?.total ?? 0);
    const shippingCost = Number(order?.shipping_cost || 0);
    const buyerPlatformFee = Number(order?.buyer_platform_fee || 0);
    const platformFees = Number(order?.seller_platform_fee ?? order?.driptyard_fee ?? 0);
    const stripeFees = Number(order?.stripe_fee || 0);
    const promoDiscount = Number(order?.discount_amount || 0);
    // Matches checkout: total_amount = unit_price + shipping + buyer_platform_fee - discount_amount
    // => amount attributed to the listing before seller fees:
    const sellerGrossBeforeSellerFees = totalAmount + promoDiscount - shippingCost - buyerPlatformFee;
    // Legacy fallback when seller_payout_amount was never stored (should not subtract buyer-side pieces twice).
    const basePayableFromBuyerTotal = sellerGrossBeforeSellerFees - stripeFees - platformFees;

    const bumpPackageCode = String(order?.spotlight_package_code || "").toLowerCase();
    // Center Stage Special carries a 2% platform commission deducted from seller payout.
    // Spotlight Bump does not carry any commission (legacy "spotlight" records are not charged).
    const isCenterStagePackage = bumpPackageCode === "center_stage";
    const commissionRate = Number(order?.spotlight_commission_rate || 2);
    const commissionAmountApplied = Number(order?.spotlight_commission_amount || 0);
    const commissionEstimated = (totalAmount * commissionRate) / 100;
    const commissionAmount = isCenterStagePackage
      ? (order?.spotlight_commission_applied ? commissionAmountApplied : commissionEstimated)
      : 0;

    const rawStored = order?.seller_payout_amount;
    const storedSellerPayout =
      rawStored != null && rawStored !== "" ? Number(rawStored) : NaN;
    const hasStoredSellerPayout = Number.isFinite(storedSellerPayout);

    // Checkout stores seller_payout_amount as unit price minus seller fees (matches wallet / payout rows).
    // total_amount also includes buyer platform fee and shipping, so total_amount - seller fees is not seller net.
    let basePayableAmount;
    let payableAmountAfterCommission;
    if (hasStoredSellerPayout) {
      if (isCenterStagePackage && order?.spotlight_commission_applied) {
        basePayableAmount = storedSellerPayout + commissionAmountApplied;
      } else {
        basePayableAmount = storedSellerPayout;
      }
      if (isCenterStagePackage && !order?.spotlight_commission_applied) {
        payableAmountAfterCommission = Math.max(0, storedSellerPayout - commissionAmount);
      } else {
        payableAmountAfterCommission = storedSellerPayout;
      }
    } else {
      basePayableAmount = basePayableFromBuyerTotal;
      payableAmountAfterCommission = basePayableFromBuyerTotal - commissionAmount;
    }

    return {
      totalAmount,
      shippingCost,
      buyerPlatformFee,
      sellerGrossBeforeSellerFees,
      platformFees,
      stripeFees,
      promoDiscount,
      basePayableAmount,
      bumpPackageCode,
      isCenterStagePackage,
      commissionRate,
      commissionAmount,
      payableAmountAfterCommission,
    };
  };

  const orderDetailFields = (order) => {
    if (!order) return [];
    const productTitle = order.product_details?.title;
    const {
      totalAmount,
      shippingCost,
      buyerPlatformFee,
      sellerGrossBeforeSellerFees,
      platformFees,
      stripeFees,
      promoDiscount,
      basePayableAmount,
      bumpPackageCode,
      isCenterStagePackage,
      commissionRate,
      commissionAmount,
      payableAmountAfterCommission,
    } = getOrderFinancials(order);
    const rows = [
      { label: "Order #", value: order.order_number },
      { label: "Order ID", value: order.id },
      { label: "Product", value: productTitle ? `${productTitle} (ID: ${order.product_details.id})` : String(order.product_details.id) },
      { label: "Date", value: order.created_at ? new Date(order.created_at).toLocaleString() : "—" },
      { label: "Total Amount (buyer paid)", value: formatCurrency(totalAmount) },
      {
        label: "Seller base before seller fees",
        value: formatCurrency(sellerGrossBeforeSellerFees),
      },
      { label: "Refund amount to pay (cancelled order)", value: String(order.status || "").toUpperCase() === "CANCELLED" ? formatCurrency(totalAmount) : "—" },
      { label: "Unit price", value: formatCurrency(order.unit_price) },
      { label: "Quantity", value: order.quantity },
      { label: "Shipping Cost", value: formatCurrency(shippingCost) },
      { label: "Buyer Platform Fee", value: formatCurrency(buyerPlatformFee) },
      { label: "Seller Platform Fee", value: formatCurrency(platformFees) },
      { label: "Stripe Fee (Seller)", value: formatCurrency(stripeFees) },
      { label: "Promo Code", value: order.promo_code ?? "—" },
      { label: "Promo Discount", value: formatCurrency(promoDiscount) },
      { label: "Payable Amount (before commission)", value: formatCurrency(basePayableAmount) },
      { label: "Bump package", value: order.spotlight_package_code ?? "—" },
      { label: "Center Stage commission rate", value: isCenterStagePackage ? `${commissionRate}%` : "—" },
      { label: "Center Stage commission amount", value: isCenterStagePackage ? formatCurrency(commissionAmount) : "—" },
      { label: "Center Stage commission applied", value: isCenterStagePackage ? (order.spotlight_commission_applied ? "Yes" : "No") : "—" },
      { label: "Payable Amount (after commission)", value: formatCurrency(payableAmountAfterCommission) },
      { label: "Status", value: order.status },
      { label: "Payment status", value: order.payment_status ?? "—" },
      { label: "Escrow status", value: order.escrow_status ?? "—" },
      {
        label: "Payout status",
        value: (() => {
          const raw = order.payout_status ?? "—";
          if (order.refund_status === "PAID" || raw === "REFUND_PAID") return "PAID (refund)";
          return raw;
        })(),
      },
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
                            const {
                              totalAmount,
                              shippingCost,
                              buyerPlatformFee,
                              sellerGrossBeforeSellerFees,
                              platformFees,
                              stripeFees,
                              promoDiscount,
                              isCenterStagePackage,
                              commissionRate,
                              commissionAmount,
                              payableAmountAfterCommission,
                            } = getOrderFinancials(order);
                            const isCancelledOrder = String(order?.status || "").toUpperCase() === "CANCELLED";
                            return (
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-semibold text-sm">
                              {isCancelledOrder ? formatCurrency(totalAmount) : formatCurrency(payableAmountAfterCommission)}
                            </span>
                            {isCancelledOrder && (
                              <span className="text-destructive">
                                Cancelled order refund amount: {formatCurrency(totalAmount)}
                              </span>
                            )}
                            {!isCancelledOrder && (
                              <>
                                <span className="text-muted-foreground border-t border-border/60 pt-0.5 mt-0.5">
                                  Buyer paid (total): {formatCurrency(totalAmount)}
                                </span>
                                {shippingCost > 0 && (
                                  <span className="text-muted-foreground">
                                    Shipping (in buyer total): {formatCurrency(shippingCost)}
                                  </span>
                                )}
                                {buyerPlatformFee > 0 && (
                                  <span className="text-muted-foreground">
                                    Buyer platform fee (in buyer total): {formatCurrency(buyerPlatformFee)}
                                  </span>
                                )}
                                {promoDiscount > 0 && (
                                  <span className="text-muted-foreground">
                                    Promo discount (buyer checkout){order.promo_code ? ` (${order.promo_code})` : ""}: {formatCurrency(promoDiscount)}
                                  </span>
                                )}
                                <span className="text-muted-foreground border-t border-border/60 pt-0.5 mt-0.5">
                                  Seller base (before seller fees): {formatCurrency(sellerGrossBeforeSellerFees)}
                                </span>
                                <span className="text-muted-foreground">
                                  Seller platform fee: {formatCurrency(platformFees)}
                                </span>
                                <span className="text-muted-foreground">
                                  Stripe fee (seller): {formatCurrency(stripeFees)}
                                </span>
                                {isCenterStagePackage && (
                                  <span className="text-muted-foreground">
                                    Center Stage commission ({commissionRate}%): −{formatCurrency(commissionAmount)}
                                  </span>
                                )}
                                <span className="text-muted-foreground font-medium">
                                  Payable to seller: {formatCurrency(payableAmountAfterCommission)}
                                </span>
                              </>
                            )}
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
                            {(() => {
                              const { isCenterStagePackage, commissionAmount } = getOrderFinancials(order);
                              if (!isCenterStagePackage) return null;
                              return (
                                <span className="text-[10px] text-amber-600">
                                  Center Stage commission: {formatCurrency(commissionAmount)} ({order.spotlight_commission_applied ? "applied" : "pending"})
                                </span>
                              );
                            })()}
                            {(() => {
                              const refundPaid =
                                order.refund_status === "PAID" || order.payout_status === "REFUND_PAID";
                              const sellerPaidOut = order.payout_status === "PAID_OUT";
                              const label = refundPaid ? "PAID" : order.payout_status;
                              const variant = refundPaid || sellerPaidOut ? "success" : "outline";
                              return (
                                <Badge variant={variant}>{label}</Badge>
                              );
                            })()}
                            {order.payout_requested && order.seller_bank_details && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={order.seller_bank_details}>
                                Bank details provided
                              </span>
                            )}
                            {order.refund_requested && order.refund_status !== "PAID" && (
                              <span className="text-[10px]" title={order.refund_reason}>
                                Refund: {order.refund_status || "REQUESTED"}
                              </span>
                            )}
                            {order.refund_requested && order.refund_status === "PAID" && (
                              <span className="text-[10px] text-muted-foreground">Refund completed</span>
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
                            {order.payout_requested &&
                              order.buyer_confirmed_receipt &&
                              order.escrow_status !== 'RELEASED' &&
                              order.payout_status !== 'PAID_OUT' &&
                              order.refund_status !== 'PAID' &&
                              order.payout_status !== 'REFUND_PAID' && (
                              <Button
                                size="sm"
                                onClick={() => handleReleasePayout(order.id)}
                                disabled={loading}
                                className="bg-accent text-accent-foreground"
                              >
                                Release Payout
                              </Button>
                            )}
                            {order.escrow_status === 'RELEASED' &&
                              order.payout_status !== 'PAID_OUT' &&
                              order.refund_status !== 'PAID' &&
                              order.payout_status !== 'REFUND_PAID' && (
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
                                    onClick={() => handleMarkRefundPaid(order)}
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
                      handleMarkRefundPaid(detailsOrder);
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
          <DialogContent className="max-w-7xl w-[96vw] max-h-[90vh] overflow-hidden">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-tx-type">Type</Label>
                  <Select
                    value={transactionFilters.transaction_type}
                    onValueChange={(value) => setTransactionFilters((prev) => ({ ...prev, transaction_type: value }))}
                  >
                    <SelectTrigger id="admin-tx-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="membership">Package</SelectItem>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="payout">Payout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-tx-status">Status</Label>
                  <Select
                    value={transactionFilters.status}
                    onValueChange={(value) => setTransactionFilters((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="admin-tx-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-tx-start-date">Start Date</Label>
                  <Input
                    id="admin-tx-start-date"
                    type="date"
                    value={transactionFilters.start_date}
                    onChange={(e) => setTransactionFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-tx-end-date">End Date</Label>
                  <Input
                    id="admin-tx-end-date"
                    type="date"
                    value={transactionFilters.end_date}
                    onChange={(e) => setTransactionFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={transactionsLoading}>
                  Apply Filters
                </Button>
              </div>
              <div>
              <Table className="table-fixed w-full">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[9%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              </div>
              <div className={transactions.length > 6 ? "max-h-[312px] overflow-y-auto" : ""}>
              <Table className="table-fixed w-full">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[9%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <TableBody>
                  {transactionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading transactions...</TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.id}</TableCell>
                        <TableCell title={truncateWithTitle(tx.user_name || tx.buyer_name || tx.seller_name || "—").full}>
                          {truncateWithTitle(tx.user_name || tx.buyer_name || tx.seller_name || "—").short}
                        </TableCell>
                        <TableCell title={truncateWithTitle(tx.user_email || tx.buyer_email || tx.seller_email || "—").full}>
                          {truncateWithTitle(tx.user_email || tx.buyer_email || tx.seller_email || "—").short}
                        </TableCell>
                        <TableCell className="capitalize">{displayType(tx.transaction_type)}</TableCell>
                        <TableCell title={truncateWithTitle(tx.item_name || tx.order_number || "—").full}>
                          {truncateWithTitle(tx.item_name || tx.order_number || "—").short}
                        </TableCell>
                        <TableCell>{new Date(tx.payment_date || tx.created_at).toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{tx.status || "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openInvoice(tx)}>Invoice</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Invoice</DialogTitle>
            </DialogHeader>
            {selectedTransaction ? (
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Transaction ID:</span> {selectedTransaction.id}</div>
                <div><span className="font-medium">User:</span> {selectedTransaction.user_name || selectedTransaction.buyer_name || selectedTransaction.seller_name || "—"}</div>
                <div><span className="font-medium">Email:</span> {selectedTransaction.user_email || selectedTransaction.buyer_email || selectedTransaction.seller_email || "—"}</div>
                <div><span className="font-medium">Type:</span> {selectedTransaction.transaction_type}</div>
                <div><span className="font-medium">Item:</span> {selectedTransaction.item_name || selectedTransaction.order_number || "—"}</div>
                <div><span className="font-medium">Amount:</span> {formatCurrency(selectedTransaction.amount)}</div>
                <div><span className="font-medium">Payment Date:</span> {new Date(selectedTransaction.payment_date || selectedTransaction.created_at).toLocaleString()}</div>
                <div><span className="font-medium">Status:</span> {selectedTransaction.status || "—"}</div>
                <div><span className="font-medium">Order #:</span> {selectedTransaction.order_number || "—"}</div>
                <div><span className="font-medium">Reference:</span> {selectedTransaction.payment_intent_id || selectedTransaction.stripe_session_id || "—"}</div>
              </div>
            ) : null}
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
