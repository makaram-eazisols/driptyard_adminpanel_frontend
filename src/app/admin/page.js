"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2, Package2, AlertCircle, Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { notifyError } from "@/lib/toast";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Sample data for Total Products chart (last 30 days)
const productsData = [
  { date: "Nov 1", count: 120 },
  { date: "Nov 3", count: 135 },
  { date: "Nov 5", count: 145 },
  { date: "Nov 7", count: 160 },
  { date: "Nov 9", count: 175 },
  { date: "Nov 11", count: 188 },
  { date: "Nov 13", count: 195 },
  { date: "Nov 15", count: 210 },
  { date: "Nov 17", count: 225 },
  { date: "Nov 19", count: 240 },
  { date: "Nov 21", count: 258 },
  { date: "Nov 23", count: 270 },
  { date: "Nov 25", count: 285 },
  { date: "Nov 27", count: 298 },
  { date: "Nov 29", count: 315 },
  { date: "Dec 1", count: 332 },
];

// Sample data for Total Users chart (last 30 days)
const usersData = [
  { date: "Nov 1", count: 450 },
  { date: "Nov 3", count: 480 },
  { date: "Nov 5", count: 510 },
  { date: "Nov 7", count: 545 },
  { date: "Nov 9", count: 575 },
  { date: "Nov 11", count: 608 },
  { date: "Nov 13", count: 640 },
  { date: "Nov 15", count: 675 },
  { date: "Nov 17", count: 710 },
  { date: "Nov 19", count: 748 },
  { date: "Nov 21", count: 785 },
  { date: "Nov 23", count: 820 },
  { date: "Nov 25", count: 858 },
  { date: "Nov 27", count: 895 },
  { date: "Nov 29", count: 932 },
  { date: "Dec 1", count: 970 },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.getAdminStatsOverview();
        setStats(data);
      } catch (error) {
        notifyError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatChange = (change) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change?.toFixed(1)}%`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* <div>
          <h1 className="text-3xl font-bold text-secondary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
        </div> */}
        {/* {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-32" />
              </Card>
            ))}
          </div>
        ) : stats ? ( */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats?.total_users?.toString() || "0"}
              change={formatChange(stats?.users_change)}
              icon={Users2}
              trend={stats?.users_change >= 0 ? "up" : "down"}
            />
            <StatCard
              title="Total Products"
              value={stats?.total_products?.toString() || "0"}
              change={formatChange(stats?.products_change)}
              icon={Package2}
              trend={stats?.products_change >= 0 ? "up" : "down"}
            />
            <StatCard
              title="Pending Verifications"
              value={stats?.pending_verifications?.toString() || "0"}
              change="—"
              icon={AlertCircle}
              trend="up"
            />
            <StatCard
              title="Flagged Content"
              value={stats?.flagged_content_count?.toString() || "0"}
              change="—"
              icon={Flag}
              trend="up"
            />
          </div>
        {/* ) : null} */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={productsData}>
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
                    style={{ fontSize: '12px', fontFamily: 'Inter' }}
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
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#colorProducts)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-between bg-[#F8F8F8] p-3 rounded-lg">
                <span className="text-sm font-medium text-[#333333]">Current Total:</span>
                <span className="text-2xl font-bold text-[#1F4E79]">{stats?.total_products || 332}</span>
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
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={usersData}>
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
                    style={{ fontSize: '12px', fontFamily: 'Inter' }}
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
              <div className="mt-4 flex items-center justify-between bg-[#F8F8F8] p-3 rounded-lg">
                <span className="text-sm font-medium text-[#333333]">Current Total:</span>
                <span className="text-2xl font-bold text-[#2ECC71]">{stats?.total_users || 970}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

