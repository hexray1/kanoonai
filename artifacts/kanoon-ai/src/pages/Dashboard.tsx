import { useLocation } from "wouter";
import { format } from "date-fns";
import { FileText, Download, Edit3, Crown, Plus, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListDocuments, useGetMe } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const { data: documents, isLoading } = useListDocuments();
  const { data: me } = useGetMe();

  const activeUser = me || user;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
            <p className="text-muted-foreground">Manage your documents and subscription.</p>
          </div>
          <Button onClick={() => setLocation("/documents")} className="bg-primary text-primary-foreground shadow-gold">
            <Plus className="mr-2 h-4 w-4" /> Create New Document
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full"><FileText className="h-6 w-6 text-primary"/></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold text-white">{documents?.length || 0}</p>
            </div>
          </div>
          <div className="bg-card border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-4 bg-yellow-500/10 rounded-full"><Crown className="h-6 w-6 text-yellow-500"/></div>
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-2xl font-bold text-white capitalize">{activeUser?.plan || 'Free'}</p>
            </div>
          </div>
          <div className="bg-card border border-primary/20 bg-primary/5 rounded-2xl p-6 flex flex-col justify-center">
            <p className="text-sm text-primary mb-1 font-medium">Refer & Earn ₹50</p>
            <p className="text-xs text-muted-foreground mb-3">Share link with friends to earn credits.</p>
            <Button variant="outline" size="sm" className="w-full border-primary/30 text-primary hover:bg-primary/10">Copy Link</Button>
          </div>
        </div>

        {/* Documents Table */}
        <h2 className="text-xl font-bold text-white mb-6">Recent Documents</h2>
        <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading documents...</div>
          ) : !documents?.length ? (
            <div className="p-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-white font-medium">No documents yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Create your first legal document in 60 seconds.</p>
              <Button onClick={() => setLocation("/documents")} variant="outline">Browse Templates</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Document Name</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{doc.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        {doc.paid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Paid & Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            <Clock className="h-3 w-3" /> Draft (Unpaid)
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
                            <Edit3 className="h-4 w-4 mr-2" /> Complete
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
      </div>
    </div>
  );
}
