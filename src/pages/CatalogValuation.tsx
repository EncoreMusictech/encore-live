import Header from "@/components/Header";
import CatalogValuation from "@/components/CatalogValuation";

const CatalogValuationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Catalog Valuation
            </h1>
            <p className="text-muted-foreground">
              Discover the estimated value of any artist's music catalog using real streaming data from Spotify.
            </p>
          </div>
          <CatalogValuation />
        </div>
      </div>
    </div>
  );
};

export default CatalogValuationPage;