"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
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

const CONDITIONS = [
  { value: "New", label: "New" },
  { value: "Like New", label: "Like New" },
  { value: "Used", label: "Used" },
  { value: "Heavily Used", label: "Heavily Used" },
];

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAdminProducts({
        page,
        page_size: 10,
        search: searchQuery || undefined,
      });
      setProducts(data.products || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      setPageSize(data.page_size || 10);
    } catch (error) {
      notifyError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery]);

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
        price: Number(editProduct.price) || 0,
        condition: editProduct.condition,
        is_active: editProduct.is_active,
        is_verified: editProduct.is_verified,
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
  const isHealthy =
    product.is_active &&
    !product.is_flagged &&
    product.is_verified &&
    !product.is_sold;

  return isHealthy ? "success" : "destructive";
};

const getStatusText = (product) => {
  if (!product.is_active) return "Inactive";
  if (product.is_sold) return "Sold";
  if (product.is_flagged) return "Flagged";
  if (!product.is_verified) return "Unverified";
  if (product.is_spotlighted) return "Featured";
  return "Active";
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
  if (product.is_flagged) {
    return { label: "Flagged", variant: "destructive" };
  }
  return { label: "Pending Review", variant: "outline" };
};

const formatPrice = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  return `$${numeric.toFixed(2)}`;
};

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Listings Management</h1>
            <p className="text-muted-foreground mt-1">Manage your product inventory</p>
          </div>
          <div className="relative w-full max-w-sm md:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
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
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="h-12 px-4 font-semibold text-secondary">Thumbnail</TableHead>
                        <TableHead className="h-12 px-4 font-semibold text-secondary">Title</TableHead>
                        <TableHead className="h-12 px-4 font-semibold text-secondary">Seller</TableHead>
                        <TableHead className="h-12 px-4 font-semibold text-secondary">Price</TableHead>
                        <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                        <TableHead className="h-12 px-4 font-semibold text-secondary">Verification</TableHead>
                        <TableHead className="h-12 px-4 text-right font-semibold text-secondary">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const image = getPrimaryImage(product);
                        const authBadge = getAuthBadge(product);

                        return (
                          <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="py-3 px-4">
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
                            <TableCell className="py-3 px-4">
                              <p className="font-semibold text-sm text-primary leading-tight">{product.title || "Untitled listing"}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="text-sm text-foreground">{product?.owner_name}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <p className="font-semibold text-sm text-primary">{formatPrice(product.price)}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <Badge variant={getStatusBadgeVariant(product)} className="text-xs">{getStatusText(product)}</Badge>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <Badge variant={authBadge.variant} className="text-xs">{authBadge.label}</Badge>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {product.is_verified && (
                                    <DropdownMenuItem
                                      className="cursor-pointer group flex items-center gap-2 hover:bg-[#E0B74F] hover:text-[#0B0B0D] focus:bg-[#E0B74F] focus:text-[#0B0B0D] transition-colors"
                                      onClick={() => setSpotlightProduct(product)}
                                    >
                                      <Star className="h-4 w-4 text-accent transition-colors group-hover:text-[#0B0B0D] group-focus:text-[#0B0B0D]" />
                                      Spotlight
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => setEditProduct(product)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer focus:text-destructive"
                                    onClick={() => setDeleteProductId(product.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
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

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Product Status</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={editProduct.title || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, title: e.target.value })}
                  />
                </div>
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
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Active</Label>
                <Switch
                  id="is-active"
                  checked={editProduct.is_active}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-verified">Verified</Label>
                <Switch
                  id="is-verified"
                  checked={editProduct.is_verified}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_verified: checked })}
                />
              </div>
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="is-flagged">Flagged</Label>
                <Switch
                  id="is-flagged"
                  checked={editProduct.is_flagged}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_flagged: checked })}
                />
              </div> */}
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="is-featured">Featured</Label>
                <Switch
                  id="is-featured"
                  checked={editProduct.is_spotlighted}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_spotlighted: checked })}
                />
              </div> */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditProduct(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={editLoading}>
                  {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  <div className="flex justify-end gap-2 pt-2">
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
                  <div className="flex justify-end gap-2 pt-4">
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
                    <Button
                      onClick={handleApplySpotlight}
                      disabled={spotlightLoading || (spotlightDuration === "custom" && !customDate)}
                    >
                      {spotlightLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Apply Spotlight
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
