import { useGetAdminStats } from "@workspace/api-client-react";
import { Users, FileText, IndianRupee, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useGetAdminStats();

  if (isLoading) return <div className="min-h-screen bg-background p-8 text-white">Loading Admin Data...</div>;
  if (error || !stats) return <div className="min-h-screen bg-background p-8 text-red-500">Failed to load admin stats. Are you an admin?</div>;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Activity className="text-primary" /> Admin Overview
        </h1>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg"><Users className="h-5 w-5 text-blue-500" /></div>
              <span className="text-xs text-green-500 font-medium">+12%</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <h3 className="text-2xl font-bold text-white">{stats.totalUsers}</h3>
          </div>
          
          <div className="bg-card border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-lg"><IndianRupee className="h-5 w-5 text-primary" /></div>
              <span className="text-xs text-green-500 font-medium">Today</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Revenue Today</p>
            <h3 className="text-2xl font-bold text-white">₹{stats.revenueToday}</h3>
          </div>

          <div className="bg-card border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-green-500" /></div>
              <span className="text-xs text-muted-foreground font-medium">This Month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
            <h3 className="text-2xl font-bold text-white">₹{stats.revenueMonth}</h3>
          </div>

          <div className="bg-card border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg"><FileText className="h-5 w-5 text-purple-500" /></div>
              <span className="text-xs text-muted-foreground font-medium">Total</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Docs Generated</p>
            <h3 className="text-2xl font-bold text-white">{stats.totalDocuments}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="col-span-1 lg:col-span-2 bg-card border border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Popular Document Types</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.popularDocTypes}>
                  <XAxis dataKey="type" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0A0F1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.popularDocTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(45 93% 53%)' : 'hsl(215 20% 65% / 0.5)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-span-1 bg-card border border-white/10 p-6 rounded-2xl overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6">Recent Transactions</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {stats.recentTransactions?.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">Order #{tx.id}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), 'MMM dd, HH:mm')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">+₹{tx.amount}</p>
                    <span className="text-[10px] uppercase bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">{tx.status}</span>
                  </div>
                </div>
              ))}
              {!stats.recentTransactions?.length && (
                <div className="text-center text-muted-foreground text-sm py-4">No recent transactions</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
