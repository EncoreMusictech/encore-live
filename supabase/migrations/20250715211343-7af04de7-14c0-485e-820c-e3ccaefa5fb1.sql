-- Insert default source mapping configurations
INSERT INTO public.source_mapping_config (source_name, mapping_rules, header_patterns, version, is_active)
VALUES 
(
  'BMI',
  '{
    "Work ID": "Work ID",
    "Song Title": "Work Title",
    "ISWC": "ISWC",
    "Client Name": "IP Name",
    "Client Role": "IP Role",
    "Source": "Source",
    "Royalty Type": "Performance Type",
    "Share %": "Share %",
    "Gross Amount": ["Current Quarter Royalties", "Amount"],
    "Period Start": "Period",
    "Period End": "Period",
    "Payment Date": "Payment Date"
  }',
  '{"Work Title", "IP Name", "Current Quarter Royalties", "Work ID"}',
  '1.0',
  true
),
(
  'ASCAP',
  '{
    "Work ID": "Work Number",
    "Song Title": "Title",
    "ISWC": "ISWC",
    "Client Name": "Writer Name",
    "Client Role": "Role",
    "Source": "Source",
    "Royalty Type": "Survey",
    "Share %": "Writer Share",
    "Gross Amount": "Amount Paid",
    "Period Start": "Start Date",
    "Period End": "End Date",
    "Payment Date": "Payment Date"
  }',
  '{"Title", "Writer Name", "Amount Paid", "Survey"}',
  '1.0',
  true
),
(
  'YouTube',
  '{
    "Work ID": "",
    "Song Title": "Asset Title",
    "ISWC": "",
    "Client Name": "Channel Name",
    "Client Role": "Owner",
    "Source": "Platform",
    "Royalty Type": "Revenue Type",
    "Share %": "Share",
    "Gross Amount": "Earnings",
    "Period Start": "Revenue Start",
    "Period End": "Revenue End",
    "Payment Date": "Payment Date"
  }',
  '{"Asset Title", "Channel Name", "Earnings", "Video Title"}',
  '1.0',
  true
),
(
  'SoundExchange',
  '{
    "Work ID": "ISRC",
    "Song Title": "Sound Recording Title",
    "ISWC": "",
    "Client Name": "Featured Artist",
    "Client Role": "Artist Type",
    "Source": "Service",
    "Royalty Type": "Royalty Type",
    "Share %": "Share Percentage",
    "Gross Amount": "Royalty",
    "Period Start": "Usage Period Start",
    "Period End": "Usage Period End",
    "Payment Date": "Distribution Date"
  }',
  '{"Sound Recording Title", "Featured Artist", "Royalty", "Album Title"}',
  '1.0',
  true
);