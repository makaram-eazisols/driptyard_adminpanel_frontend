"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, MoreVertical, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight, Star, X, Filter, ExternalLink, Eye } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CONDITIONS = [
  { value: "New", label: "New" },
  { value: "Like New", label: "Like New" },
  { value: "Used", label: "Used" },
  { value: "Heavily Used", label: "Heavily Used" },
];

const STOCK_STATUSES = [
  { value: "In Stock", label: "In Stock" },
  { value: "Out of Stock", label: "Out of Stock" },
  { value: "Limited", label: "Limited" },
];

function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [verification, setVerification] = useState("all");
  const [spotlighted, setSpotlighted] = useState("all");
  const [sortOrder, setSortOrder] = useState("none");
  const [sellerId, setSellerId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [sellersError, setSellersError] = useState("");
  const [sellerComboboxOpen, setSellerComboboxOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [spotlightProduct, setSpotlightProduct] = useState(null);
  const [spotlightLoading, setSpotlightLoading] = useState(false);
  const [spotlightDuration, setSpotlightDuration] = useState("24");
  const [customDate, setCustomDate] = useState(null);
  const [existingSpotlight, setExistingSpotlight] = useState(null);
  const [fetchingSpotlight, setFetchingSpotlight] = useState(false);
  const [removingSpotlight, setRemovingSpotlight] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkVerificationDialog, setBulkVerificationDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("active");
  const [bulkVerificationValue, setBulkVerificationValue] = useState("verified");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkSpotlightDialog, setBulkSpotlightDialog] = useState(false);
  const [bulkSpotlightDuration, setBulkSpotlightDuration] = useState("24");
  const [bulkSpotlightCustomDate, setBulkSpotlightCustomDate] = useState(null);
  const [bulkEditSpotlightDialog, setBulkEditSpotlightDialog] = useState(false);
  const [bulkEditSpotlightDuration, setBulkEditSpotlightDuration] = useState("24");
  const [bulkEditSpotlightCustomDate, setBulkEditSpotlightCustomDate] = useState(null);
  const [bulkRemoveSpotlightDialog, setBulkRemoveSpotlightDialog] = useState(false);

  // Check spotlight permissions
  const canSpotlight = user?.is_admin || user?.permissions?.can_spotlight === true;
  const canRemoveSpotlight = user?.is_admin || user?.permissions?.can_remove_spotlight === true;

  // Check manage listings permission
  const canManageListings = user?.is_admin || user?.permissions?.can_manage_listings === true;

  const fetchSellers = async () => {
    try {
      setSellersLoading(true);
      setSellersError("");
      const data = await apiClient.getAdminUsers({
        is_seller: true,
        page_size: 100,
      });
      const users = data.users || [];
      const normalized = users
        .map((seller) => ({
          id: seller.id ?? seller.user_id,
          username: seller.username || "",
        }))
        .filter((seller) => seller.id);
      setSellers(normalized);
    } catch (error) {
      setSellers([]);
      setSellersError(error.response?.data?.detail || "Failed to load sellers");
    } finally {
      setSellersLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: 10,
        search: searchQuery || undefined,
      };

      if (status && status !== "all") {
        if (status === "active") {
          params.is_active = true;
        } else if (status === "inactive") {
          params.is_active = false;
        }
      }

      if (verification && verification !== "all") {
        if (verification === "verified") {
          params.is_verified = true;
        } else if (verification === "unverified") {
          params.is_verified = false;
        }
      }

      if (spotlighted && spotlighted !== "all") {
        if (spotlighted === "spotlighted") {
          params.is_spotlighted = true;
        } else if (spotlighted === "not-spotlighted") {
          params.is_spotlighted = false;
        }
      }

      if (sortOrder && sortOrder !== "none") {
        params.sort_by = sortOrder === "low-to-high" ? "low_to_high" : "high_to_low";
      } else {
        params.sort_by = null;
      }

      if (sellerId && sellerId !== "all") {
        params.user_id = sellerId;
      }

      const data = await apiClient.getAdminProducts(params);
      let items = data.products || [];

      setProducts(items);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || items.length || 0);
      setPageSize(data.page_size || 10);
    } catch (error) {
      notifyError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatus("all");
    setVerification("all");
    setSpotlighted("all");
    setSortOrder("none");
    setSellerId("all");
    setPage(1);
  };

  const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const VERIFICATION_OPTIONS = [
    { value: "all", label: "All Verification" },
    { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" },
  ];

  const SPOTLIGHTED_OPTIONS = [
    { value: "all", label: "All Spotlight" },
    { value: "spotlighted", label: "Spotlighted" },
    { value: "not-spotlighted", label: "Not Spotlighted" },
  ];

  const SORT_OPTIONS = [
    { value: "none", label: "No Sort" },
    { value: "low-to-high", label: "Price: Low to High" },
    { value: "high-to-low", label: "Price: High to Low" },
  ];

  const hasActiveFilters = searchQuery || (status && status !== "all") || (verification && verification !== "all") || (spotlighted && spotlighted !== "all") || (sortOrder && sortOrder !== "none") || (sellerId && sellerId !== "all");

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, status, verification, spotlighted, sortOrder, sellerId]);

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (spotlightProduct) {
      fetchSpotlightData(spotlightProduct.id);
    } else {
      setExistingSpotlight(null);
    }
  }, [spotlightProduct]);

  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      await apiClient.deleteAdminProduct(deleteProductId);
      notifySuccess("Product deleted successfully");
      setDeleteProductId(null);
      fetchProducts();
    } catch (error) {
      notifyError("Failed to delete product");
    }
  };

  const handleUpdate = async () => {
    if (!editProduct) return;

    try {
      setEditLoading(true);
      await apiClient.updateAdminProduct(editProduct.id, {
        title: editProduct.title,
        description: editProduct.description || null,
        price: Number(editProduct.price) || 0,
        condition: editProduct.condition,
        deal_method: editProduct.deal_method || null,
        meetup_date: editProduct.meetup_date || null,
        meetup_time: editProduct.meetup_time || null,
        meetup_location: editProduct.meetup_location || null,
        stock_quantity: Number(editProduct.stock_quantity ?? 0),
        stock_status: editProduct.stock_status,
        is_active: editProduct.is_active,
        is_sold: !!editProduct.is_sold,
        is_verified: editProduct.is_verified,
        purchase_button_enabled: !!editProduct.purchase_button_enabled,
        delivery_method: editProduct.delivery_method || null,
        delivery_time: editProduct.delivery_time || null,
        delivery_fee: editProduct.delivery_fee === "" || editProduct.delivery_fee == null
          ? null
          : Number(editProduct.delivery_fee),
        delivery_fee_type: editProduct.delivery_fee_type || null,
        tracking_provided: !!editProduct.tracking_provided,
        shipping_address: editProduct.shipping_address || null,
        size: editProduct.size || null,
        product_style: editProduct.product_style || null,
        return_policy: editProduct.return_policy || null,
        warranty_info: editProduct.warranty_info || null,
        packaging_info: editProduct.packaging_info || null,
      });
      notifySuccess("Product updated successfully");
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      notifyError("Failed to update product");
    } finally {
      setEditLoading(false);
    }
  };

  const handleQuickDisable = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      await apiClient.updateAdminProduct(productId, {
        title: product.title,
        price: Number(product.price) || 0,
        condition: product.condition,
        is_active: false,
        is_verified: product.is_verified,
      });
      notifySuccess("Product disabled successfully");
      fetchProducts();
    } catch (error) {
      notifyError("Failed to disable product");
    }
  };

  const fetchSpotlightData = async (productId) => {
    try {
      setFetchingSpotlight(true);
      const data = await apiClient.getProductSpotlight(productId);
      // Check if spotlight exists and is active
      if (data.is_spotlighted && data.spotlight) {
        setExistingSpotlight(data);
      } else {
        setExistingSpotlight(null);
      }
    } catch (error) {
      // If 404 or no spotlight, set to null
      if (error.response?.status === 404) {
        setExistingSpotlight(null);
      } else {
        // Only show error if it's not a 404
        console.error("Failed to fetch spotlight data:", error);
        setExistingSpotlight(null);
      }
    } finally {
      setFetchingSpotlight(false);
    }
  };

  const handleRemoveSpotlight = async () => {
    if (!spotlightProduct) return;

    try {
      setRemovingSpotlight(true);
      await apiClient.removeProductSpotlight(spotlightProduct.id);
      notifySuccess("Spotlight removed successfully");
      setExistingSpotlight(null);
      setSpotlightProduct(null);
      fetchProducts();
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to remove spotlight");
    } finally {
      setRemovingSpotlight(false);
    }
  };

  const handleApplySpotlight = async () => {
    if (!spotlightProduct) return;

    try {
      setSpotlightLoading(true);
      let requestData = {};

      if (spotlightDuration === "custom" && customDate) {
        const now = new Date();
        const selectedDate = new Date(customDate);
        if (selectedDate > now) {
          // Use custom_end_time when custom date is selected
          requestData.custom_end_time = selectedDate.toISOString();
        } else {
          notifyError("Custom date must be in the future");
          return;
        }
      } else {
        // Use duration_hours for predefined durations
        requestData.duration_hours = parseInt(spotlightDuration);
      }

      await apiClient.addProductToSpotlight(spotlightProduct.id, requestData);
      notifySuccess("Product added to spotlight successfully");
      setExistingSpotlight(null);
      setSpotlightProduct(null);
      setSpotlightDuration("24");
      setCustomDate(null);
      fetchProducts();
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to add product to spotlight");
    } finally {
      setSpotlightLoading(false);
    }
  };

  const getStatusBadgeVariant = (product) => {
    return product.is_active ? "success" : "destructive";
  };

  const getStatusText = (product) => {
    return product.is_active ? "Active" : "Inactive";
  };

  useEffect(() => {
    fetchProducts();
    // Clear selection when filters change
    setSelectedProducts(new Set());
  }, [page, searchQuery, status, verification, spotlighted, sortOrder, sellerId]);

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      // Only allow selecting products whose owners are not suspended
      const selectableIds = products.filter((p) => !p.is_suspended).map((p) => p.id);
      setSelectedProducts(new Set(selectableIds));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId, checked) => {
    const product = products.find((p) => p.id === productId);
    // Do not allow selecting products whose owners are suspended
    if (product?.is_suspended) return;

    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectableProducts = products.filter((p) => !p.is_suspended);
  const selectableSelectedCount = selectableProducts.filter((p) => selectedProducts.has(p.id)).length;
  const isAllSelected = selectableProducts.length > 0 && selectableSelectedCount === selectableProducts.length;
  const isIndeterminate =
    selectableSelectedCount > 0 && selectableSelectedCount < selectableProducts.length;

  // Check if all selected products are verified
  const areAllSelectedVerified = () => {
    if (selectedProducts.size === 0) return false;
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    return selectedProductsList.length > 0 && selectedProductsList.every(p => p.is_verified);
  };

  // Check if all selected products are unverified
  const areAllSelectedUnverified = () => {
    if (selectedProducts.size === 0) return false;
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    return selectedProductsList.length > 0 && selectedProductsList.every(p => !p.is_verified);
  };

  // Check if all selected products are active
  const areAllSelectedActive = () => {
    if (selectedProducts.size === 0) return false;
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    return selectedProductsList.length > 0 && selectedProductsList.every(p => p.is_active);
  };

  // Check if all selected products are inactive
  const areAllSelectedInactive = () => {
    if (selectedProducts.size === 0) return false;
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    return selectedProductsList.length > 0 && selectedProductsList.every(p => !p.is_active);
  };

  // Check if all selected products are spotlighted
  const areAllSelectedSpotlighted = () => {
    if (selectedProducts.size === 0) return false;
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    return selectedProductsList.length > 0 && selectedProductsList.every(p => p.is_spotlighted);
  };

  // Check if any selected products are not spotlighted
  const areAnySelectedNotSpotlighted = () => {
    if (selectedProducts.size === 0) return false;
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    return selectedProductsList.length > 0 && selectedProductsList.some(p => !p.is_spotlighted);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const productIds = Array.from(selectedProducts).map(id => parseInt(id, 10));
      const response = await apiClient.bulkDeleteProducts(productIds);
      notifySuccess(response.message || `${selectedProducts.size} product(s) deleted successfully`);
      setSelectedProducts(new Set());
      setBulkDeleteDialog(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete products:", error);
      notifyError(error.response?.data?.detail || "Failed to delete products");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedProducts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const productIds = Array.from(selectedProducts).map(id => parseInt(id, 10));
      const isActive = bulkStatusValue === "active";
      const response = await apiClient.bulkUpdateProductStatus(productIds, isActive);
      notifySuccess(response.message || `${selectedProducts.size} product(s) status updated successfully`);
      setSelectedProducts(new Set());
      setBulkStatusDialog(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to update product status:", error);
      notifyError(error.response?.data?.detail || "Failed to update product status");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkVerificationChange = async () => {
    if (selectedProducts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const productIds = Array.from(selectedProducts).map(id => parseInt(id, 10));
      const isVerified = bulkVerificationValue === "verified";
      const response = await apiClient.bulkUpdateProductVerification(productIds, isVerified);
      notifySuccess(response.message || `${selectedProducts.size} product(s) verification updated successfully`);
      setSelectedProducts(new Set());
      setBulkVerificationDialog(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to update product verification:", error);
      notifyError(error.response?.data?.detail || "Failed to update product verification");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSpotlight = async () => {
    if (selectedProducts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const productIds = Array.from(selectedProducts).map(id => parseInt(id, 10));
      let requestData = {};

      if (bulkSpotlightDuration === "custom" && bulkSpotlightCustomDate) {
        const now = new Date();
        const selectedDate = new Date(bulkSpotlightCustomDate);
        if (selectedDate > now) {
          requestData.custom_end_time = selectedDate.toISOString();
        } else {
          notifyError("Custom date must be in the future");
          setBulkActionLoading(false);
          return;
        }
      } else {
        requestData.duration_hours = parseInt(bulkSpotlightDuration);
      }

      const response = await apiClient.bulkAddProductsToSpotlight(productIds, requestData);
      notifySuccess(response.message || `${selectedProducts.size} product(s) added to spotlight successfully`);
      setSelectedProducts(new Set());
      setBulkSpotlightDialog(false);
      setBulkSpotlightDuration("24");
      setBulkSpotlightCustomDate(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to add products to spotlight:", error);
      notifyError(error.response?.data?.detail || "Failed to add products to spotlight");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkEditSpotlight = async () => {
    if (selectedProducts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const productIds = Array.from(selectedProducts).map(id => parseInt(id, 10));
      let requestData = {};

      if (bulkEditSpotlightDuration === "custom" && bulkEditSpotlightCustomDate) {
        const now = new Date();
        const selectedDate = new Date(bulkEditSpotlightCustomDate);
        if (selectedDate > now) {
          requestData.custom_end_time = selectedDate.toISOString();
        } else {
          notifyError("Custom date must be in the future");
          setBulkActionLoading(false);
          return;
        }
      } else {
        requestData.duration_hours = parseInt(bulkEditSpotlightDuration);
      }

      const response = await apiClient.bulkEditProductsSpotlight(productIds, requestData);
      notifySuccess(response.message || `${selectedProducts.size} spotlight(s) updated successfully`);
      setSelectedProducts(new Set());
      setBulkEditSpotlightDialog(false);
      setBulkEditSpotlightDuration("24");
      setBulkEditSpotlightCustomDate(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to edit spotlights:", error);
      notifyError(error.response?.data?.detail || "Failed to edit spotlights");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRemoveSpotlight = async () => {
    if (selectedProducts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const productIds = Array.from(selectedProducts).map(id => parseInt(id, 10));
      const response = await apiClient.bulkRemoveProductsSpotlight(productIds);
      notifySuccess(response.message || `${selectedProducts.size} spotlight(s) removed successfully`);
      setSelectedProducts(new Set());
      setBulkRemoveSpotlightDialog(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to remove spotlights:", error);
      notifyError(error.response?.data?.detail || "Failed to remove spotlights");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getPrimaryImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (Array.isArray(product.product_images) && product.product_images.length > 0) {
      return product.product_images[0];
    }
    if (Array.isArray(product.media) && product.media.length > 0) {
      const mediaItem = product.media[0];
      return typeof mediaItem === "string" ? mediaItem : mediaItem?.url;
    }
    if (typeof product.image === "string") {
      return product.image;
    }
    return null;
  };

  const getSellerName = (product) => {
    if (product.seller_name) return product.seller_name;
    if (product.owner?.name) return product.owner.name;
    if (product.owner?.username) return product.owner.username;
    if (product.owner?.email) return product.owner.email;
    if (product.owner_name) return product.owner_name;
    if (product.owner_email) return product.owner_email;
    if (product.owner_username) return product.owner_username;
    if (product.owner_id) return `User #${product.owner_id}`;
    return "Unknown seller";
  };

  const getAuthBadge = (product) => {
    if (product.is_verified) {
      return { label: "Verified", variant: "success" };
    }
    return { label: "Unverified", variant: "destructive" };
  };

  const formatPrice = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return "—";
    return `S$${numeric.toFixed(2)}`;
  };

  const getSelectedSellerDisplay = () => {
    if (sellerId === "all") return "All Sellers";
    const selectedSeller = sellers.find((s) => String(s.id) === sellerId);
    if (selectedSeller) {
      return selectedSeller.username ? `@${selectedSeller.username}` : `User #${selectedSeller.id}`;
    }
    return "Select seller";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Listings Management</h1>
            <p className="text-muted-foreground mt-1">Manage your listings inventory</p>
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
                    {[searchQuery, status && status !== "all" ? status : null, verification && verification !== "all" ? verification : null, spotlighted && spotlighted !== "all" ? spotlighted : null, sortOrder && sortOrder !== "none" ? sortOrder : null, sellerId && sellerId !== "all" ? sellerId : null].filter(Boolean).length}
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
              <div className="space-y-2 w-full md:w-auto md:min-w-[250px]">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2 w-full md:w-auto md:min-w-[220px]">
                <Label htmlFor="seller">Seller</Label>
                <Popover open={sellerComboboxOpen} onOpenChange={setSellerComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sellerComboboxOpen}
                      className="w-full justify-between bg-background hover:bg-background border-border text-foreground hover:text-foreground"
                      disabled={sellersLoading}
                      id="seller"
                    >
                      {sellersLoading ? (
                        <span className="text-muted-foreground">Loading...</span>
                      ) : (
                        <span className="truncate">{getSelectedSellerDisplay()}</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search sellers..." />
                      <CommandList>
                        <CommandEmpty>No sellers found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            className="data-[selected=true]:bg-[#E0B74F] data-[selected=true]:text-[#0B0B0D] hover:text-[#0B0B0D]"
                            onSelect={() => {
                              setSellerId("all");
                              setSellerComboboxOpen(false);
                              setPage(1);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${sellerId === "all" ? "opacity-100" : "opacity-0"} `}
                            />
                            All Sellers
                          </CommandItem>
                          {sellers.map((seller) => {
                            const sellerValue = String(seller.id);
                            const isSelected = sellerId === sellerValue;
                            const displayText = seller.username ? `@${seller.username}` : `User #${seller.id}`;
                            // Include username in value for searchability
                            const searchableValue = seller.username 
                              ? `${sellerValue} ${seller.username} @${seller.username}` 
                              : `${sellerValue} User #${seller.id}`;
                            return (
                              <CommandItem
                                key={seller.id}
                                value={searchableValue}
                                className="data-[selected=true]:bg-[#E0B74F] data-[selected=true]:text-[#0B0B0D] hover:text-[#0B0B0D]"
                                onSelect={() => {
                                  setSellerId(sellerValue);
                                  setSellerComboboxOpen(false);
                                  setPage(1);
                                }}
                              >
                                <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                {displayText}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {sellersError && (
                  <p className="text-xs text-muted-foreground">Unable to load sellers</p>
                )}
              </div>
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
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
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                <Label htmlFor="verification">Verification</Label>
                <Select value={verification} onValueChange={(value) => {
                  setVerification(value);
                  setPage(1);
                }}>
                  <SelectTrigger id="verification">
                    <SelectValue placeholder="Select verification" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                <Label htmlFor="spotlighted">Spotlight</Label>
                <Select value={spotlighted} onValueChange={(value) => {
                  setSpotlighted(value);
                  setPage(1);
                }}>
                  <SelectTrigger id="spotlighted">
                    <SelectValue placeholder="Select spotlight status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPOTLIGHTED_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                <Label htmlFor="sort">Sort by Price</Label>
                <Select value={sortOrder} onValueChange={(value) => {
                  setSortOrder(value);
                  setPage(1);
                }}>
                  <SelectTrigger id="sort">
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
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
        {/* <div className="rounded-2xl border border-border bg-background shadow-sm"> */}
        <div >
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <>
              {/* Bulk Action Toolbar */}
              {(canManageListings || canSpotlight) && selectedProducts.size > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      {selectedProducts.size} product(s) selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageListings && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBulkStatusDialog(true)}
                          disabled={bulkActionLoading}
                        >
                          Change Status
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBulkVerificationDialog(true)}
                          disabled={bulkActionLoading}
                        >
                          Change Verification
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setBulkDeleteDialog(true)}
                          disabled={bulkActionLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                    {canSpotlight && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBulkSpotlightDialog(true)}
                          disabled={bulkActionLoading || areAllSelectedSpotlighted()}
                          className="border-[#E0B74F] text-[#E0B74F] hover:bg-[#E0B74F] hover:text-white"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Add Spotlight
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBulkEditSpotlightDialog(true)}
                          disabled={bulkActionLoading || areAnySelectedNotSpotlighted()}
                          className="border-[#E0B74F] text-[#E0B74F] hover:bg-[#E0B74F] hover:text-white"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Spotlight
                        </Button>
                      </>
                    )}
                    {canRemoveSpotlight && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkRemoveSpotlightDialog(true)}
                        disabled={bulkActionLoading || areAnySelectedNotSpotlighted()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Spotlight
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProducts(new Set())}
                      disabled={bulkActionLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {(canManageListings || canSpotlight) && (
                        <TableHead className="h-12 px-4 w-12">
                          <Checkbox
                            checked={isAllSelected}
                            // indeterminate state for partial selection
                            // @ts-ignore - shadcn Checkbox supports this prop
                            indeterminate={isIndeterminate}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Thumbnail</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[250px]">Title</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[150px]">Seller</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Price</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[120px]">Status</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[120px]">Verification</TableHead>
                      {(canManageListings || canSpotlight) && (
                        <TableHead className="h-12 px-4 text-right font-semibold text-secondary max-w-[100px]">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const image = getPrimaryImage(product);
                      const authBadge = getAuthBadge(product);
                      const productId = product.id;
                      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app";
                      // Ensure proper URL construction with /products/ path
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

                      return (
                        <TableRow
                          key={product.id}
                          className={`hover:bg-muted/30 transition-colors ${productUrl ? "cursor-pointer" : ""}`}
                          onDoubleClick={productUrl ? handleRowClick : undefined}
                        >
                          {(canManageListings || canSpotlight) && (
                            <TableCell className="py-3 px-4">
                              {product.is_suspended ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Checkbox
                                          checked={selectedProducts.has(product.id)}
                                          disabled
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">User is suspended. Actions are disabled.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <Checkbox
                                  checked={selectedProducts.has(product.id)}
                                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked)}
                                />
                              )}
                            </TableCell>
                          )}
                          <TableCell className="py-3 px-4 max-w-[100px]">
                            <div className="h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted/50 shadow-sm">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                                  No Image
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 max-w-[250px]">
                            <a href={productUrl} target="_blank" className="font-semibold text-sm text-primary leading-tight break-words">{product.title || "Untitled listing"}</a>
                          </TableCell>
                          <TableCell className="py-3 px-4 max-w-[150px]">
                            <p className="text-sm text-foreground truncate">{product?.owner_name}</p>
                          </TableCell>
                          <TableCell className="py-3 px-4 max-w-[100px]">
                            <p className="font-semibold text-sm text-primary">{formatPrice(product.price)}</p>
                          </TableCell>
                          <TableCell className="py-3 px-4 max-w-[120px]">
                            <Badge variant={getStatusBadgeVariant(product)} className="text-[10px] px-2 py-0.5 font-medium">{getStatusText(product)}</Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4 max-w-[120px]">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={authBadge.variant} className="text-[10px] px-2 py-1 font-medium whitespace-nowrap">
                                {authBadge.label}
                              </Badge>
                              {product.is_spotlighted && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-1 border-[#E0B74F]/30 text-[#E0B74F] bg-[#E0B74F]/5 flex items-center justify-center font-semibold min-w-[28px]"
                                  title="Spotlighted"
                                >
                                  <Star className="h-3 w-3 fill-[#E0B74F]" />
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          {(canManageListings || canSpotlight) && (
                            <TableCell className="py-3 px-4 text-right max-w-[100px]">
                              {(canManageListings || (product.is_verified && canSpotlight)) && (
                                product.is_suspended ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 cursor-not-allowed opacity-60"
                                            disabled
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Seller is suspended. Actions are disabled.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => {
                                          const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app";
                                          let baseUrl = websiteUrl.endsWith('/') ? websiteUrl.slice(0, -1) : websiteUrl;
                                          if (!baseUrl.endsWith('/products')) {
                                            baseUrl = `${baseUrl}/products`;
                                          }
                                          const productUrl = product.id ? `${baseUrl}/${product.id}` : null;
                                          if (productUrl) {
                                            window.open(productUrl, "_blank");
                                          }
                                        }}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      {product.is_verified && product.is_active && !product.is_spotlighted && canSpotlight && (
                                        <DropdownMenuItem
                                          className="cursor-pointer group flex items-center gap-2 hover:bg-[#E0B74F] hover:text-[#0B0B0D] focus:bg-[#E0B74F] focus:text-[#0B0B0D] transition-colors"
                                          onClick={() => setSpotlightProduct(product)}
                                        >
                                          <Star className="h-4 w-4 text-accent transition-colors group-hover:text-[#0B0B0D] group-focus:text-[#0B0B0D]" />
                                          Spotlight
                                        </DropdownMenuItem>
                                      )}
                                      {canManageListings && (
                                        <>
                                          <DropdownMenuItem className="cursor-pointer" onClick={() => setEditProduct(product)}>
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          {/* {product.is_active && (
                                              <DropdownMenuItem
                                                className="text-destructive cursor-pointer focus:text-destructive"
                                                onClick={() => handleQuickDisable(product.id)}
                                              >
                                                <X className="h-4 w-4 mr-2" />
                                                Make Disable
                                              </DropdownMenuItem>
                                            )} */}
                                          <DropdownMenuItem
                                            className="text-destructive cursor-pointer focus:text-destructive"
                                            onClick={() => setDeleteProductId(product.id)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
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
      {/* </div> */}

      {/* Delete Confirmation Dialog */}
      {canManageListings && (
        <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Edit Product Dialog */}
      {canManageListings && (
        <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Edit Product Details</DialogTitle>
            </DialogHeader>
            {editProduct && (
              <div className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={editProduct.title || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-description">Description</Label>
                    <Textarea
                      id="product-description"
                      rows={4}
                      value={editProduct.description || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="product-price">Price</Label>
                    <Input
                      id="product-price"
                      type="number"
                      step="0.01"
                      value={editProduct.price ?? ""}
                      onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-stock-quantity">Stock Quantity</Label>
                    <Input
                      id="product-stock-quantity"
                      type="number"
                      min="0"
                      value={editProduct.stock_quantity ?? 0}
                      onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="product-condition">Condition</Label>
                    <Select
                      value={editProduct.condition || ""}
                      onValueChange={(value) => setEditProduct({ ...editProduct, condition: value })}
                    >
                      <SelectTrigger id="product-condition">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map((condition) => (
                          <SelectItem key={condition.value} value={condition.value}>
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-stock-status">Stock Status</Label>
                    <Select
                      value={editProduct.stock_status || "In Stock"}
                      onValueChange={(value) => setEditProduct({ ...editProduct, stock_status: value })}
                    >
                      <SelectTrigger id="product-stock-status">
                        <SelectValue placeholder="Select stock status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STOCK_STATUSES.map((statusItem) => (
                          <SelectItem key={statusItem.value} value={statusItem.value}>
                            {statusItem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="product-deal-method">Deal Method</Label>
                    <Input
                      id="product-deal-method"
                      value={editProduct.deal_method || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, deal_method: e.target.value })}
                      placeholder="Delivery / Meet Up / Delivery, Meet Up"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-size">Size</Label>
                    <Input
                      id="product-size"
                      value={editProduct.size || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, size: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="meetup-date">Meetup Date</Label>
                    <Input
                      id="meetup-date"
                      type="date"
                      value={editProduct.meetup_date || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, meetup_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meetup-time">Meetup Time</Label>
                    <Input
                      id="meetup-time"
                      value={editProduct.meetup_time || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, meetup_time: e.target.value })}
                      placeholder="e.g. 14:00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="delivery-fee">Delivery Fee</Label>
                    <Input
                      id="delivery-fee"
                      type="number"
                      step="0.01"
                      value={editProduct.delivery_fee ?? ""}
                      onChange={(e) => setEditProduct({ ...editProduct, delivery_fee: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="meetup-location">Meetup Location</Label>
                    <Input
                      id="meetup-location"
                      value={editProduct.meetup_location || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, meetup_location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-style">Product Style</Label>
                    <Input
                      id="product-style"
                      value={editProduct.product_style || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, product_style: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="delivery-method">Delivery Method</Label>
                    <Input
                      id="delivery-method"
                      value={editProduct.delivery_method || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, delivery_method: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="delivery-time">Delivery Time</Label>
                    <Input
                      id="delivery-time"
                      value={editProduct.delivery_time || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, delivery_time: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="delivery-fee-type">Delivery Fee Type</Label>
                    <Input
                      id="delivery-fee-type"
                      value={editProduct.delivery_fee_type || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, delivery_fee_type: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shipping-address">Shipping Address</Label>
                  <Textarea
                    id="shipping-address"
                    rows={2}
                    value={editProduct.shipping_address || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, shipping_address: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="return-policy">Return Policy</Label>
                    <Input
                      id="return-policy"
                      value={editProduct.return_policy || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, return_policy: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="warranty-info">Warranty Info</Label>
                    <Input
                      id="warranty-info"
                      value={editProduct.warranty_info || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, warranty_info: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="packaging-info">Packaging Info</Label>
                    <Input
                      id="packaging-info"
                      value={editProduct.packaging_info || ""}
                      onChange={(e) => setEditProduct({ ...editProduct, packaging_info: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-active">Active</Label>
                    <Switch
                      id="is-active"
                      checked={!!editProduct.is_active}
                      onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_active: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-verified">Verified</Label>
                    <Switch
                      id="is-verified"
                      checked={!!editProduct.is_verified}
                      onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_verified: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-sold">Sold</Label>
                    <Switch
                      id="is-sold"
                      checked={!!editProduct.is_sold}
                      onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_sold: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="purchase-button-enabled">Purchase Button Enabled</Label>
                    <Switch
                      id="purchase-button-enabled"
                      checked={!!editProduct.purchase_button_enabled}
                      onCheckedChange={(checked) => setEditProduct({ ...editProduct, purchase_button_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tracking-provided">Tracking Provided</Label>
                    <Switch
                      id="tracking-provided"
                      checked={!!editProduct.tracking_provided}
                      onCheckedChange={(checked) => setEditProduct({ ...editProduct, tracking_provided: checked })}
                    />
                  </div>
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
                      const productUrl = editProduct.id ? `${baseUrl}/${editProduct.id}` : null;
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
                    <Button variant="outline" onClick={() => setEditProduct(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={editLoading}>
                      {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Spotlight Modal */}
      <Dialog open={!!spotlightProduct} onOpenChange={() => {
        setSpotlightProduct(null);
        setSpotlightDuration("24");
        setCustomDate(null);
        setExistingSpotlight(null);
      }}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              Spotlight Listing
            </DialogTitle>
          </DialogHeader>
          {spotlightProduct && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Listing</Label>
                  <p className="text-base font-semibold text-primary">{spotlightProduct.title || "Untitled listing"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Seller</Label>
                  <p className="text-base font-medium text-foreground">@{getSellerName(spotlightProduct)}</p>
                </div>
              </div>

              {fetchingSpotlight ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : existingSpotlight?.is_spotlighted && existingSpotlight?.spotlight ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">Current Spotlight</Label>
                      <Badge variant={existingSpotlight.spotlight.status === "active" ? "success" : "outline"} className="text-xs">
                        {existingSpotlight.spotlight.status || "Active"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Start Time</p>
                        <p className="font-medium text-foreground">
                          {existingSpotlight.spotlight.start_time
                            ? format(new Date(existingSpotlight.spotlight.start_time), "MMM dd, yyyy HH:mm")
                            : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">End Time</p>
                        <p className="font-medium text-foreground">
                          {existingSpotlight.spotlight.end_time || existingSpotlight.spotlight_end_time
                            ? format(new Date(existingSpotlight.spotlight.end_time || existingSpotlight.spotlight_end_time), "MMM dd, yyyy HH:mm")
                            : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium text-foreground">
                          {existingSpotlight.spotlight.duration_hours ? `${existingSpotlight.spotlight.duration_hours} hours` : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Applied By</p>
                        <p className="font-medium text-foreground">
                          @{existingSpotlight.spotlight.applied_by_username || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app";
                        let baseUrl = websiteUrl.endsWith('/') ? websiteUrl.slice(0, -1) : websiteUrl;
                        if (!baseUrl.endsWith('/products')) {
                          baseUrl = `${baseUrl}/products`;
                        }
                        const productUrl = spotlightProduct?.id ? `${baseUrl}/${spotlightProduct.id}` : null;
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
                          setSpotlightProduct(null);
                          setSpotlightDuration("24");
                          setCustomDate(null);
                          setExistingSpotlight(null);
                        }}
                      >
                        Close
                      </Button>
                      {canRemoveSpotlight && (
                        <Button
                          onClick={handleRemoveSpotlight}
                          disabled={removingSpotlight}
                          variant="destructive"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {removingSpotlight && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <X className="h-4 w-4 mr-2" />
                          Remove Spotlight
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Choose Spotlight Duration</Label>
                    <RadioGroup value={spotlightDuration} onValueChange={setSpotlightDuration} className="flex flex-wrap gap-6 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="24" id="24h" />
                        <Label htmlFor="24h" className="cursor-pointer font-normal">24 Hours</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="72" id="3d" />
                        <Label htmlFor="3d" className="cursor-pointer font-normal">3 Days</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="168" id="7d" />
                        <Label htmlFor="7d" className="cursor-pointer font-normal">7 Days</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom" className="cursor-pointer font-normal">Custom</Label>
                      </div>
                    </RadioGroup>
                    {spotlightDuration === "custom" && (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-2">
                          <Label>Select Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border border-border bg-background hover:border-[#E0B74F] hover:bg-background transition-colors"
                              >
                                {customDate ? (
                                  new Date(customDate).toLocaleDateString()
                                ) : (
                                  <span className="text-muted-foreground">Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={customDate}
                                onSelect={(date) => {
                                  if (date) {
                                    const newDate = new Date(date);
                                    if (customDate) {
                                      newDate.setHours(customDate.getHours(), customDate.getMinutes());
                                    } else {
                                      newDate.setHours(23, 59);
                                    }
                                    setCustomDate(newDate);
                                  } else {
                                    setCustomDate(null);
                                  }
                                }}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        {customDate && (
                          <div className="space-y-2">
                            <Label>Select Time</Label>
                            <div className="flex items-center gap-2">
                              <Select
                                value={customDate ? String(new Date(customDate).getHours() % 12 || 12) : "1"}
                                onValueChange={(value) => {
                                  if (customDate) {
                                    const newDate = new Date(customDate);
                                    const currentHours = newDate.getHours();
                                    const isPM = currentHours >= 12;
                                    const newHours = isPM ? parseInt(value) + 12 : parseInt(value);
                                    newDate.setHours(newHours % 24, newDate.getMinutes());
                                    setCustomDate(newDate);
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
                                value={customDate ? String(new Date(customDate).getMinutes()).padStart(2, "0") : "00"}
                                onValueChange={(value) => {
                                  if (customDate) {
                                    const newDate = new Date(customDate);
                                    newDate.setMinutes(parseInt(value));
                                    setCustomDate(newDate);
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
                                value={customDate && new Date(customDate).getHours() >= 12 ? "PM" : "AM"}
                                onValueChange={(value) => {
                                  if (customDate) {
                                    const newDate = new Date(customDate);
                                    const currentHours = newDate.getHours();
                                    const isPM = value === "PM";
                                    const hour12 = currentHours % 12 || 12;
                                    newDate.setHours(isPM ? hour12 + 12 : hour12 % 12, newDate.getMinutes());
                                    setCustomDate(newDate);
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
                        const productUrl = spotlightProduct?.id ? `${baseUrl}/${spotlightProduct.id}` : null;
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
                          setSpotlightProduct(null);
                          setSpotlightDuration("24");
                          setCustomDate(null);
                          setExistingSpotlight(null);
                        }}
                      >
                        Cancel
                      </Button>
                      {canSpotlight && (
                        <Button
                          onClick={handleApplySpotlight}
                          disabled={spotlightLoading || (spotlightDuration === "custom" && !customDate)}
                        >
                          {spotlightLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Apply Spotlight
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      {canManageListings && (
        <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedProducts.size} Product(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedProducts.size} selected product(s). This action cannot be undone. The deletion will be recorded in the system logs for auditing purposes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkActionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={bulkActionLoading}
              >
                {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Bulk Status Change Dialog */}
      {canManageListings && (
        <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Status for {selectedProducts.size} Product(s)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>New Status</Label>
                <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" disabled={areAllSelectedActive()}>Active</SelectItem>
                    <SelectItem value="inactive" disabled={areAllSelectedInactive()}>Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {areAllSelectedActive() && (
                  <p className="text-xs text-muted-foreground mt-1">All selected products are already active</p>
                )}
                {areAllSelectedInactive() && (
                  <p className="text-xs text-muted-foreground mt-1">All selected products are already inactive</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setBulkStatusDialog(false)}
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkStatusChange}
                className="gradient-driptyard-hover text-white"
                disabled={bulkActionLoading || (bulkStatusValue === "active" && areAllSelectedActive()) || (bulkStatusValue === "inactive" && areAllSelectedInactive())}
              >
                {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Verification Change Dialog */}
      {canManageListings && (
        <Dialog open={bulkVerificationDialog} onOpenChange={setBulkVerificationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Verification for {selectedProducts.size} Product(s)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>New Verification Status</Label>
                <Select value={bulkVerificationValue} onValueChange={setBulkVerificationValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified" disabled={areAllSelectedVerified()}>Verified</SelectItem>
                    <SelectItem value="unverified" disabled={areAllSelectedUnverified()}>Unverified</SelectItem>
                  </SelectContent>
                </Select>
                {areAllSelectedVerified() && (
                  <p className="text-xs text-muted-foreground mt-1">All selected products are already verified</p>
                )}
                {areAllSelectedUnverified() && (
                  <p className="text-xs text-muted-foreground mt-1">All selected products are already unverified</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setBulkVerificationDialog(false)}
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkVerificationChange}
                className="gradient-driptyard-hover text-white"
                disabled={bulkActionLoading || (bulkVerificationValue === "verified" && areAllSelectedVerified()) || (bulkVerificationValue === "unverified" && areAllSelectedUnverified())}
              >
                {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Verification
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Spotlight Dialog */}
      {canSpotlight && (
        <Dialog open={bulkSpotlightDialog} onOpenChange={(open) => {
          setBulkSpotlightDialog(open);
          if (!open) {
            setBulkSpotlightDuration("24");
            setBulkSpotlightCustomDate(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add {selectedProducts.size} Product(s) to Spotlight</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Choose Spotlight Duration</Label>
                <RadioGroup value={bulkSpotlightDuration} onValueChange={setBulkSpotlightDuration} className="flex flex-wrap gap-6 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24" id="bulk-24h" />
                    <Label htmlFor="bulk-24h" className="cursor-pointer font-normal">24 Hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="72" id="bulk-3d" />
                    <Label htmlFor="bulk-3d" className="cursor-pointer font-normal">3 Days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="168" id="bulk-7d" />
                    <Label htmlFor="bulk-7d" className="cursor-pointer font-normal">7 Days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="bulk-custom" />
                    <Label htmlFor="bulk-custom" className="cursor-pointer font-normal">Custom</Label>
                  </div>
                </RadioGroup>
                {areAllSelectedSpotlighted() && (
                  <p className="text-xs text-muted-foreground mt-2">All selected products are already spotlighted</p>
                )}
                {bulkSpotlightDuration === "custom" && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal border border-border bg-background hover:border-[#E0B74F] hover:bg-background transition-colors"
                          >
                            {bulkSpotlightCustomDate ? (
                              new Date(bulkSpotlightCustomDate).toLocaleDateString()
                            ) : (
                              <span className="text-muted-foreground">Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={bulkSpotlightCustomDate}
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date);
                                if (bulkSpotlightCustomDate) {
                                  newDate.setHours(bulkSpotlightCustomDate.getHours(), bulkSpotlightCustomDate.getMinutes());
                                } else {
                                  newDate.setHours(23, 59);
                                }
                                setBulkSpotlightCustomDate(newDate);
                              } else {
                                setBulkSpotlightCustomDate(null);
                              }
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {bulkSpotlightCustomDate && (
                      <div className="space-y-2">
                        <Label>Select Time</Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={bulkSpotlightCustomDate ? String(new Date(bulkSpotlightCustomDate).getHours() % 12 || 12) : "1"}
                            onValueChange={(value) => {
                              if (bulkSpotlightCustomDate) {
                                const newDate = new Date(bulkSpotlightCustomDate);
                                const currentHours = newDate.getHours();
                                const isPM = currentHours >= 12;
                                const newHours = isPM ? parseInt(value) + 12 : parseInt(value);
                                newDate.setHours(newHours % 24, newDate.getMinutes());
                                setBulkSpotlightCustomDate(newDate);
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
                            value={bulkSpotlightCustomDate ? String(new Date(bulkSpotlightCustomDate).getMinutes()).padStart(2, "0") : "00"}
                            onValueChange={(value) => {
                              if (bulkSpotlightCustomDate) {
                                const newDate = new Date(bulkSpotlightCustomDate);
                                newDate.setMinutes(parseInt(value));
                                setBulkSpotlightCustomDate(newDate);
                              }
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => {
                                const minutes = String(i).padStart(2, "0");
                                return (
                                  <SelectItem key={minutes} value={minutes}>
                                    {minutes}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Select
                            value={bulkSpotlightCustomDate ? (new Date(bulkSpotlightCustomDate).getHours() >= 12 ? "PM" : "AM") : "AM"}
                            onValueChange={(value) => {
                              if (bulkSpotlightCustomDate) {
                                const newDate = new Date(bulkSpotlightCustomDate);
                                const currentHours = newDate.getHours();
                                const hours12 = currentHours % 12 || 12;
                                const newHours = value === "PM" ? hours12 + 12 : hours12;
                                newDate.setHours(newHours % 24, newDate.getMinutes());
                                setBulkSpotlightCustomDate(newDate);
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
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkSpotlightDialog(false);
                  setBulkSpotlightDuration("24");
                  setBulkSpotlightCustomDate(null);
                }}
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkSpotlight}
                className="gradient-driptyard-hover text-white"
                disabled={bulkActionLoading || areAllSelectedSpotlighted() || (bulkSpotlightDuration === "custom" && !bulkSpotlightCustomDate)}
              >
                {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Apply Spotlight
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Edit Spotlight Dialog */}
      {canSpotlight && (
        <Dialog open={bulkEditSpotlightDialog} onOpenChange={(open) => {
          setBulkEditSpotlightDialog(open);
          if (!open) {
            setBulkEditSpotlightDuration("24");
            setBulkEditSpotlightCustomDate(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit {selectedProducts.size} Spotlight(s)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Choose New Spotlight Duration</Label>
                <RadioGroup value={bulkEditSpotlightDuration} onValueChange={setBulkEditSpotlightDuration} className="flex flex-wrap gap-6 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24" id="bulk-edit-24h" />
                    <Label htmlFor="bulk-edit-24h" className="cursor-pointer font-normal">24 Hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="72" id="bulk-edit-3d" />
                    <Label htmlFor="bulk-edit-3d" className="cursor-pointer font-normal">3 Days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="168" id="bulk-edit-7d" />
                    <Label htmlFor="bulk-edit-7d" className="cursor-pointer font-normal">7 Days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="bulk-edit-custom" />
                    <Label htmlFor="bulk-edit-custom" className="cursor-pointer font-normal">Custom</Label>
                  </div>
                </RadioGroup>
                {bulkEditSpotlightDuration === "custom" && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal border border-border bg-background hover:border-[#E0B74F] hover:bg-background transition-colors"
                          >
                            {bulkEditSpotlightCustomDate ? (
                              new Date(bulkEditSpotlightCustomDate).toLocaleDateString()
                            ) : (
                              <span className="text-muted-foreground">Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={bulkEditSpotlightCustomDate}
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date);
                                if (bulkEditSpotlightCustomDate) {
                                  newDate.setHours(bulkEditSpotlightCustomDate.getHours(), bulkEditSpotlightCustomDate.getMinutes());
                                } else {
                                  newDate.setHours(23, 59);
                                }
                                setBulkEditSpotlightCustomDate(newDate);
                              } else {
                                setBulkEditSpotlightCustomDate(null);
                              }
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {bulkEditSpotlightCustomDate && (
                      <div className="space-y-2">
                        <Label>Select Time</Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={bulkEditSpotlightCustomDate ? String(new Date(bulkEditSpotlightCustomDate).getHours() % 12 || 12) : "1"}
                            onValueChange={(value) => {
                              if (bulkEditSpotlightCustomDate) {
                                const newDate = new Date(bulkEditSpotlightCustomDate);
                                const currentHours = newDate.getHours();
                                const isPM = currentHours >= 12;
                                const newHours = isPM ? parseInt(value) + 12 : parseInt(value);
                                newDate.setHours(newHours % 24, newDate.getMinutes());
                                setBulkEditSpotlightCustomDate(newDate);
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
                            value={bulkEditSpotlightCustomDate ? String(new Date(bulkEditSpotlightCustomDate).getMinutes()).padStart(2, "0") : "00"}
                            onValueChange={(value) => {
                              if (bulkEditSpotlightCustomDate) {
                                const newDate = new Date(bulkEditSpotlightCustomDate);
                                newDate.setMinutes(parseInt(value));
                                setBulkEditSpotlightCustomDate(newDate);
                              }
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => {
                                const minutes = String(i).padStart(2, "0");
                                return (
                                  <SelectItem key={minutes} value={minutes}>
                                    {minutes}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Select
                            value={bulkEditSpotlightCustomDate ? (new Date(bulkEditSpotlightCustomDate).getHours() >= 12 ? "PM" : "AM") : "AM"}
                            onValueChange={(value) => {
                              if (bulkEditSpotlightCustomDate) {
                                const newDate = new Date(bulkEditSpotlightCustomDate);
                                const currentHours = newDate.getHours();
                                const hours12 = currentHours % 12 || 12;
                                const newHours = value === "PM" ? hours12 + 12 : hours12;
                                newDate.setHours(newHours % 24, newDate.getMinutes());
                                setBulkEditSpotlightCustomDate(newDate);
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
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkEditSpotlightDialog(false);
                  setBulkEditSpotlightDuration("24");
                  setBulkEditSpotlightCustomDate(null);
                }}
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkEditSpotlight}
                className="border-[#E0B74F] bg-[#E0B74F] text-[#0B0B0D] hover:bg-[#E0B74F]/90"
                disabled={bulkActionLoading || (bulkEditSpotlightDuration === "custom" && !bulkEditSpotlightCustomDate)}
              >
                {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Spotlights
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Remove Spotlight Dialog */}
      {canRemoveSpotlight && (
        <AlertDialog open={bulkRemoveSpotlightDialog} onOpenChange={setBulkRemoveSpotlightDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {selectedProducts.size} Spotlight(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {selectedProducts.size} selected spotlight(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkActionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkRemoveSpotlight}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={bulkActionLoading}
              >
                {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AdminLayout>
  );
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <Products />
    </ProtectedRoute>
  );
}
