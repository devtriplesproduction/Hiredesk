"use client";

import React, { useEffect, useRef, useState } from "react";
import { generateDocument, DocumentData } from "./documentGenerator";
import { getBrandAssetUrl } from "@/lib/supabase";

interface DocumentPreviewProps {
  documentType: string;
  data: DocumentData;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentType, data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png");

  useEffect(() => {
    async function fetchAssets() {
      try {
        const logo = await getBrandAssetUrl("tsp_logo");
        if (logo) setLogoUrl(logo);
      } catch (e) {
        console.error("Failed to load logo", e);
      }
    }
    fetchAssets();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const activeLogo = logoUrl || "/logo.png";
      const html = generateDocument(
        documentType,
        data,
        activeLogo,
        activeLogo,
        activeLogo
      );
      containerRef.current.innerHTML = html;
    }
  }, [documentType, data, logoUrl]);

  return (
    <div className="document-studio-wrapper">
      <div id="previewWrap" className="preview" ref={containerRef}></div>
    </div>
  );
};
