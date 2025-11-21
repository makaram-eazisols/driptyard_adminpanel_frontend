"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";

const categories = [
  { id: 1, name: "Fashion", productCount: 234, icon: "👔", color: "from-purple-500 to-pink-500" },
  { id: 2, name: "Watches", productCount: 89, icon: "⌚", color: "from-pink-500 to-orange-500" },
  { id: 3, name: "Collectibles", productCount: 156, icon: "🎨", color: "from-orange-500 to-red-500" },
  { id: 4, name: "Lifestyle", productCount: 198, icon: "🌟", color: "from-purple-600 to-pink-600" },
  { id: 5, name: "Home & Living", productCount: 145, icon: "🏠", color: "from-pink-600 to-orange-600" },
  { id: 6, name: "Vehicles", productCount: 67, icon: "🚗", color: "from-orange-600 to-red-600" },
];

function Categories() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Categories</h1>
            <p className="text-muted-foreground mt-1">Organize products into categories</p>
          </div>
          <Button className="gradient-driptyard-hover text-white shadow-md">
            <Plus className="h-4 w-4 mr-2" strokeWidth={2.5} />
            Add Category
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-3xl mb-4`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                <p className="text-muted-foreground mb-4">
                  {category.productCount} products
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 hover:border-primary">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <Categories />
    </ProtectedRoute>
  );
}
