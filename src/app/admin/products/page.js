"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Edit2, Trash2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
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
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const { toast } = useToast();

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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery]);

  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      await apiClient.deleteAdminProduct(deleteProductId);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteProductId(null);
      fetchProducts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product",
      });
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
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product",
      });
    } finally {
      setEditLoading(false);
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
    if (product.is_featured) return "Featured";
    return "Active";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Products</h1>
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
        <Card>
          <CardContent className="p-6">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-0">Product Name</TableHead>
                      <TableHead className="p-0">Category</TableHead>
                      <TableHead className="p-0">Price</TableHead>
                      <TableHead className="p-0">Condition</TableHead>
                      <TableHead className="p-0">Status</TableHead>
                      <TableHead className="p-0 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="p-0 font-medium">{product.title}</TableCell>
                        <TableCell className="p-0">{product.category || "—"}</TableCell>
                        <TableCell className="p-0 font-semibold">${Number(product.price).toFixed(2)}</TableCell>
                        <TableCell className="p-0">{product.condition || "—"}</TableCell>
                        <TableCell className="p-0">
                          <Badge variant={getStatusBadgeVariant(product)}>{getStatusText(product)}</Badge>
                        </TableCell>
                        <TableCell className="p-0 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
                  checked={editProduct.is_featured}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_featured: checked })}
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
