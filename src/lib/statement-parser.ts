import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedStatement {
  headers: string[];
  data: Record<string, any>[];
  detectedSource: string;
  confidence: number;
}

export interface SourceDetectionRule {
  source: string;
  headerPatterns: string[];
  requiredFields: string[];
  confidence: number;
}

// Default source detection rules
export const DEFAULT_SOURCE_RULES: SourceDetectionRule[] = [
  {
    source: 'BMI',
    headerPatterns: ['Work Title', 'IP Name', 'Current Quarter Royalties', 'Work ID'],
    requiredFields: ['Work Title', 'IP Name'],
    confidence: 0.8,
  },
  {
    source: 'ASCAP',
    headerPatterns: ['Title', 'Writer Name', 'Amount Paid', 'Survey'],
    requiredFields: ['Title', 'Writer Name'],
    confidence: 0.8,
  },
  {
    source: 'YouTube',
    headerPatterns: ['Asset Title', 'Channel Name', 'Earnings', 'Video Title'],
    requiredFields: ['Asset Title', 'Channel Name'],
    confidence: 0.8,
  },
  {
    source: 'SoundExchange',
    headerPatterns: ['Sound Recording Title', 'Featured Artist', 'Royalty', 'Album Title'],
    requiredFields: ['Sound Recording Title', 'Featured Artist'],
    confidence: 0.8,
  },
];

export class StatementParser {
  private sourceRules: SourceDetectionRule[];

  constructor(customRules?: SourceDetectionRule[]) {
    this.sourceRules = customRules || DEFAULT_SOURCE_RULES;
  }

  async parseFile(file: File): Promise<ParsedStatement> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let data: any[][] = [];

    try {
      if (fileExtension === 'csv') {
        data = await this.parseCSV(file);
      } else if (['xls', 'xlsx'].includes(fileExtension || '')) {
        data = await this.parseExcel(file);
      } else {
        throw new Error('Unsupported file format');
      }

      if (data.length === 0) {
        throw new Error('File appears to be empty');
      }

      const headers = data[0];
      const rows = data.slice(1);

      // Convert to objects
      const parsedData = rows
        .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
        .map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, index) => {
            if (header) {
              obj[header] = row[index] || null;
            }
          });
          return obj;
        });

      const detectedSource = this.detectSource(headers);

      return {
        headers,
        data: parsedData,
        detectedSource: detectedSource.source,
        confidence: detectedSource.confidence,
      };
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseCSV(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve(results.data as any[][]);
        },
        error: (error) => {
          reject(error);
        },
        skipEmptyLines: true,
      });
    });
  }

  private async parseExcel(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null 
          }) as any[][];
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private detectSource(headers: string[]): { source: string; confidence: number } {
    let bestMatch = { source: 'Unknown', confidence: 0 };

    for (const rule of this.sourceRules) {
      let matchScore = 0;
      let totalPatterns = rule.headerPatterns.length;

      // Check how many patterns match
      for (const pattern of rule.headerPatterns) {
        if (headers.some(header => 
          header?.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(header?.toLowerCase() || '')
        )) {
          matchScore++;
        }
      }

      // Check required fields
      const requiredFieldsFound = rule.requiredFields.every(required =>
        headers.some(header => 
          header?.toLowerCase().includes(required.toLowerCase()) ||
          required.toLowerCase().includes(header?.toLowerCase() || '')
        )
      );

      if (requiredFieldsFound && matchScore > 0) {
        const confidence = (matchScore / totalPatterns) * rule.confidence;
        if (confidence > bestMatch.confidence) {
          bestMatch = { source: rule.source, confidence };
        }
      }
    }

    return bestMatch;
  }

  updateSourceRules(rules: SourceDetectionRule[]) {
    this.sourceRules = rules;
  }
}