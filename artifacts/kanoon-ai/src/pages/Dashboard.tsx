import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { format, differenceInDays, addMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Crown, Plus, CheckCircle2, Clock,
  IndianRupee, Search, Receipt, Sparkles, Lock,
  Bell, RefreshCw, Loader2, ChevronRight, AlertTriangle,
  Shield, Zap, LayoutGrid, LayoutList, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useListDocuments, useGetMe, useGetPaymentHistory,
} from "@workspace/api-client-react";
import { useAuthStore, getAuthToken } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Filter = "all" | "paid" | "draft";
type ViewMode = "grid" | "list";

// ── Renewal logic ────────────────────────────────────────────────────────────
function getRenewalStatus(doc: any): null | "due" | "soon" {
  if (doc.type !== "rent-agreement" || !doc.paid) return null;
  const created = new Date(doc.createdAt);
  const expiry  = addMonths(created, 11);
  const today   = new Date();
  const days    = differenceInDays(expiry, today);
  if (days < 0)  return "due";
  if (days <= 30) return "soon";
  return null;
}

// ── Document card ─────────────────────────────────────────────────────────────
function DocCard({
  doc, viewMode, onDownload, onUnlock, downloading,
}: {
  doc: any; viewMode: ViewMode;
  onDownload: (id: number) => void;
  onUnlock:   (id: number, price: number) => void;
  downloading: number | null;
}) {
  const renewal = getRenewalStatus(doc);
  const price   = doc.price ?? 99;
  const gst     = Math.round(price * 0.18);

  const typeIcon: Record<string, string> = {
    "rent-agreement": "🏡",   "nda": "🤝",          "affidavit": "📋",
    "legal-notice":   "⚖️",   "offer-letter": "💼",  "partnership-deed": "🤝",
    "will":           "📜",   "gift-deed": "🎁",     "fir-draft": "🚨",
    "emp-contract":   "💼",   "termination-letter": "📄",
    "business-contract": "📑","mou": "📋",           "rti": "🏛️",
  };
  const emoji = typeIcon[doc.type] ?? "📄";

  if (viewMode === "list") {
    return (
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-lg">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm truncate">{doc.title}</span>
            {renewal === "due"  && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold">RENEWAL DUE</span>}
            {renewal === "soon" && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold">RENEW SOON</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(doc.createdAt), "d MMM yyyy")} · #{doc.id}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-white font-semibold text-sm">₹{price + gst}</div>
          <div className="text-[10px] text-muted-foreground">incl. GST</div>
        </div>
        <div className="shrink-0">
          {doc.paid
            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="h-3 w-3"/>Paid</span>
            : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock className="h-3 w-3"/>Draft</span>}
        </div>
        <div className="shrink-0">
          {doc.paid ? (
            <Button size="sm" onClick={() => onDownload(doc.id)}
              disabled={downloading === doc.id}
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3">
              {downloading === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Download className="h-3 w-3 mr-1.5"/>PDF</>}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onUnlock(doc.id, price)}
              className="h-8 border-white/20 text-white hover:bg-white/5 text-xs px-3">
              <Lock className="h-3 w-3 mr-1.5"/>₹{price + gst}
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Grid card
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group relative overflow-hidden flex flex-col gap-4">
      {renewal && (
        <div className={`absolute top-0 inset-x-0 h-0.5 ${renewal === "due" ? "bg-red-500" : "bg-amber-500"}`} />
      )}

      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-1">{doc.title}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(doc.createdAt), "d MMM yyyy")} · #{doc.id}</p>
        </div>
      </div>

      {renewal && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
          renewal === "due"
            ? "bg-red-500/10 border border-red-500/20 text-red-400"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
        }`}>
          {renewal === "due" ? <AlertTriangle className="h-3.5 w-3.5 shrink-0"/> : <Bell className="h-3.5 w-3.5 shrink-0"/>}
          {renewal === "due" ? "Agreement expired — renew now" : "Agreement expiring in < 30 days"}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {doc.paid
            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="h-3 w-3"/>Unlocked</span>
            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20"><Lock className="h-3 w-3"/>Locked</span>}
        </div>
        <span className="text-white font-bold text-sm">₹{price + gst}</span>
      </div>

      <div className="flex gap-2 mt-auto">
        {doc.paid ? (
          <>
            <Button onClick={() => onDownload(doc.id)} disabled={downloading === doc.id}
              className="flex-1 h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
              {downloading === doc.id
                ? <><Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5"/>Preparing…</>
                : <><Download className="h-3.5 w-3.5 mr-1.5"/>Download PDF</>}
            </Button>
            {renewal && (
              <Button variant="outline" onClick={() => window.location.href = `/documents/generate/${doc.type}`}
                className="h-9 px-3 border-white/20 text-muted-foreground hover:text-white text-xs">
                <RefreshCw className="h-3.5 w-3.5"/>
              </Button>
            )}
          </>
        ) : (
          <Button onClick={() => onUnlock(doc.id, price)} variant="outline"
            className="flex-1 h-9 border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold">
            <Lock className="h-3.5 w-3.5 mr-1.5"/>Unlock · ₹{price + gst}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: string | number; color: string; sub?: string;
}) {
  const colorMap: Record<string, string> = {
    blue:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green:   "bg-green-500/10 text-green-400 border-green-500/20",
    amber:   "bg-amber-500/10 text-amber-500 border-amber-500/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    purple:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
      <div className={`p-2.5 rounded-xl w-fit mb-3 border ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  useSeo({
    title: "My Documents — Kanoox AI Dashboard",
    description: "View, download and manage all your AI-generated Indian legal documents.",
  });

  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();

  const { data: documents, isLoading, refetch } = useListDocuments();
  const { data: me }       = useGetMe();
  const { data: payments } = useGetPaymentHistory();

  const [filter, setFilter]       = useState<Filter>("all");
  const [search, setSearch]       = useState("");
  const [tab, setTab]             = useState<"docs" | "payments">("docs");
  const [viewMode, setViewMode]   = useState<ViewMode>("grid");
  const [downloading, setDownloading] = useState<number | null>(null);

  const activeUser  = me?.user || user;
  const paidCount   = documents?.filter((d: any) => d.paid).length ?? 0;
  const draftCount  = (documents?.length ?? 0) - paidCount;
  const renewalDue  = documents?.filter((d: any) => getRenewalStatus(d) !== null).length ?? 0;

  const totalSpent = useMemo(() => {
    if (!payments) return 0;
    return (payments as any[])
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }, [payments]);

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return (documents as any[]).filter((d) => {
      if (filter === "paid"  && !d.paid)  return false;
      if (filter === "draft" &&  d.paid)  return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [documents, filter, search]);

  const handleDownload = useCallback(async (docId: number) => {
    setDownloading(docId);
    try {
      const token = getAuthToken();
      const res = await fetch(`${BASE}/api/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const doc  = documents?.find((d: any) => d.id === docId) as any;
      a.download = `${(doc?.title ?? "document").replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download started!", description: "Your PDF is downloading." });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  }, [documents]);

  const handleUnlock = (docId: number, price: number) => {
    setLocation(`/documents/${docId}/preview`);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${activeUser?.referralCode || "INVITE"}`;
    navigator.clipboard.writeText(link).catch(() => {});
    toast({ title: "Referral link copied!", description: "Share it with friends to earn ₹50 each." });
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-8">

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-card to-card/40 border border-white/10 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          {activeUser?.profilePicture ? (
            <img src={activeUser.profilePicture} alt={activeUser.name ?? "User"}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/30 shadow-gold shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/30 shrink-0">
              <span className="text-3xl font-black text-primary">
                {(activeUser?.name || activeUser?.email || "U")[0].toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Welcome back, {activeUser?.name?.split(" ")[0] || "there"}!
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {activeUser?.email && <span className="text-sm text-muted-foreground">{activeUser.email}</span>}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20 capitalize">
                <Crown className="h-3 w-3" />{activeUser?.plan || "Free"} Plan
              </span>
              {renewalDue > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/20">
                  <Bell className="h-3 w-3" />{renewalDue} renewal{renewalDue > 1 ? "s" : ""} due
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setLocation("/documents")}
              className="bg-primary text-primary-foreground shadow-gold h-10 gap-2 font-semibold">
              <Plus className="h-4 w-4" />New Document
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { logout(); setLocation("/"); }}
              className="h-10 w-10 text-muted-foreground hover:text-white" title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <StatCard icon={FileText}    label="Total Docs"   value={documents?.length ?? 0}      color="blue" />
          <StatCard icon={CheckCircle2} label="Unlocked"     value={paidCount}                   color="green" />
          <StatCard icon={Clock}       label="Drafts"        value={draftCount}                  color="amber" />
          <StatCard icon={IndianRupee} label="Total Spent"   value={`₹${totalSpent.toLocaleString("en-IN")}`} color="primary" sub="incl. GST" />
          <StatCard icon={Bell}        label="Renewals Due"  value={renewalDue}                  color="purple" sub="agreements" />
        </div>

        {/* Referral banner */}
        <div className="bg-gradient-to-r from-primary/10 via-yellow-500/5 to-primary/5 border border-primary/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Refer friends — earn ₹50 per referral</h3>
              <p className="text-xs text-muted-foreground">
                Your code: <span className="text-primary font-mono font-bold">{activeUser?.referralCode ?? "—"}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyReferralLink}
              className="border-primary/30 text-primary hover:bg-primary/10 text-sm h-9">
              Copy Link
            </Button>
            <Button variant="ghost" onClick={() => {
              const text = encodeURIComponent(`Try Kanoox AI — India's AI legal document platform. Use my code ${activeUser?.referralCode ?? ""} for ₹50 off! kanooxai.in`);
              window.open(`https://wa.me/?text=${text}`, "_blank");
            }} className="text-green-400 hover:bg-green-500/10 h-9 px-3 text-sm border border-green-500/20">
              Share on WhatsApp
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-0">
          <div className="flex gap-1">
            {([["docs", FileText, "Documents"], ["payments", Receipt, "Payments"]] as const).map(([key, Icon, label]) => (
              <button key={key} onClick={() => setTab(key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                  tab === key
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-white"
                }`}>
                <Icon className="h-4 w-4" />{label}
                {key === "docs" && (documents?.length ?? 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                    {documents?.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {tab === "docs" && (
            <div className="flex items-center gap-1 pb-2">
              <button onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white"}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white"}`}>
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Documents tab */}
        {tab === "docs" && (
          <>
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search documents…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-card border-white/10 text-white h-10" />
              </div>
              <div className="flex gap-1 bg-card border border-white/10 rounded-xl p-1 h-10">
                {(["all", "paid", "draft"] as Filter[]).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 rounded-lg text-sm font-medium capitalize transition-all ${
                      filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents grid / list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredDocs.length ? (
              <EmptyDocsState hasAny={!!documents?.length} search={search}
                onClear={() => setSearch("")} onCreate={() => setLocation("/documents")} />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredDocs.map((doc: any) => (
                    <DocCard key={doc.id} doc={doc} viewMode="grid"
                      onDownload={handleDownload} onUnlock={handleUnlock}
                      downloading={downloading} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
                <AnimatePresence>
                  {filteredDocs.map((doc: any) => (
                    <DocCard key={doc.id} doc={doc} viewMode="list"
                      onDownload={handleDownload} onUnlock={handleUnlock}
                      downloading={downloading} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Payments tab */}
        {tab === "payments" && (
          <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
            {!(payments as any[])?.length ? (
              <div className="py-20 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-white font-medium">No payments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your transaction history will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background/50 border-b border-white/10">
                    <tr>
                      {["Order ID", "Date", "Amount", "Status", "Type"].map((h) => (
                        <th key={h} className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(payments as any[]).map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                          {(p.razorpayOrderId || `#${p.id}`).slice(-16)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap text-xs">
                          {format(new Date(p.createdAt), "d MMM yyyy, HH:mm")}
                        </td>
                        <td className="px-5 py-4 text-white font-bold">₹{Number(p.amount || 0).toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4">
                          {p.status === "paid"
                            ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">PAID</span>
                            : p.status === "pending"
                            ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">PENDING</span>
                            : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 capitalize">{p.status}</span>}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs capitalize">
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

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-6 mt-12 text-xs text-muted-foreground/50">
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5"/>SSL Encrypted</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5"/>NVIDIA AI</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5"/>DPDPA 2023</span>
        </div>
      </div>
    </div>
  );
}

function EmptyDocsState({
  hasAny, search, onClear, onCreate,
}: { hasAny: boolean; search: string; onClear: () => void; onCreate: () => void; }) {
  if (search) {
    return (
      <div className="py-20 text-center bg-card border border-white/10 rounded-2xl">
        <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-white font-medium">No documents match "{search}"</p>
        <button onClick={onClear} className="mt-3 text-sm text-primary hover:underline">Clear search</button>
      </div>
    );
  }
  return (
    <div className="py-20 text-center bg-card border border-white/10 rounded-2xl">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
        <FileText className="h-10 w-10 text-primary/60" />
      </div>
      <p className="text-white font-bold text-lg">{hasAny ? "No documents in this filter" : "No documents yet"}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs mx-auto">
        {hasAny ? "Try a different filter." : "Create your first AI-generated legal document in 60 seconds. Free to preview."}
      </p>
      {!hasAny && (
        <Button onClick={onCreate} className="bg-primary text-primary-foreground shadow-gold gap-2">
          <Sparkles className="h-4 w-4" />Browse Templates
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
