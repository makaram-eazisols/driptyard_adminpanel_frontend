"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Star, Plus, X } from "lucide-react";

// Mock data
const mockSpotlightProducts = [
  {
    id: "1",
    title: "Nike Air Jordan 1 Retro",
    seller: "john.doe@example.com",
    price: "$299",
    boostedUntil: "2024-01-20",
    views: "2,450",
    image: "/placeholder.svg"
  },
  {
    id: "2",
    title: "Supreme Box Logo Hoodie",
    seller: "jane.smith@example.com",
    price: "$450",
    boostedUntil: "2024-01-18",
    views: "1,890",
    image: "/placeholder.svg"
  },
];

const mockAvailableProducts = [
  {
    id: "3",
    title: "Yeezy Boost 350",
    seller: "user@example.com",
    price: "$350",
    image: "/placeholder.svg"
  },
  {
    id: "4",
    title: "Off-White Presto",
    seller: "seller@example.com",
    price: "$500",
    image: "/placeholder.svg"
  },
];

function Spotlight() {
  const [searchTerm, setSearchTerm] = useState("");
  const [duration, setDuration] = useState("7");

  const handleAddToSpotlight = (productId) => {
    console.log("Adding to spotlight:", productId, "Duration:", duration);
    // TODO: Call API
  };

  const handleRemoveFromSpotlight = (productId) => {
    console.log("Removing from spotlight:", productId);
    // TODO: Call API
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">
            Admin Spotlight
          </h1>
          <p className="text-muted-foreground">Manually feature and boost product listings</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Active Spotlight Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockSpotlightProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-16 h-16 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">Seller: {product.seller}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-primary">{product.price}</span>
                    <span className="text-muted-foreground">Views: {product.views}</span>
                    <Badge variant="secondary">Until {product.boostedUntil}</Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveFromSpotlight(product.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add Product to Spotlight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-48 space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Spotlight Duration (days)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              {mockAvailableProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-cover bg-muted"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{product.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.seller} • {product.price}
                    </p>
                  </div>
                  <Button
                    className="gradient-driptyard-hover text-white"
                    size="sm"
                    onClick={() => handleAddToSpotlight(product.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Spotlight
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
