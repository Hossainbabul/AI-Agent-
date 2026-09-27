export interface DataRow {
  order_id?: string;
  date?: string;
  customer_name?: string;
  region?: string;
  category?: string;
  sub_category?: string;
  product_name?: string;
  units_sold?: number;
  unit_price?: number;
  discount?: number;
  total_sales?: number;
  profit?: number;
  payment_method?: string;
  customer_rating?: number;
  [key: string]: any;
}

export type SupportedLanguage = 'en' | 'ur' | 'bn';

export interface ColumnProfile {
  name: string;
  type: 'string' | 'number' | 'date';
  uniqueCount: number;
  missingCount: number;
  missingPct: number;
  sample: string | number;
}

export interface ProfileSummary {
  totalRows: number;
  totalColumns: number;
  totalMissing: number;
  missingRate: number;
  estimatedMemoryKB: number;
  numericCols: string[];
  categoricalCols: string[];
  dateCols: string[];
  columns: ColumnProfile[];
  numericStats: Record<string, {
    count: number;
    mean: number;
    std: number;
    min: number;
    p25: number;
    p50: number;
    p75: number;
    max: number;
  }>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}

export interface MessageChart {
  type: 'bar' | 'line' | 'pie' | 'metric_cards';
  title: string;
  data: ChartDataPoint[];
  xKey?: string;
  yKey?: string;
  color?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: SupportedLanguage;
  timestamp: string;
  generatedCode?: string;
  tableData?: Array<Record<string, any>>;
  chart?: MessageChart;
  isError?: boolean;
}
