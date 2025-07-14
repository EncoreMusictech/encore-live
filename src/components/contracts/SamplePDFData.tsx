import { supabase } from "@/integrations/supabase/client";

export interface SamplePDFData {
  contractType: string;
  fileName: string;
  title: string;
  description: string;
  content: string;
}

export const samplePDFs: SamplePDFData[] = [
  {
    contractType: 'publishing',
    fileName: 'publishing-agreement-sample.pdf',
    title: 'Standard Publishing Agreement Sample',
    description: 'Complete sample of a music publishing agreement with standard 50/50 split',
    content: `MUSIC PUBLISHING AGREEMENT

This Publishing Agreement ("Agreement") is entered into on [DATE], between John Smith ("Songwriter") and Harmony Music Publishing ("Publisher").

RECITALS
WHEREAS, Songwriter is the creator and owner of certain musical compositions;
WHEREAS, Publisher desires to acquire rights to administer said compositions;

NOW, THEREFORE, the parties agree as follows:

1. GRANT OF RIGHTS
Songwriter hereby grants to Publisher the exclusive right to administer, license, collect royalties, and generally exploit the musical compositions listed in Schedule A ("Compositions") throughout the Territory during the Term.

2. TERRITORY AND TERM
Territory: Worldwide
Term: Five (5) years from the date hereof, with automatic renewal for additional one (1) year periods unless terminated by either party with ninety (90) days written notice.

3. ROYALTY SPLITS AND PAYMENT
Net receipts from the exploitation of Compositions shall be divided as follows:
- Songwriter: Fifty percent (50%)
- Publisher: Fifty percent (50%)

Publisher shall pay Songwriter within sixty (60) days after the end of each calendar quarter.

4. ADMINISTRATIVE PROVISIONS
Publisher agrees to:
- Register compositions with performing rights organizations
- License compositions for mechanical, synchronization, and other uses
- Pursue infringement claims and unauthorized uses
- Provide quarterly royalty statements

5. REVERSION CLAUSE
If any Composition fails to generate at least $500 in gross receipts during any consecutive 24-month period after the second anniversary of this Agreement, Songwriter may request reversion of that Composition's rights.

6. TERMINATION CONDITIONS
This Agreement may be terminated:
- By mutual written consent
- By either party for material breach with 30 days cure period
- Automatically upon Songwriter's death or Publisher's bankruptcy

IN WITNESS WHEREOF, the parties have executed this Agreement.

_______________________          _______________________
John Smith, Songwriter           Harmony Music Publishing

Date: _______________           Date: _______________

SCHEDULE A - COMPOSITIONS
1. "Midnight Dreams" (2024)
2. "City Lights" (2024)
3. "Forever Young" (2023)`
  },
  {
    contractType: 'artist',
    fileName: 'artist-agreement-sample.pdf',
    title: 'Independent Artist Recording Agreement Sample',
    description: 'Sample recording deal for independent artists with advance and royalty structure',
    content: `ARTIST RECORDING AGREEMENT

This Recording Agreement ("Agreement") is entered into on [DATE], between Sarah Johnson ("Artist") and Indie Records LLC ("Label").

RECITALS
WHEREAS, Artist is a professional recording artist;
WHEREAS, Label desires to produce and distribute Artist's recordings;

NOW, THEREFORE, the parties agree as follows:

1. RECORDING COMMITMENT
Artist agrees to deliver one (1) full-length album consisting of no fewer than ten (10) tracks, with a minimum playing time of thirty-five (35) minutes.

Recording shall commence no later than [START DATE] and be completed by [END DATE].

2. ADVANCE AND RECOUPMENT
Label shall pay Artist an advance of Twenty-Five Thousand Dollars ($25,000) upon execution of this Agreement.

The advance shall be recoupable from Artist's royalty earnings under this Agreement.

3. ROYALTY STRUCTURE
Artist shall receive eighteen percent (18%) of net receipts from:
- Digital streaming and downloads
- Physical sales
- Licensing and synchronization
- Merchandise sales (where applicable)

Net receipts are defined as gross receipts less:
- Distribution fees (maximum 30%)
- Manufacturing costs
- Returns and allowances

4. MARKETING AND PROMOTION
Label agrees to spend a minimum of Fifteen Thousand Dollars ($15,000) on marketing and promotion for the Album, including:
- Radio promotion
- Digital marketing campaigns
- Press and publicity
- Tour support (up to $5,000)

5. MASTER OWNERSHIP
Label shall own the master recordings created under this Agreement. Artist retains ownership of underlying musical compositions (publishing rights).

6. DISTRIBUTION RIGHTS
Label has exclusive rights to distribute recordings through all channels including:
- Digital streaming platforms
- Physical retail and online stores
- Licensing for film, TV, and advertising

7. TERM AND OPTIONS
Initial term covers one (1) album. Label has option to extend for one (1) additional album upon same terms, to be exercised within six (6) months of initial album release.

IN WITNESS WHEREOF, the parties have executed this Agreement.

_______________________          _______________________
Sarah Johnson, Artist            Indie Records LLC

Date: _______________           Date: _______________`
  },
  {
    contractType: 'producer',
    fileName: 'producer-agreement-sample.pdf',
    title: 'Producer Agreement with Points Sample',
    description: 'Producer agreement including upfront fee and backend points structure',
    content: `PRODUCER AGREEMENT

This Producer Agreement ("Agreement") is entered into on [DATE], between Mike "Beats" Wilson ("Producer") and Taylor Swift ("Artist").

RECITALS
WHEREAS, Producer is a professional music producer;
WHEREAS, Artist desires Producer's services for recording sessions;

NOW, THEREFORE, the parties agree as follows:

1. PRODUCER SERVICES
Producer agrees to produce up to five (5) musical recordings for Artist as specified in Schedule A.

Services include:
- Creating musical arrangements and beats
- Recording session supervision
- Mixing and editing services
- Consultation on song selection and arrangement

2. COMPENSATION STRUCTURE
Producer Fee: Three Thousand Dollars ($3,000) per track, payable upon completion of each master recording.

Producer Points: Three percent (3%) of net receipts from the sale and exploitation of the recordings.

3. PRODUCER POINTS CALCULATION
Producer points shall be calculated on net receipts, defined as gross receipts less:
- Distribution and manufacturing costs
- Returns and exchanges
- Marketing expenses (maximum 20% of gross)

Payments shall be made quarterly within sixty (60) days after each quarter end.

4. CREDIT REQUIREMENTS
Producer shall receive appropriate credit on all recordings, packaging, and promotional materials as:
"Produced by Mike 'Beats' Wilson"

Credit shall be in the same size and prominence as other production credits.

5. SAMPLE CLEARANCES
Producer warrants that all samples and interpolations are either:
- Owned by Producer
- Properly cleared and licensed
- Original compositions

Producer shall provide documentation of all clearances prior to delivery.

6. DELIVERY REQUIREMENTS
Producer shall deliver:
- Mixed stereo masters
- Separated track stems
- MIDI files and session data
- Sample clearance documentation

All deliverables in professional broadcast quality.

7. WORK FOR HIRE
All production work shall be considered "work for hire" under copyright law. Artist shall own master recordings, subject to Producer's points and credit requirements.

IN WITNESS WHEREOF, the parties have executed this Agreement.

_______________________          _______________________
Mike "Beats" Wilson              Taylor Swift
Producer                         Artist

Date: _______________           Date: _______________

SCHEDULE A - RECORDINGS
1. "Electric Nights"
2. "Summer Groove"
3. "City Dreams"
4. "Midnight Hour"
5. "Golden Hour"`
  },
  {
    contractType: 'sync',
    fileName: 'sync-license-sample.pdf',
    title: 'TV Synchronization License Sample',
    description: 'Synchronization license for television show with standard terms',
    content: `SYNCHRONIZATION LICENSE AGREEMENT

This Synchronization License ("License") is granted on [DATE] by Moonlight Music Publishing ("Licensor") to Netflix Productions ("Licensee").

COMPOSITION DETAILS
Title: "Midnight Serenade"
Writer(s): Emma Rodriguez
Publisher: Moonlight Music Publishing
Duration: 3:45

TELEVISION PRODUCTION DETAILS
Program Title: "City Stories"
Episode: Season 2, Episode 8 "The Night Shift"
Network/Platform: Netflix
Anticipated Air Date: March 15, 2024

GRANT OF RIGHTS
Licensor grants Licensee the non-exclusive right to:
- Synchronize the Composition with visual images
- Record, reproduce, and distribute the synchronized version
- Perform the synchronized version as part of the Program

USAGE SPECIFICATIONS
Scene Description: Background music during romantic dinner scene
Duration of Use: Approximately 90 seconds
Vocal/Instrumental: Instrumental version only

LICENSE FEE AND PAYMENT
One-time License Fee: Eight Thousand Dollars ($8,000)
Payment Terms: Net 30 days from execution

TERRITORY AND TERM
Territory: Worldwide
Initial Term: Three (3) years from first broadcast
Renewal Options: Two (2) additional one-year terms at 50% of original fee

USAGE RESTRICTIONS
1. Use limited to the specified Program and episode only
2. No right to alter, edit, or modify the Composition beyond synchronization
3. No right to use Composition in trailers, promos, or marketing materials
4. No right to release soundtrack or commercial recordings

CREDIT REQUIREMENTS
Licensee shall provide end credit as follows:
"'Midnight Serenade' written by Emma Rodriguez, published by Moonlight Music Publishing"

CUE SHEET OBLIGATIONS
Licensee agrees to:
- File cue sheets with applicable performing rights organizations
- Provide copies of cue sheets to Licensor within 30 days of broadcast
- Include accurate timing and usage information

REPRESENTATIONS AND WARRANTIES
Licensor represents that:
- It has full right and authority to grant this license
- The Composition is original or properly cleared
- This license will not violate any third-party rights

ADDITIONAL CLEARANCES
This license covers only the musical composition. Licensee is responsible for obtaining separate master recording license from record label.

GOVERNING LAW
This Agreement shall be governed by the laws of California.

IN WITNESS WHEREOF, the parties have executed this License.

_______________________          _______________________
Moonlight Music Publishing       Netflix Productions
Licensor                        Licensee

Date: _______________           Date: _______________`
  },
  {
    contractType: 'distribution',
    fileName: 'distribution-agreement-sample.pdf',
    title: 'Digital Distribution Agreement Sample',
    description: 'Independent artist distribution deal for digital platforms',
    content: `DISTRIBUTION AGREEMENT

This Distribution Agreement ("Agreement") is entered into on [DATE], between Alex Chen ("Artist") and Global Digital Distribution ("Distributor").

RECITALS
WHEREAS, Artist owns master recordings and desires digital distribution;
WHEREAS, Distributor operates digital distribution services;

NOW, THEREFORE, the parties agree as follows:

1. DISTRIBUTION SERVICES
Distributor agrees to distribute Artist's recordings to digital streaming platforms and download services including but not limited to:
- Spotify, Apple Music, Amazon Music
- YouTube Music, Pandora, Tidal
- iTunes Store, Amazon Digital, Google Play
- TikTok, Instagram, Facebook

2. REVENUE SHARE
Net receipts shall be divided as follows:
- Artist: Eighty-five percent (85%)
- Distributor: Fifteen percent (15%)

Net receipts defined as gross receipts from platforms less platform fees and taxes.

3. PLATFORM COVERAGE
Core Platforms (guaranteed): 100+ digital service providers
Emerging Platforms: Added at Distributor's discretion
Geographic Coverage: Worldwide (where platforms operate)

4. REPORTING AND PAYMENTS
Monthly Reports: Detailed sales and streaming data
Payment Schedule: Monthly, within 45 days of month-end
Minimum Payment Threshold: $25 for check, $1 for direct deposit

5. METADATA MANAGEMENT
Distributor provides:
- Metadata management and delivery
- ISRC code generation and registration
- Album artwork processing and delivery
- Genre and mood tagging

6. MARKETING SUPPORT
Included services:
- Playlist pitching to editorial teams
- New release featuring (when applicable)
- Basic promotional asset creation
- Social media scheduling tools

7. ARTIST RESPONSIBILITIES
Artist shall:
- Deliver properly formatted audio files
- Provide accurate metadata and artwork
- Warrant ownership of all content
- Notify Distributor of any copyright claims

8. CONTENT REQUIREMENTS
Audio Format: WAV or FLAC, minimum 44.1kHz/16-bit
Artwork: 3000x3000 pixels minimum, RGB colorspace
Metadata: Complete track information, credits, and ISRC codes

9. TERM AND TERMINATION
Initial Term: Two (2) years from first release
Auto-renewal: Annual terms unless terminated with 90 days notice
Post-termination: Content remains live for 30 days for transition

10. RIGHTS AND RESTRICTIONS
Artist retains: Master recording ownership and publishing rights
Distributor restrictions: No exclusive territories or limiting Artist's other activities

11. ACCOUNTING AND AUDITS
Artist may audit Distributor's records annually with 60 days written notice.

IN WITNESS WHEREOF, the parties have executed this Agreement.

_______________________          _______________________
Alex Chen, Artist               Global Digital Distribution

Date: _______________           Date: _______________

RELEASE SCHEDULE
Initial Releases:
1. "Digital Dreams" EP (4 tracks) - Release Date: TBD
2. "New Horizons" Single - Release Date: TBD
3. "Urban Nights" Album (12 tracks) - Release Date: TBD`
  }
];

export async function generatePDFContent(contractType: string): Promise<string> {
  const sampleData = samplePDFs.find(pdf => pdf.contractType === contractType);
  return sampleData?.content || '';
}

export async function downloadSamplePDF(contractType: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: {
        action: 'generateSample',
        contractType,
        content: await generatePDFContent(contractType)
      }
    });

    if (error) throw error;

    // Create download link
    const sampleData = samplePDFs.find(pdf => pdf.contractType === contractType);
    const fileName = sampleData?.fileName || `${contractType}-agreement-sample.pdf`;
    
    // For now, create a simple text file as a placeholder
    // In production, you'd generate an actual PDF
    const blob = new Blob([data.content || sampleData?.content || ''], { 
      type: 'application/pdf' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    // Fallback: download as text file
    const sampleData = samplePDFs.find(pdf => pdf.contractType === contractType);
    if (sampleData) {
      const blob = new Blob([sampleData.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = sampleData.fileName.replace('.pdf', '.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }
}