"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2, Package2, AlertCircle, Flag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { notifyError } from "@/lib/toast";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productsChartData, setProductsChartData] = useState([]);
  const [usersChartData, setUsersChartData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.getAdminStatsOverview();
        console.log("📊 Dashboard API Response:", data);
        setStats(data);
        
        // Transform products growth data for chart
        if (data?.products_growth_data && Array.isArray(data.products_growth_data)) {
          const transformedProducts = data.products_growth_data.map((item) => ({
            date: formatChartDate(item.date),
            count: item.cumulative,
            dailyCount: item.count,
          }));
          console.log("📦 Products Chart Data:", transformedProducts);
          setProductsChartData(transformedProducts);
        } else {
          console.warn("⚠️ No products_growth_data in API response");
        }
        
        // Transform users growth data for chart
        if (data?.users_growth_data && Array.isArray(data.users_growth_data)) {
          const transformedUsers = data.users_growth_data.map((item) => ({
            date: formatChartDate(item.date),
            count: item.cumulative,
            dailyCount: item.count,
          }));
          console.log("👥 Users Chart Data:", transformedUsers);
          setUsersChartData(transformedUsers);
        } else {
          console.warn("⚠️ No users_growth_data in API response");
        }
      } catch (error) {
        console.error("❌ Dashboard API Error:", error);
        notifyError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatChange = (change) => {
    if (change === null || change === undefined) return "—";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change?.toFixed(1)}%`;
  };

  // Format date from API response (e.g., "2025-11-02" to "Nov 2")
  const formatChartDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM d");
    } catch {
      return dateString;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {loading ? (
          <>
            {/* Loading skeleton for stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="w-11 h-11 rounded-lg" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Loading skeleton for charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="shadow-md">
                  <CardHeader className="p-4 pb-2">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <Skeleton className="h-[350px] w-full rounded-lg" />
                    <div className="mt-4 flex items-center justify-between bg-[#F8F8F8] p-3 rounded-lg">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats?.total_users?.toString() || "0"}
                change={formatChange(stats?.users_change)}
                icon={Users2}
                trend={stats?.users_change >= 0 ? "up" : "down"}
                href="/admin/users"
              />
              <StatCard
                title="Total active listings"
                value={stats?.total_products?.toString() || "0"}
                change={formatChange(stats?.products_change)}
                icon={Package2}
                trend={stats?.products_change >= 0 ? "up" : "down"}
                href="/admin/products"
              />
              <StatCard
                title="Total Listings Removed"
                value={stats?.total_listings_removed?.toString() || "0"}
                change={formatChange(stats?.listings_removed_change)}
                icon={Trash2}
                trend={stats?.listings_removed_change >= 0 ? "up" : "down"}
                href="/admin/products"
              />
              <StatCard
                title="Flagged Content"
                value={stats?.flagged_content_count?.toString() || "0"}
                change={formatChange(stats?.flagged_content_change)}
                icon={Flag}
                trend={stats?.flagged_content_change >= 0 ? "up" : "down"}
                href="/admin/flagged"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Total Products Chart */}
              <Card className="shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold font-playfair text-[#0B0B0D]">
                    <Package2 className="h-6 w-6 text-[#1F4E79]" strokeWidth={2.5} />
                    Total Products Growth
                  </CardTitle>
                  <p className="text-sm text-[#333333] mt-1">Product listings over the last 30 days</p>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {loading ? (
                    <div className="flex items-center justify-center h-[350px]">
                      <div className="animate-pulse text-[#333333]">Loading chart data...</div>
                    </div>
                  ) : productsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={productsChartData}>
                        <defs>
                          <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1F4E79" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#1F4E79" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#333333"
                          style={{ fontSize: '11px', fontFamily: 'Inter' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#333333"
                          style={{ fontSize: '12px', fontFamily: 'Inter' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#F8F8F8',
                            border: '1px solid #E0B74F',
                            borderRadius: '8px',
                            fontFamily: 'Inter'
                          }}
                          labelStyle={{ color: '#0B0B0D', fontWeight: 'bold' }}
                          cursor={{ fill: 'rgba(31, 78, 121, 0.1)' }}
                          formatter={(value, name) => {
                            if (name === 'count') return [value, 'Total Products'];
                            return [value, name];
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="url(#colorProducts)" 
                          radius={[8, 8, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between bg-[#F8F8F8] p-3 rounded-lg">
                    <span className="text-sm font-medium text-[#333333]">Current Total:</span>
                    <span className="text-2xl font-bold text-[#1F4E79]">{stats?.total_products || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Users Chart */}
              <Card className="shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold font-playfair text-[#0B0B0D]">
                    <Users2 className="h-6 w-6 text-[#2ECC71]" strokeWidth={2.5} />
                    Total Users Growth
                  </CardTitle>
                  <p className="text-sm text-[#333333] mt-1">User registrations over the last 30 days</p>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {loading ? (
                    <div className="flex items-center justify-center h-[350px]">
                      <div className="animate-pulse text-[#333333]">Loading chart data...</div>
                    </div>
                  ) : usersChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={usersChartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#2ECC71" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#333333"
                          style={{ fontSize: '11px', fontFamily: 'Inter' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#333333"
                          style={{ fontSize: '12px', fontFamily: 'Inter' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#F8F8F8',
                            border: '1px solid #E0B74F',
                            borderRadius: '8px',
                            fontFamily: 'Inter'
                          }}
                          labelStyle={{ color: '#0B0B0D', fontWeight: 'bold' }}
                          formatter={(value, name) => {
                            if (name === 'count') return [value, 'Total Users'];
                            return [value, name];
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#2ECC71" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorUsers)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between bg-[#F8F8F8] p-3 rounded-lg">
                    <span className="text-sm font-medium text-[#333333]">Current Total:</span>
                    <span className="text-2xl font-bold text-[#2ECC71]">{stats?.total_users || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

