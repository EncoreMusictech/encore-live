import { useState } from "react";
import { NAMMOnePager } from "@/components/marketing/NAMMOnePager";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function NAMMPitchPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("namm-one-pager");
    if (!element) {
      toast.error("Could not find one-pager element");
      return;
    }

    setIsGenerating(true);
    toast.info("Generating PDF...");

    try {
      // Capture at high resolution for print quality
      const canvas = await html2canvas(element, {
        scale: 2, // 2x for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      // Calculate dimensions for 8.5x11 inch at 72 DPI (PDF standard)
      const imgWidth = 8.5;
      const imgHeight = 11;
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: [imgWidth, imgHeight]
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      
      pdf.save("ENCORE-NAMM-2026-OnePager.pdf");
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <NAMMOnePager 
      onDownloadPDF={handleDownloadPDF} 
      isGenerating={isGenerating} 
    />
  );
}
