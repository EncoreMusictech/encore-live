import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Territory lookup map
const TERRITORY_LOOKUP: Record<string, string> = {
  'AD': 'AD', 'ANDORRA': 'AD',
  'AE': 'AE', 'UNITED ARAB EMIRATES': 'AE',
  'AF': 'AF',
  'AG': 'AG',
  'AL': 'AL',
  'AM': 'AM',
  'AR': 'AR',
  'AT': 'AT', 'AUSTRIA': 'AT',
  'AU': 'AU', 'AUSTRALIA': 'AU',
  'AZ': 'AZ',
  'BA': 'BA',
  'BB': 'BB',
  'BD': 'BD',
  'BE': 'BE', 'BELGIUM': 'BE',
  'BG': 'BG',
  'BH': 'BH',
  'BN': 'BN',
  'BO': 'BO',
  'BR': 'BR', 'BRAZIL': 'BR',
  'BS': 'BS', 'BAHAMAS': 'BS',
  'BT': 'BT',
  'BY': 'BY',
  'BZ': 'BZ',
  'CA': 'CA', 'CANADA': 'CA',
  'CH': 'CH', 'SWITZERLAND': 'CH',
  'CL': 'CL', 'CHILE': 'CL',
  'CN': 'CN',
  'CO': 'CO', 'COLOMBIA': 'CO',
  'CR': 'CR', 'COSTA RICA': 'CR',
  'CU': 'CU',
  'CY': 'CY',
  'CZ': 'CZ', 'CZECH REPUBLIC': 'CZ',
  'DE': 'DE', 'GERMANY': 'DE',
  'DK': 'DK', 'DENMARK': 'DK',
  'DM': 'DM',
  'DO': 'DO',
  'EC': 'EC', 'ECUADOR': 'EC',
  'EE': 'EE', 'ESTONIA': 'EE',
  'ES': 'ES', 'SPAIN': 'ES',
  'FI': 'FI', 'FINLAND': 'FI',
  'FJ': 'FJ',
  'FM': 'FM',
  'FR': 'FR', 'FRANCE': 'FR',
  'GB': 'GB', 'UNITED KINGDOM': 'GB', 'UK': 'GB',
  'GD': 'GD',
  'GE': 'GE',
  'GR': 'GR', 'GREECE': 'GR',
  'GT': 'GT', 'GUATEMALA': 'GT',
  'GUAM': 'GU',
  'GY': 'GY',
  'HK': 'HK',
  'HN': 'HN', 'HONDURAS': 'HN',
  'HR': 'HR', 'CROATIA': 'HR',
  'HT': 'HT',
  'HU': 'HU', 'HUNGARY': 'HU',
  'ID': 'ID',
  'IE': 'IE', 'IRELAND': 'IE',
  'IL': 'IL',
  'IN': 'IN',
  'IQ': 'IQ',
  'IR': 'IR',
  'IS': 'IS',
  'IT': 'IT', 'ITALY': 'IT',
  'JM': 'JM', 'JAMAICA': 'JM',
  'JO': 'JO',
  'JP': 'JP', 'JAPAN': 'JP',
  'KG': 'KG',
  'KH': 'KH',
  'KI': 'KI',
  'KN': 'KN',
  'KR': 'KR',
  'KW': 'KW',
  'KZ': 'KZ',
  'LA': 'LA',
  'LB': 'LB',
  'LC': 'LC', 'ST.LUCIA': 'LC',
  'LI': 'LI',
  'LK': 'LK',
  'LT': 'LT', 'LITHUANIA': 'LT',
  'LU': 'LU',
  'LV': 'LV', 'LATVIA': 'LV',
  'MC': 'MC',
  'MD': 'MD',
  'ME': 'ME',
  'MK': 'MK',
  'MM': 'MM',
  'MN': 'MN',
  'MO': 'MO',
  'MT': 'MT', 'MALTA': 'MT',
  'MAURITIUS': 'MU',
  'MV': 'MV',
  'MX': 'MX', 'MEXICO': 'MX',
  'MY': 'MY',
  'NC': 'NC',
  'NI': 'NI',
  'NL': 'NL', 'NETHERLANDS': 'NL',
  'NO': 'NO', 'NORWAY': 'NO',
  'NP': 'NP',
  'NR': 'NR',
  'NZ': 'NZ', 'NEW ZEALAND': 'NZ',
  'OM': 'OM',
  'PA': 'PA', 'PANAMA': 'PA',
  'PE': 'PE', 'PERU': 'PE',
  'PF': 'PF',
  'PG': 'PG',
  'PH': 'PH', 'PHILIPPINES': 'PH',
  'PK': 'PK',
  'PL': 'PL', 'POLAND': 'PL',
  'PR': 'PR', 'PUERTO RICO': 'PR',
  'PT': 'PT', 'PORTUGAL': 'PT',
  'PW': 'PW',
  'PY': 'PY',
  'QA': 'QA',
  'RO': 'RO', 'ROMANIA': 'RO',
  'RS': 'RS', 'SERBIA': 'RS',
  'RU': 'RU', 'RUSSIA': 'RU', 'RUSSIAN FEDERATION': 'RU',
  'SA': 'SA', 'SAUDI ARABIA': 'SA',
  'SB': 'SB',
  'SE': 'SE', 'SWEDEN': 'SE',
  'SG': 'SG', 'SINGAPORE': 'SG',
  'SI': 'SI',
  'SK': 'SK', 'SLOVAK REPUBLIC': 'SK', 'SLOVAKIA': 'SK', 'SOUTH KOREA': 'SK',
  'SM': 'SM',
  'SR': 'SR',
  'SV': 'SV',
  'SY': 'SY',
  'TH': 'TH', 'THAILAND': 'TH',
  'TJ': 'TJ',
  'TL': 'TL',
  'TM': 'TM',
  'TO': 'TO',
  'TR': 'TR', 'TURKEY': 'TR',
  'TT': 'TT',
  'TV': 'TV',
  'TW': 'TW',
  'UA': 'UA',
  'US': 'US', 'USA': 'US', 'UNITED STATES': 'US',
  'UY': 'UY', 'URUGUAY': 'UY',
  'UZ': 'UZ',
  'VA': 'VA',
  'VC': 'VC',
  'VE': 'VE',
  'VIRGIN ISLANDS, BRITISH': 'VG',
  'VIRGIN ISLANDS, U.S.': 'VI',
  'VN': 'VN', 'VIETNAM': 'VN',
  'VU': 'VU',
  'WS': 'WS',
  'YE': 'YE',
  'ZA': 'ZA', 'SOUTH AFRICA': 'ZA',
};

