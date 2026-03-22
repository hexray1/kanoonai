import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGenerateDocument } from "@workspace/api-client-react";
import { DOCUMENTS, FIELD_LABELS } from "@/lib/constants";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

export default function GenerateDocument() {
  const { type } = useParams<{ type: string }>();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const docConfig = DOCUMENTS[type as keyof typeof DOCUMENTS];
  const generateMutation = useGenerateDocument();
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  if (!docConfig) {
    return <div className="p-8 text-center text-white">Document type not found.</div>;
  }

  const onSubmit = async (data: any) => {
    try {
      const res = await generateMutation.mutateAsync({
        data: {
          type,
          formData: data,
          language: language as 'en'|'hi'
        }
      });
      toast({ title: "Success", description: "Document generated successfully!" });
      setLocation(`/documents/${res.id}/preview`);
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message || "Failed to generate via AI", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <Button variant="ghost" onClick={() => setLocation("/documents")} className="mb-8 text-muted-foreground hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to templates
        </Button>

        <div className="bg-card border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {language === 'en' ? docConfig.name : docConfig.nameHi}
              </h1>
              <p className="text-muted-foreground text-sm">
                Fill in the details. Our AI will craft the perfect legal document.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {docConfig.fields.map((fieldKey) => {
                const labelInfo = FIELD_LABELS[fieldKey] || { en: fieldKey.replace('_', ' '), hi: fieldKey, placeholder: '' };
                return (
                  <div key={fieldKey} className="space-y-2">
                    <Label htmlFor={fieldKey} className="text-white">
                      {language === 'en' ? labelInfo.en : labelInfo.hi}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id={fieldKey}
                      placeholder={labelInfo.placeholder}
                      className="bg-background border-white/10 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      {...register(fieldKey, { required: true })}
                    />
                    {errors[fieldKey] && <span className="text-xs text-red-500">This field is required</span>}
                  </div>
                );
              })}
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground hover:opacity-90 shadow-gold"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Generating with Claude AI...
                  </>
                ) : (
                  t("Generate Document", "दस्तावेज़ बनाएँ")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
