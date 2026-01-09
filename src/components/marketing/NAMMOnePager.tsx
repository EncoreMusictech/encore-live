import { 
  DollarSign, 
  Copyright, 
  FileText, 
  Film, 
  TrendingUp, 
  Users,
  Music,
  Building2,
  Briefcase,
  BarChart3,
  Disc3,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NAMMOnePagerProps {
  onDownloadPDF: () => void;
  isGenerating: boolean;
}

const modules = [
  {
    icon: DollarSign,
    title: "Royalties",
    price: "$199/mo",
    benefit: "End-to-end processing from import to payout"
  },
  {
    icon: Copyright,
    title: "Copyright",
    price: "$99/mo",
    benefit: "Register, track, and export CWR"
  },
  {
    icon: FileText,
    title: "Contracts",
    price: "$59/mo",
    benefit: "Templates, AI extraction, alerts"
  },
  {
    icon: Film,
    title: "Sync Licensing",
    price: "$149/mo",
    benefit: "Pitch tracking to deal memos"
  },
  {
    icon: TrendingUp,
    title: "Valuation",
    price: "$99/mo",
    benefit: "AI-powered DCF & deal simulation"
  },
  {
    icon: Users,
    title: "Client Portal",
    price: "$149/mo",
    benefit: "Secure access to earnings"
  }
];

const bundles = [
  { name: "Starter Creator", price: "$79", modules: "Copyright + Contracts" },
  { name: "Essentials", price: "$149", modules: "Copyright + Contracts + Valuation" },
  { name: "Publishing Pro", price: "$299", modules: "Royalties + Copyright + Contracts" },
  { name: "Enterprise", price: "$849", modules: "All Modules + API + Support" }
];

const audiences = [
  { icon: Music, label: "Songwriters" },
  { icon: Building2, label: "Publishers" },
  { icon: Briefcase, label: "Managers" },
  { icon: BarChart3, label: "Investors" },
  { icon: Disc3, label: "Labels" }
];

export function NAMMOnePager({ onDownloadPDF, isGenerating }: NAMMOnePagerProps) {
  return (
    <div className="min-h-screen bg-background p-4 print:p-0">
      {/* Download Button - Hidden in Print */}
      <div className="print:hidden mb-4 flex justify-center">
        <Button 
          onClick={onDownloadPDF} 
          disabled={isGenerating}
          size="lg"
          className="gap-2"
        >
          <Download className="h-5 w-5" />
          {isGenerating ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>

      {/* Printable One-Pager */}
      <div 
        id="namm-one-pager"
        className="mx-auto bg-white text-gray-900 shadow-2xl print:shadow-none"
        style={{ 
          width: '8.5in', 
          minHeight: '11in',
          padding: '0.5in',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-600">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              ENCORE
            </h1>
            <p className="text-lg text-blue-600 font-medium mt-1">
              Rights Management System
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">
              <span className="text-sm font-bold">NAMM 2026</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">encoremusic.tech</p>
          </div>
        </div>

        {/* Elevator Pitch */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-100">
          <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-2">
            The Shopify of Music IP Management
          </h2>
          <p className="text-gray-700 leading-relaxed">
            ENCORE is an all-in-one music rights management platform that handles everything from 
            copyright registration to royalty processing. Whether you're an indie songwriter tracking 
            splits, a publisher processing statements, or an investor evaluating catalog acquisitions — 
            ENCORE gives you professional-grade tools without enterprise-level complexity or cost.
          </p>
        </div>

        {/* Module Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            Modular Solutions
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {modules.map((module) => (
              <div 
                key={module.title}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <module.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{module.title}</h4>
                    <span className="text-xs text-blue-600 font-semibold">{module.price}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-snug">{module.benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bundled Plans */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            Bundled Plans — Save 25%+
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {bundles.map((bundle, idx) => (
              <div 
                key={bundle.name}
                className={`rounded-lg p-3 text-center ${
                  idx === 3 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className={`text-xl font-bold ${idx === 3 ? 'text-white' : 'text-blue-600'}`}>
                  {bundle.price}
                </div>
                <div className={`font-semibold text-sm ${idx === 3 ? 'text-blue-100' : 'text-gray-900'}`}>
                  {bundle.name}
                </div>
                <div className={`text-xs mt-1 ${idx === 3 ? 'text-blue-200' : 'text-gray-500'}`}>
                  {bundle.modules}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Why ENCORE?</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                No enterprise contracts required
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Start with one module, scale as you grow
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Industry-standard CWR/DDEX exports
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                AI-powered contract parsing & valuations
              </li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Perfect For</h4>
            <div className="flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <div 
                  key={audience.label}
                  className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 border border-gray-200"
                >
                  <audience.icon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs text-gray-700 font-medium">{audience.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="bg-blue-600 rounded-xl p-5 flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-xl font-bold">Start Your Free Trial Today</h3>
            <p className="text-blue-100 text-sm mt-1">
              No credit card required • 14-day full access • Cancel anytime
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-2 mb-2">
              {/* QR Code placeholder - simple visual representation */}
              <div className="w-16 h-16 bg-gray-900 rounded grid grid-cols-4 gap-0.5 p-1">
                {[...Array(16)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-sm ${
                      [0, 2, 3, 5, 8, 10, 11, 13, 14, 15].includes(i) 
                        ? 'bg-white' 
                        : 'bg-gray-900'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-blue-100 font-medium">Scan to Sign Up</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>© 2026 ENCORE Rights Management System</span>
          <span className="font-medium text-blue-600">encoremusic.tech</span>
        </div>
      </div>
    </div>
  );
}
