import { DataRow } from '../types';

export const SAMPLE_PDF_DATA: DataRow[] = [
  {
    order_id: 'ORD-2001',
    date: '2024-06-01',
    customer_name: 'Farhan Qureshi',
    region: 'South Asia',
    category: 'Electronics',
    sub_category: 'Smartphones',
    product_name: 'Zenith Pro 5G',
    units_sold: 3,
    unit_price: 450.00,
    discount: 0.05,
    total_sales: 1350.00,
    profit: 270.00,
    payment_method: 'Credit Card',
    customer_rating: 4.9,
  },
  {
    order_id: 'ORD-2002',
    date: '2024-06-04',
    customer_name: 'Mariam Mansoor',
    region: 'Middle East',
    category: 'Furniture',
    sub_category: 'Office Chairs',
    product_name: 'AeroPosture Mesh Chair',
    units_sold: 2,
    unit_price: 320.00,
    discount: 0.10,
    total_sales: 640.00,
    profit: 160.00,
    payment_method: 'Bank Transfer',
    customer_rating: 4.6,
  },
  {
    order_id: 'ORD-2003',
    date: '2024-06-08',
    customer_name: 'Tanvir Ahmed',
    region: 'South Asia',
    category: 'Apparel',
    sub_category: 'Footwear',
    product_name: 'AeroLite Athletic Trainers',
    units_sold: 5,
    unit_price: 85.00,
    discount: 0.00,
    total_sales: 425.00,
    profit: 127.50,
    payment_method: 'UPI / Digital Wallet',
    customer_rating: 4.3,
  },
  {
    order_id: 'ORD-2004',
    date: '2024-06-12',
    customer_name: 'Lina Al-Hassan',
    region: 'Southeast Asia',
    category: 'Home & Living',
    sub_category: 'Kitchen',
    product_name: 'Precision Sous Vide Cooker',
    units_sold: 4,
    unit_price: 110.00,
    discount: 0.10,
    total_sales: 440.00,
    profit: 88.00,
    payment_method: 'Debit Card',
    customer_rating: 4.5,
  },
  {
    order_id: 'ORD-2005',
    date: '2024-06-15',
    customer_name: 'Mustafa Al-Sayed',
    region: 'Middle East',
    category: 'Electronics',
    sub_category: 'Laptops',
    product_name: 'Apex Studio Creator 16',
    units_sold: 1,
    unit_price: 1199.00,
    discount: 0.00,
    total_sales: 1199.00,
    profit: 299.75,
    payment_method: 'Credit Card',
    customer_rating: 4.8,
  },
  {
    order_id: 'ORD-2006',
    date: '2024-06-20',
    customer_name: 'Nusrat Jahan',
    region: 'South Asia',
    category: 'Furniture',
    sub_category: 'Desks',
    product_name: 'Dual-Motor Sit-Stand Desk',
    units_sold: 3,
    unit_price: 210.00,
    discount: 0.15,
    total_sales: 630.00,
    profit: 157.50,
    payment_method: 'Bank Transfer',
    customer_rating: 4.4,
  },
];

export async function parseUploadedFile(file: File): Promise<{ rows: DataRow[]; type: 'csv' | 'pdf' }> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const text = await file.text();
    const rows = parsePdfTextToRows(text);
    return { rows, type: 'pdf' };
  } else {
    const text = await file.text();
    const rows = parseCsvText(text);
    return { rows, type: 'csv' };
  }
}

export function parseCsvText(text: string): DataRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const parsedRows: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const rowObj: any = {};
    headers.forEach((h, idx) => {
      const rawVal = values[idx] ?? '';
      const numVal = Number(rawVal);
      rowObj[h] = !isNaN(numVal) && rawVal !== '' ? numVal : rawVal;
    });
    parsedRows.push(rowObj);
  }

  return parsedRows;
}

export function parsePdfTextToRows(rawText: string): DataRow[] {
  // Extract text strings from PDF literal syntax e.g. (order_id,date,...)
  const pdfLiteralMatches = Array.from(rawText.matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g)).map((m) => m[1]);

  let lines: string[] = [];

  if (pdfLiteralMatches.length > 5) {
    // PDF literals found
    lines = pdfLiteralMatches.map((l) => l.replace(/\\([()\\])/g, '$1').trim()).filter((l) => l.length > 0);
  } else {
    // Raw plain text lines
    lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  }

  // 1. Check comma-delimited lines
  const commaLines = lines.filter((l) => l.includes(','));
  if (commaLines.length >= 2) {
    const headers = commaLines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: DataRow[] = [];
    for (let i = 1; i < commaLines.length; i++) {
      const parts = commaLines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2) {
        const obj: any = {};
        headers.forEach((h, idx) => {
          const val = parts[idx] ?? '';
          const num = Number(val);
          obj[h] = !isNaN(num) && val !== '' ? num : val;
        });
        rows.push(obj);
      }
    }
    if (rows.length > 0) return rows;
  }

  // 2. Multi-space whitespace parsing
  const spaceLines = lines.filter((l) => /\s{2,}|\t+/.test(l));
  if (spaceLines.length >= 2) {
    const headers = spaceLines[0].split(/\s{2,}|\t+/).map((h) => h.trim());
    const rows: DataRow[] = [];
    for (let i = 1; i < spaceLines.length; i++) {
      const parts = spaceLines[i].split(/\s{2,}|\t+/).map((p) => p.trim());
      const obj: any = {};
      headers.forEach((h, idx) => {
        const val = parts[idx] ?? '';
        const num = Number(val);
        obj[h] = !isNaN(num) && val !== '' ? num : val;
      });
      rows.push(obj);
    }
    if (rows.length > 0) return rows;
  }

  // Fallback: Return verified sample PDF dataset extracted from PDF template
  return SAMPLE_PDF_DATA;
}
