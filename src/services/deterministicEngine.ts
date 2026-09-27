import { ChatMessage, DataRow, MessageChart, SupportedLanguage } from '../types';

export function detectLanguage(text: string): SupportedLanguage {
  // Check Arabic/Urdu unicode range
  const hasUrdu = /[\u0600-\u06FF]/.test(text);
  if (hasUrdu) return 'ur';

  // Check Bengali unicode range
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  if (hasBengali) return 'bn';

  return 'en';
}

export interface AnalyticalResult {
  content: string;
  language: SupportedLanguage;
  code: string;
  tableData?: Array<Record<string, any>>;
  chart?: MessageChart;
}

export function executeDeterministicQuery(
  query: string,
  data: DataRow[],
  apiKey?: string,
  modelName: string = 'gpt-4o-mini'
): AnalyticalResult {
  const lang = detectLanguage(query);
  const qLower = query.toLowerCase();

  // Helper formatting numbers
  const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  // 1. Total Sales & Total Profit / Overview
  if (
    qLower.includes('total') ||
    qLower.includes('overall') ||
    qLower.includes('مجموعی') ||
    qLower.includes('کل') ||
    qLower.includes('মোট') ||
    qLower.includes('সর্বমোট')
  ) {
    const totalSales = data.reduce((sum, r) => sum + Number(r.total_sales || 0), 0);
    const totalProfit = data.reduce((sum, r) => sum + Number(r.profit || 0), 0);
    const totalUnits = data.reduce((sum, r) => sum + Number(r.units_sold || 0), 0);
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    const pythonCode = `import pandas as pd

total_sales = df['total_sales'].sum()
total_profit = df['profit'].sum()
total_units = df['units_sold'].sum()
profit_margin = (total_profit / total_sales) * 100

result = {
    'Total Revenue': round(total_sales, 2),
    'Total Profit': round(total_profit, 2),
    'Total Units Sold': total_units,
    'Profit Margin %': round(profitMargin, 2)
}`;

    let explanation = '';
    if (lang === 'ur') {
      explanation = `مجموعی تجزیہ: کل سیلز **${fmtCurrency(totalSales)}**، مجموعی منافع **${fmtCurrency(totalProfit)}** اور بیچے گئے کل یونٹس **${fmtNum(totalUnits)}** ہیں۔ مجموعی منافع کا تناسب (Profit Margin) **${profitMargin.toFixed(1)}%** ہے۔`;
    } else if (lang === 'bn') {
      explanation = `সার্বিক বিশ্লেষণ: মোট বিক্রয় **${fmtCurrency(totalSales)}**, মোট লাভ **${fmtCurrency(totalProfit)}** এবং মোট বিক্রিত ইউনিট সংখ্যা **${fmtNum(totalUnits)}**। সার্বিক মুনাফার হার (Profit Margin) **${profitMargin.toFixed(1)}%**।`;
    } else {
      explanation = `**Executive Summary:** Total revenue is **${fmtCurrency(totalSales)}** with a net profit of **${fmtCurrency(totalProfit)}** across **${fmtNum(totalUnits)}** units sold. The overall portfolio profit margin stands at **${profitMargin.toFixed(1)}%**.`;
    }

    return {
      content: explanation,
      language: lang,
      code: pythonCode,
      tableData: [
        { Metric: 'Total Sales Revenue', Value: fmtCurrency(totalSales) },
        { Metric: 'Total Net Profit', Value: fmtCurrency(totalProfit) },
        { Metric: 'Total Units Sold', Value: fmtNum(totalUnits) },
        { Metric: 'Net Profit Margin', Value: `${profitMargin.toFixed(2)}%` },
      ],
      chart: {
        type: 'bar',
        title: lang === 'ur' ? 'سیلز اور منافع کا موازنہ' : lang === 'bn' ? 'বিক্রয় ও লাভের তুলনা' : 'Sales vs Profit Overview',
        data: [
          { label: 'Total Sales', value: totalSales },
          { label: 'Total Profit', value: totalProfit },
        ],
      },
    };
  }

  // 2. Region / Geography Analytics
  if (
    qLower.includes('region') ||
    qLower.includes('علاقہ') ||
    qLower.includes('ریجن') ||
    qLower.includes('অঞ্চল') ||
    qLower.includes('এলাকা')
  ) {
    const regionalMap: Record<string, { sales: number; profit: number; orders: number }> = {};
    data.forEach((r) => {
      const reg = r.region || 'Other';
      if (!regionalMap[reg]) {
        regionalMap[reg] = { sales: 0, profit: 0, orders: 0 };
      }
      regionalMap[reg].sales += Number(r.total_sales || 0);
      regionalMap[reg].profit += Number(r.profit || 0);
      regionalMap[reg].orders += 1;
    });

    const regions = Object.keys(regionalMap).map((reg) => ({
      Region: reg,
      'Total Sales ($)': Number(regionalMap[reg].sales.toFixed(2)),
      'Total Profit ($)': Number(regionalMap[reg].profit.toFixed(2)),
      'Orders Count': regionalMap[reg].orders,
      'Margin %': Number(((regionalMap[reg].profit / regionalMap[reg].sales) * 100).toFixed(1)),
    })).sort((a, b) => b['Total Sales ($)'] - a['Total Sales ($)']);

    const topRegion = regions[0];

    const pythonCode = `import pandas as pd
import plotly.express as px

regional_summary = df.groupby('region').agg({
    'total_sales': 'sum',
    'profit': 'sum',
    'order_id': 'count'
}).rename(columns={'order_id': 'orders_count'}).reset_index()

regional_summary['margin_pct'] = (regional_summary['profit'] / regional_summary['total_sales']) * 100
result = regional_summary.sort_values(by='total_sales', ascending=False)

fig = px.bar(
    regional_summary,
    x='region',
    y='total_sales',
    color='profit',
    title='Sales & Profit by Region',
    template='plotly_dark'
)`;

    let explanation = '';
    if (lang === 'ur') {
      explanation = `ریجنل تجزیہ: سب سے آگے **${topRegion.Region}** ہے جس کی کل سیلز **${fmtCurrency(topRegion['Total Sales ($)'])}** اور منافع **${fmtCurrency(topRegion['Total Profit ($)'])}** ہے۔`;
    } else if (lang === 'bn') {
      explanation = `আঞ্চলিক বিশ্লেষণ: শীর্ষ অঞ্চল হলো **${topRegion.Region}**, যার মোট বিক্রয় **${fmtCurrency(topRegion['Total Sales ($)'])}** এবং মোট লাভ **${fmtCurrency(topRegion['Total Profit ($)'])}**।`;
    } else {
      explanation = `**Regional Breakdown:** Top performing region is **${topRegion.Region}** contributing **${fmtCurrency(topRegion['Total Sales ($)'])}** in revenue and **${fmtCurrency(topRegion['Total Profit ($)'])}** in net profit (${topRegion['Margin %']}% margin).`;
    }

    return {
      content: explanation,
      language: lang,
      code: pythonCode,
      tableData: regions,
      chart: {
        type: 'bar',
        title: lang === 'ur' ? 'ریجن کے لحاظ سے سیلز کا جائزہ' : lang === 'bn' ? 'অঞ্চলভিত্তিক বিক্রির তুলনামূলক গ্রাফ' : 'Revenue by Geographic Region',
        data: regions.map((r) => ({
          label: r.Region,
          value: r['Total Sales ($)'],
          secondaryValue: r['Total Profit ($)'],
        })),
      },
    };
  }

  // 3. Top Products / Best Sellers
  if (
    qLower.includes('product') ||
    qLower.includes('item') ||
    qLower.includes('مصنوعات') ||
    qLower.includes('پروڈکٹ') ||
    qLower.includes('পণ্য') ||
    qLower.includes('আইটেম')
  ) {
    const productMap: Record<string, { sales: number; profit: number; units: number }> = {};
    data.forEach((r) => {
      const prod = r.product_name || 'Item';
      if (!productMap[prod]) {
        productMap[prod] = { sales: 0, profit: 0, units: 0 };
      }
      productMap[prod].sales += Number(r.total_sales || 0);
      productMap[prod].profit += Number(r.profit || 0);
      productMap[prod].units += Number(r.units_sold || 0);
    });

    const products = Object.keys(productMap).map((prod) => ({
      Product: prod,
      'Total Sales ($)': Number(productMap[prod].sales.toFixed(2)),
      'Net Profit ($)': Number(productMap[prod].profit.toFixed(2)),
      'Units Sold': productMap[prod].units,
    })).sort((a, b) => b['Total Sales ($)'] - a['Total Sales ($)']).slice(0, 5);

    const topItem = products[0];

    const pythonCode = `import pandas as pd

top_products = df.groupby('product_name').agg({
    'total_sales': 'sum',
    'profit': 'sum',
    'units_sold': 'sum'
}).reset_index().sort_values(by='total_sales', ascending=False).head(5)

result = top_products`;

    let explanation = '';
    if (lang === 'ur') {
      explanation = `سب سے زیادہ ریونیو بنانے والی پروڈکٹ **${topItem.Product}** ہے، جس نے کل **${fmtCurrency(topItem['Total Sales ($)'])}** کی سیلز اور **${fmtCurrency(topItem['Net Profit ($)'])}** کا منافع حاصل کیا۔`;
    } else if (lang === 'bn') {
      explanation = `সর্বোচ্চ বিক্রয়কৃত পণ্য হলো **${topItem.Product}**, যার মোট বিক্রয় **${fmtCurrency(topItem['Total Sales ($)'])}** এবং মোট মুনাফা **${fmtCurrency(topItem['Net Profit ($)'])}**।`;
    } else {
      explanation = `**Top Products by Revenue:** The leading product is **${topItem.Product}** generating **${fmtCurrency(topItem['Total Sales ($)'])}** in revenue and **${fmtCurrency(topItem['Net Profit ($)'])}** in profit across **${topItem['Units Sold']}** units.`;
    }

    return {
      content: explanation,
      language: lang,
      code: pythonCode,
      tableData: products,
      chart: {
        type: 'bar',
        title: lang === 'ur' ? 'ٹاپ ۵ پروڈکٹس بلحاظ سیلز' : lang === 'bn' ? 'শীর্ষ ৫টি পণ্যের বিক্রয়' : 'Top 5 Products by Sales',
        data: products.map((p) => ({
          label: p.Product,
          value: p['Total Sales ($)'],
        })),
      },
    };
  }

  // 4. Default / Category Analytics (Category Breakdown & Profitability)
  const categoryMap: Record<string, { sales: number; profit: number; units: number }> = {};
  data.forEach((r) => {
    const cat = r.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { sales: 0, profit: 0, units: 0 };
    }
    categoryMap[cat].sales += Number(r.total_sales || 0);
    categoryMap[cat].profit += Number(r.profit || 0);
    categoryMap[cat].units += Number(r.units_sold || 0);
  });

  const categories = Object.keys(categoryMap).map((cat) => ({
    Category: cat,
    'Total Sales ($)': Number(categoryMap[cat].sales.toFixed(2)),
    'Total Profit ($)': Number(categoryMap[cat].profit.toFixed(2)),
    'Units Sold': categoryMap[cat].units,
    'Margin %': Number(((categoryMap[cat].profit / categoryMap[cat].sales) * 100).toFixed(1)),
  })).sort((a, b) => b['Total Sales ($)'] - a['Total Sales ($)']);

  const topCategory = categories[0];

  const pythonCode = `import pandas as pd
import plotly.express as px

cat_summary = df.groupby('category').agg({
    'total_sales': 'sum',
    'profit': 'sum',
    'units_sold': 'sum'
}).reset_index()

cat_summary['margin_pct'] = (cat_summary['profit'] / cat_summary['total_sales']) * 100
result = cat_summary.sort_values(by='total_sales', ascending=False)

fig = px.pie(
    cat_summary,
    names='category',
    values='total_sales',
    title='Category Sales Distribution',
    template='plotly_dark'
)`;

  let explanation = '';
  if (lang === 'ur') {
    explanation = `کیٹگری کا تجزیہ: سب سے زیادہ سیلز اور منافع **${topCategory.Category}** کیٹگری سے حاصل ہوا ہے جس کی مجموعی سیلز **${fmtCurrency(topCategory['Total Sales ($)'])}** اور منافع **${fmtCurrency(topCategory['Total Profit ($)'])}** ہے (${topCategory['Margin %']}% مارجن)۔`;
  } else if (lang === 'bn') {
    explanation = `ক্যাটাগরি বিশ্লেষণ: সর্বোচ্চ বিক্রয় এবং মুনাফা অর্জিত হয়েছে **${topCategory.Category}** ক্যাটাগরি থেকে, যার মোট বিক্রয় **${fmtCurrency(topCategory['Total Sales ($)'])}** এবং মোট মুনাফা **${fmtCurrency(topCategory['Total Profit ($)'])}** (${topCategory['Margin %']}% মার্জিন)।`;
  } else {
    explanation = `**Category Performance Breakdown:** The top performing segment is **${topCategory.Category}** with **${fmtCurrency(topCategory['Total Sales ($)'])}** in total sales and **${fmtCurrency(topCategory['Total Profit ($)'])}** in profit, yielding a **${topCategory['Margin %']}%** margin.`;
  }

  return {
    content: explanation,
    language: lang,
    code: pythonCode,
    tableData: categories,
    chart: {
      type: 'pie',
      title: lang === 'ur' ? 'کیٹگری کے لحاظ سے سیلز کا تناسب' : lang === 'bn' ? 'ক্যাটাগরিভিত্তিক বিক্রির শতাংশ' : 'Market Share by Category',
      data: categories.map((c) => ({
        label: c.Category,
        value: c['Total Sales ($)'],
      })),
    },
  };
}
