import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TemplatePreviewProps {
  contractType: string;
}

export function TemplatePreview({ contractType }: TemplatePreviewProps) {
  const getTemplateContent = (type: string) => {
    switch (type) {
      case 'publishing':
        return {
          title: "Publishing Agreement Template",
          description: "Standard music publishing agreement with songwriter and publisher splits",
          keyTerms: [
            "50/50 split between songwriter and publisher",
            "Administrative fees: 15-20%",
            "Term: 3-5 years with option to extend",
            "Territory: Worldwide",
            "Mechanical royalties included",
            "Performance royalties collected through PRO"
          ],
          sections: [
            "Grant of Rights",
            "Territory and Term", 
            "Royalty Splits and Payment",
            "Administrative Provisions",
            "Reversion Clause",
            "Termination Conditions"
          ],
          sampleText: `PUBLISHING AGREEMENT

This Publishing Agreement ("Agreement") is entered into between [SONGWRITER NAME] ("Songwriter") and [PUBLISHER NAME] ("Publisher").

GRANT OF RIGHTS: Songwriter hereby grants to Publisher the exclusive right to administer, license, and collect royalties for the musical compositions listed in Schedule A.

ROYALTY SPLITS: Net receipts shall be divided as follows:
- Songwriter: 50%
- Publisher: 50%

TERM: This agreement shall commence on [START DATE] and continue for a period of [TERM LENGTH] years...`
        };

      case 'artist':
        return {
          title: "Artist Agreement Template", 
          description: "Recording and distribution agreement for independent artists",
          keyTerms: [
            "Advance: $10,000 - $50,000",
            "Royalty rate: 15-20% of net receipts",
            "Album commitment: 1-2 albums",
            "Marketing support included",
            "Recoupment from artist royalties",
            "360 deal options available"
          ],
          sections: [
            "Recording Commitment",
            "Advance and Recoupment",
            "Royalty Structure", 
            "Marketing and Promotion",
            "Master Ownership",
            "Distribution Rights"
          ],
          sampleText: `ARTIST RECORDING AGREEMENT

This Recording Agreement ("Agreement") is between [ARTIST NAME] ("Artist") and [LABEL NAME] ("Label").

RECORDING COMMITMENT: Artist agrees to deliver one (1) full-length album consisting of no less than 10 tracks.

ADVANCE: Label shall pay Artist an advance of $[AMOUNT] upon execution of this agreement.

ROYALTIES: Artist shall receive [PERCENTAGE]% of net receipts from the sale and exploitation of recordings...`
        };

      case 'producer':
        return {
          title: "Producer Agreement Template",
          description: "Beat purchase and production agreement with royalty points",
          keyTerms: [
            "Producer fee: $500 - $5,000",
            "Producer points: 2-4% of net receipts", 
            "Master recording credits required",
            "Publishing split: 0-50%",
            "Exclusive or non-exclusive options",
            "Sample clearance responsibilities"
          ],
          sections: [
            "Producer Services",
            "Compensation Structure",
            "Producer Points", 
            "Credit Requirements",
            "Sample Clearances",
            "Delivery Requirements"
          ],
          sampleText: `PRODUCER AGREEMENT

This Producer Agreement ("Agreement") is between [PRODUCER NAME] ("Producer") and [ARTIST NAME] ("Artist").

PRODUCER SERVICES: Producer agrees to produce musical recordings for Artist as specified in Schedule A.

COMPENSATION: 
- Producer Fee: $[AMOUNT] per track
- Producer Points: [PERCENTAGE]% of net receipts

CREDITS: Producer shall receive appropriate credit on all recordings and related materials...`
        };

      case 'sync':
        return {
          title: "Sync License Template",
          description: "Synchronization license for TV, film, and digital media",
          keyTerms: [
            "License fee: $1,000 - $25,000",
            "Territory: Specified regions",
            "Term: Limited time period",
            "Usage restrictions included",
            "Master and publishing clearance",
            "Cue sheet reporting required"
          ],
          sections: [
            "Grant of Synchronization Rights",
            "License Fee and Payment",
            "Territory and Term",
            "Usage Restrictions",
            "Credit Requirements", 
            "Cue Sheet Obligations"
          ],
          sampleText: `SYNCHRONIZATION LICENSE AGREEMENT

This Synchronization License ("License") is granted by [LICENSOR NAME] ("Licensor") to [LICENSEE NAME] ("Licensee").

GRANT: Licensor grants Licensee the non-exclusive right to synchronize the musical composition "[SONG TITLE]" with visual images.

LICENSE FEE: Licensee shall pay a one-time fee of $[AMOUNT] for the rights granted herein.

TERRITORY: [TERRITORY DESCRIPTION]
TERM: [TIME PERIOD]...`
        };

      case 'distribution':
        return {
          title: "Distribution Agreement Template", 
          description: "Digital and physical distribution agreement for independent artists",
          keyTerms: [
            "Distribution fee: 10-30%",
            "Digital platform coverage",
            "Physical distribution options",
            "Metadata management included",
            "Royalty reporting monthly/quarterly",
            "Minimum term requirements"
          ],
          sections: [
            "Distribution Services",
            "Revenue Share",
            "Platform Coverage",
            "Reporting and Payments",
            "Marketing Support",
            "Term and Termination"
          ],
          sampleText: `DISTRIBUTION AGREEMENT

This Distribution Agreement ("Agreement") is between [ARTIST NAME] ("Artist") and [DISTRIBUTOR NAME] ("Distributor").

DISTRIBUTION SERVICES: Distributor agrees to distribute Artist's recordings to digital streaming platforms and retail outlets.

REVENUE SHARE: 
- Artist: [PERCENTAGE]%
- Distributor: [PERCENTAGE]%

PLATFORMS: Distribution includes but is not limited to Spotify, Apple Music, Amazon Music, YouTube Music...`
        };

      default:
        return {
          title: "Contract Template",
          description: "Standard contract template",
          keyTerms: [],
          sections: [],
          sampleText: ""
        };
    }
  };

  const template = getTemplateContent(contractType);

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold mb-2">{template.title}</h3>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      {/* Key Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Terms</CardTitle>
          <CardDescription>Standard terms included in this template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {template.keyTerms.map((term, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{term}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contract Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contract Sections</CardTitle>
          <CardDescription>Main sections covered in this agreement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-2">
            {template.sections.map((section, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{section}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sample Contract Text</CardTitle>
          <CardDescription>Preview of actual contract language</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg">
            <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
              {template.sampleText}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">📝</Badge>
            <div>
              <p className="font-medium">Customization Required</p>
              <p className="text-sm text-muted-foreground">
                All bracketed fields [LIKE THIS] must be filled in with specific details
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">⚖️</Badge>
            <div>
              <p className="font-medium">Legal Review Recommended</p>
              <p className="text-sm text-muted-foreground">
                Have an entertainment lawyer review before finalizing any agreement
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">🏢</Badge>
            <div>
              <p className="font-medium">Industry Standard</p>
              <p className="text-sm text-muted-foreground">
                Based on current industry practices and standard deal structures
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}