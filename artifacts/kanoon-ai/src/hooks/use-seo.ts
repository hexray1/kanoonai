import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description?: string;
}

const DEFAULT_DESCRIPTION =
  "Create lawyer-reviewed Indian legal documents in 60 seconds with AI. Rental agreements, affidavits, NDAs, wills, FIRs, RTI, legal notices in 5 languages. Trusted by 12,000+ Indians. Rated 4.9★.";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeo({ title, description }: SeoOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const desc = description ?? DEFAULT_DESCRIPTION;
    setMeta("description", desc);
    setMeta("og:title", title, "property");
    setMeta("og:description", desc, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);
    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}
