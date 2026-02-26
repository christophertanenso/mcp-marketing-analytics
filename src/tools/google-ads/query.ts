import type { GoogleAdsApi, Customer } from "google-ads-api";
import { markdownTable, formatNumber, formatCurrency } from "../../utils/formatters.js";

export async function executeQuery(
  customer: Customer,
  query: string,
): Promise<string> {
  const results = await customer.query(query);

  if (!results || results.length === 0) {
    return "No results returned for the query.";
  }

  // Dynamically extract columns from first result
  const firstRow = results[0];
  const columns = flattenKeys(firstRow);

  if (columns.length === 0) {
    return `Query returned ${results.length} rows but no extractable columns.`;
  }

  const headers = columns.map(c => c.split(".").pop() || c);
  const rows = results.map(row => {
    return columns.map(col => {
      const val = getNestedValue(row, col);
      if (val === null || val === undefined) return "";
      // Auto-format cost_micros fields
      if (col.includes("cost_micros") && typeof val === "number") {
        return formatCurrency(val);
      }
      if (typeof val === "number") {
        if (col.includes("rate") || col.includes("ctr")) {
          return (val * 100).toFixed(2) + "%";
        }
        return formatNumber(val);
      }
      return String(val);
    });
  });

  return `**GAQL Query Results** (${results.length} rows)\n\n` + markdownTable(headers, rows);
}

function flattenKeys(obj: any, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      keys.push(...flattenKeys(val, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
