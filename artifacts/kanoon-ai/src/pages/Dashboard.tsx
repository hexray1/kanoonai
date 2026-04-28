import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  FileText, Download, Edit3, Crown, Plus, CheckCircle2, Clock,
  IndianRupee, Search, Receipt, Sparkles, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useListDocuments,
  useGetMe,
  useGetPaymentHistory,
} from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Filter = "all" | "paid" | "draft";

import { useSeo } from "@/hooks/use-seo";

export default function Dashboard() {
  useSeo({
    title: "My Documents — Dashboard | KanoonAI",
    description: "View, download and manage all your generated Indian legal documents from your KanoonAI dashboard.",
  });
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const { data: documents, isLoading } = useListDocuments();
  const { data: me } = useGetMe();
  const { data: payments } = useGetPaymentHistory();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"docs" | "payments">("docs");

  const activeUser = me?.user || user;

  const totalSpent = useMemo(() => {
    if (!payments) return 0;
    return payments
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const paidCount = documents?.filter((d) => d.paid).length || 0;
  const draftCount = (documents?.length || 0) - paidCount;

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => {
      if (filter === "paid" && !d.paid) return false;
      if (filter === "draft" && d.paid) return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [documents, filter, search]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${activeUser?.referralCode || "INVITE"}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Referral link copied!", description: "Share it with friends to earn ₹50 each." });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-card to-card/40 border border-white/10 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          {activeUser?.profilePicture ? (
            <img
              src={activeUser.profilePicture}
              alt={activeUser.name || "User"}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/30 shadow-gold"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/30">
              <span className="text-2xl font-bold text-primary">
                {(activeUser?.name || activeUser?.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {activeUser?.name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-muted-foreground text-sm">
              {activeUser?.email && <span className="mr-2">{activeUser.email}</span>}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 capitalize">
                <Crown className="h-3 w-3" /> {activeUser?.plan || "Free"} Plan
              </span>
            </p>
          </div>
          <Button onClick={() => setLocation("/documents")} className="bg-primary text-primary-foreground shadow-gold h-11">
            <Plus className="mr-2 h-4 w-4" /> Create New Document
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText} label="Total Documents" value={documents?.length || 0} color="blue" />
          <StatCard icon={CheckCircle2} label="Paid & Ready" value={paidCount} color="green" />
          <StatCard icon={Clock} label="Drafts" value={draftCount} color="yellow" />
          <StatCard
            icon={IndianRupee}
            label="Total Spent"
            value={`₹${totalSpent.toLocaleString("en-IN")}`}
            color="primary"
          />
        </div>

        {/* Refer & earn banner */}
        <div className="bg-gradient-to-r from-primary/10 to-yellow-500/5 border border-primary/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Refer friends, earn ₹50 each</h3>
              <p className="text-xs text-muted-foreground">Your code: <span className="text-primary font-mono">{activeUser?.referralCode || "—"}</span></p>
            </div>
          </div>
          <Button variant="outline" onClick={copyReferralLink} className="border-primary/30 text-primary hover:bg-primary/10">
            Copy Referral Link
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <TabButton active={tab === "docs"} onClick={() => setTab("docs")} icon={FileText} label="Documents" />
          <TabButton active={tab === "payments"} onClick={() => setTab("payments")} icon={Receipt} label="Payment History" />
        </div>

        {tab === "docs" && (
          <>
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-card border-white/10 text-white"
                />
              </div>
              <div className="flex gap-1 bg-card border border-white/10 rounded-lg p-1">
                {(["all", "paid", "draft"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                      filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading documents...</div>
              ) : !filteredDocs.length ? (
                <EmptyState
                  hasAny={!!documents?.length}
                  onCreate={() => setLocation("/documents")}
                  search={search}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-background/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-medium">Document</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Price</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-white truncate max-w-[280px]">{doc.title}</div>
                                <div className="text-xs text-muted-foreground capitalize">{(doc as any).language || "en"} · #{doc.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                            {format(new Date(doc.createdAt), "MMM dd, yyyy")}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">₹{(doc as any).price || 99}</td>
                          <td className="px-6 py-4">
                            {doc.paid ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                <Clock className="h-3 w-3" /> Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {doc.paid ? (
                              <Button size="sm" variant="ghost" onClick={() => setLocation(`/documents/${doc.id}/download`)} className="text-primary hover:text-primary hover:bg-primary/10">
                                <Download className="h-4 w-4 mr-2" /> Download
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setLocation(`/documents/${doc.id}/preview`)} className="text-white hover:bg-white/10">
                                <Edit3 className="h-4 w-4 mr-2" /> Unlock
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "payments" && (
          <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {!payments?.length ? (
              <div className="p-16 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-white font-medium">No payments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your transaction history will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                          {(p.razorpayOrderId || `#${p.id}`).slice(0, 22)}...
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {format(new Date(p.createdAt), "MMM dd, yyyy HH:mm")}
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">₹{Number(p.amount || 0).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4">
                          {p.status === "paid" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">PAID</span>
                          ) : p.status === "pending" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">PENDING</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 capitalize">{p.status}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground capitalize">
                          {p.plan ? `${p.plan} Subscription` : "Document"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    yellow: "bg-yellow-500/10 text-yellow-500",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5">
      <div className={`p-2.5 rounded-lg w-fit mb-3 ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
        active
          ? "text-primary border-primary"
          : "text-muted-foreground border-transparent hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function EmptyState({ hasAny, onCreate, search }: { hasAny: boolean; onCreate: () => void; search: string }) {
  if (search) {
    return (
      <div className="p-16 text-center">
        <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-white font-medium">No documents match "{search}"</p>
        <p className="text-sm text-muted-foreground mt-1">Try a different keyword.</p>
      </div>
    );
  }
  return (
    <div className="p-16 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-white font-medium">{hasAny ? "No documents in this filter" : "No documents yet"}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        {hasAny ? "Try a different filter." : "Create your first legal document in 60 seconds."}
      </p>
      {!hasAny && (
        <Button onClick={onCreate} variant="outline">
          Browse Templates
        </Button>
      )}
    </div>
  );
}
