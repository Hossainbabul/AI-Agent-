import { ColumnProfile, DataRow, ProfileSummary } from '../types';

export function profileDataset(data: DataRow[]): ProfileSummary {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      totalMissing: 0,
      missingRate: 0,
      estimatedMemoryKB: 0,
      numericCols: [],
      categoricalCols: [],
      dateCols: [],
      columns: [],
      numericStats: {},
    };
  }

  const keys = Object.keys(data[0]);
  const totalRows = data.length;
  const totalColumns = keys.length;

  let totalMissing = 0;
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];
  const dateCols: string[] = [];
  const columns: ColumnProfile[] = [];

  keys.forEach((key) => {
    let missingCount = 0;
    const uniqueValues = new Set<any>();
    let numericCount = 0;
    let sampleVal: any = null;

    data.forEach((row) => {
      const val = row[key];
      if (val === null || val === undefined || val === '') {
        missingCount++;
      } else {
        uniqueValues.add(val);
        if (typeof val === 'number') {
          numericCount++;
        }
        if (sampleVal === null) {
          sampleVal = val;
        }
      }
    });

    totalMissing += missingCount;

    let colType: 'string' | 'number' | 'date' = 'string';
    if (numericCount > totalRows * 0.7) {
      colType = 'number';
      numericCols.push(key);
    } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      colType = 'date';
      dateCols.push(key);
    } else {
      categoricalCols.push(key);
    }

    columns.push({
      name: key,
      type: colType,
      uniqueCount: uniqueValues.size,
      missingCount,
      missingPct: Number(((missingCount / totalRows) * 100).toFixed(2)),
      sample: sampleVal ?? 'N/A',
    });
  });

  const missingRate = Number(((totalMissing / (totalRows * totalColumns)) * 100).toFixed(2));
  const estimatedMemoryKB = Number(((JSON.stringify(data).length * 2) / 1024).toFixed(1));

  // Compute numeric statistics
  const numericStats: ProfileSummary['numericStats'] = {};
  numericCols.forEach((col) => {
    const values = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length > 0) {
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = Number((sum / count).toFixed(2));
      const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
      const std = Number(Math.sqrt(variance).toFixed(2));
      const min = values[0];
      const max = values[values.length - 1];

      const getPercentile = (p: number) => {
        const index = (p / 100) * (values.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        if (lower === upper) return values[lower];
        return Number((values[lower] * (1 - weight) + values[upper] * weight).toFixed(2));
      };

      numericStats[col] = {
        count,
        mean,
        std,
        min,
        p25: getPercentile(25),
        p50: getPercentile(50),
        p75: getPercentile(75),
        max,
      };
    }
  });

  return {
    totalRows,
    totalColumns,
    totalMissing,
    missingRate,
    estimatedMemoryKB,
    numericCols,
    categoricalCols,
    dateCols,
    columns,
    numericStats,
  };
}
