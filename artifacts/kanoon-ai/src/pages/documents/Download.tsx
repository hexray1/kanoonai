import { useParams, useLocation } from "wouter";
import { Download, Share2, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetDocument } from "@workspace/api-client-react";
// Dynamic import or assumed global for html2pdf if we were to generate on client, 
// but API should provide pdfUrl or we render it. Let's just mock download.

export default function DownloadDocument() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: doc, isLoading } = useGetDocument(Number(id));

  if (isLoading) return <div className="min-h-screen bg-background flex justify-center items-center"><div className="animate-pulse text-primary">Loading...</div></div>;
  if (!doc || !doc.paid) return <div className="p-8 text-white">Unauthorized</div>;

  const handleDownload = () => {
    // In reality, hit the download endpoint or open pdfUrl
    if (doc.pdfUrl) {
      window.open(doc.pdfUrl, '_blank');
    } else {
      alert("PDF generation is processed on backend. Downloading...");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Here is my legal document (${doc.title}) generated via KanoonAI. Download link: ${window.location.origin}/share/${doc.id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
        
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">Your document "{doc.title}" is ready.</p>
        
        <div className="bg-background border border-white/5 rounded-xl p-4 flex items-center gap-4 mb-8 text-left">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="font-medium text-white truncate">{doc.title}.pdf</h4>
            <span className="text-xs text-muted-foreground">A4 • Print Ready • Legal Format</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button onClick={handleDownload} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="mr-2 h-5 w-5" /> Download PDF
          </Button>
          <Button onClick={handleWhatsAppShare} variant="outline" className="w-full h-12 border-green-500/30 text-green-400 hover:bg-green-500/10">
            <Share2 className="mr-2 h-5 w-5" /> Share via WhatsApp
          </Button>
          <Button onClick={() => setLocation("/dashboard")} variant="ghost" className="w-full h-12 text-muted-foreground hover:text-white mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
