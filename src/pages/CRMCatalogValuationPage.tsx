import CatalogValuation from "@/components/CatalogValuation";
import { updatePageMetadata } from "@/utils/seo";
import { useEffect } from "react";

export default function CRMCatalogValuationPage() {
  useEffect(() => {
    updatePageMetadata('catalog-valuation');
  }, []);

  return <CatalogValuation />;
}