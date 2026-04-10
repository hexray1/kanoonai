import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Download, Share2, CheckCircle, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetDocument } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function DownloadDocument() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: doc, isLoading } = useGetDocument(Number(id));
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doc || !doc.paid) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <p className="text-white mb-4">Document not found or payment required.</p>
        <Button onClick={() => setLocation("/dashboard")} variant="outline">Go to Dashboard</Button>
      </div>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE}/api/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Download started!", description: "Your PDF is downloading." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out my legal document (${doc.title}) generated via KanoonAI — India's AI Legal Document Platform. Try it at kanoonai.in`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">
          Your document is ready to download.
        </p>

        <div className="bg-background border border-white/5 rounded-xl p-4 flex items-center gap-4 mb-8 text-left">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="font-medium text-white truncate">{doc.title}.pdf</h4>
            <span className="text-xs text-muted-foreground">A4 · Print Ready · KanoonAI Legal Format</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {downloading ? (
              <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Preparing PDF...</>
            ) : (
              <><Download className="mr-2 h-5 w-5" /> Download PDF</>
            )}
          </Button>
          <Button
            onClick={handleWhatsAppShare}
            variant="outline"
            className="w-full h-12 border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            <Share2 className="mr-2 h-5 w-5" /> Share via WhatsApp
          </Button>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="ghost"
            className="w-full h-12 text-muted-foreground hover:text-white"
          >
            Go to Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          You can re-download this document anytime from your Dashboard.
        </p>
      </div>
    </div>
  );
}
