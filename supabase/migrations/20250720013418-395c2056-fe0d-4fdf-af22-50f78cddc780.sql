-- Add the missing enum values to royalty_source
ALTER TYPE royalty_source ADD VALUE 'BMI';
ALTER TYPE royalty_source ADD VALUE 'ASCAP';
ALTER TYPE royalty_source ADD VALUE 'SESAC';
ALTER TYPE royalty_source ADD VALUE 'SOCAN';
ALTER TYPE royalty_source ADD VALUE 'Spotify';
ALTER TYPE royalty_source ADD VALUE 'Apple Music';
ALTER TYPE royalty_source ADD VALUE 'Amazon Music';
ALTER TYPE royalty_source ADD VALUE 'Tidal';
ALTER TYPE royalty_source ADD VALUE 'Pandora';
ALTER TYPE royalty_source ADD VALUE 'SiriusXM';