function normalizeTerritory(territory: string | null): string {
  if (!territory) return '';
  
  const normalized = territory.trim().toUpperCase();
  const code = TERRITORY_LOOKUP[normalized];
  
  if (code) return code;
  
  // If already a 2-letter code, return as-is
  if (/^[A-Z]{2}$/.test(normalized)) {
    return normalized;
  }
  
  return territory;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('[NORMALIZE-TERRITORIES] Starting normalization...');

    // Fetch all royalties with country field
    const { data: royalties, error: fetchError } = await supabaseClient
      .from('royalty_allocations')
      .select('id, country')
      .not('country', 'is', null);

    if (fetchError) {
      console.error('[NORMALIZE-TERRITORIES] Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`[NORMALIZE-TERRITORIES] Found ${royalties?.length || 0} royalties to process`);

    let updated = 0;
    let skipped = 0;

    // Process in batches
    for (const royalty of royalties || []) {
      const originalCountry = royalty.country;
      const normalizedCountry = normalizeTerritory(originalCountry);

      // Only update if changed
      if (normalizedCountry !== originalCountry) {
        const { error: updateError } = await supabaseClient
          .from('royalty_allocations')
          .update({ country: normalizedCountry })
          .eq('id', royalty.id);

        if (updateError) {
          console.error(`[NORMALIZE-TERRITORIES] Error updating ${royalty.id}:`, updateError);
        } else {
          updated++;
          console.log(`[NORMALIZE-TERRITORIES] Updated: ${originalCountry} → ${normalizedCountry}`);
        }
      } else {
        skipped++;
      }
    }

    console.log(`[NORMALIZE-TERRITORIES] Complete. Updated: ${updated}, Skipped: ${skipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        skipped,
        total: royalties?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[NORMALIZE-TERRITORIES] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
