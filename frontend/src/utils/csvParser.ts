import Papa from 'papaparse';
import { TransactionItem } from '../api/types';

export interface CSVParseResult {
  valid: boolean;
  transactions: TransactionItem[];
  errors: string[];
  totalRows: number;
  columnsFound: string[];
}

export function parseBankStatementCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const transactions: TransactionItem[] = [];
        const columnsFound = results.meta.fields || [];

        // Validate required headers
        const requiredHeaders = ['Date', 'Amount'];
        const missing = requiredHeaders.filter(
          (h) => !columnsFound.some((c) => c.toLowerCase().includes(h.toLowerCase()))
        );

        if (missing.length > 0) {
          errors.push(`CSV missing required columns: ${missing.join(', ')}. Found: [${columnsFound.join(', ')}]`);
          resolve({ valid: false, transactions: [], errors, totalRows: results.data.length, columnsFound });
          return;
        }

        let runningBalance = 120000;
        const dataRows = results.data as Record<string, any>[];

        dataRows.forEach((row, index) => {
          const dateVal = row['Date'] || row['date'] || row['transactionTimestamp'] || row['Timestamp'];
          const amountVal = row['Amount'] || row['amount'] || row['Signed_Amount'] || row['Value'];
          const descVal = row['Description'] || row['description'] || row['Memo'] || row['Payee'] || `Transaction #${index + 1}`;
          const categoryVal = row['Category'] || row['category'] || 'General Operational';
          const accountVal = row['Account'] || row['account'] || 'Primary Checking (*4910)';

          const numAmount = parseFloat(String(amountVal).replace(/[^0-9.-]+/g, ''));

          if (isNaN(numAmount)) {
            errors.push(`Row ${index + 1}: Invalid numeric amount "${amountVal}"`);
            return;
          }

          if (!dateVal) {
            errors.push(`Row ${index + 1}: Missing date value`);
            return;
          }

          runningBalance += numAmount;

          transactions.push({
            id: `upload-tx-${index + 1}`,
            date: new Date(dateVal).toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            description: String(descVal),
            amount: numAmount,
            category: String(categoryVal),
            account: String(accountVal),
            type: numAmount >= 0 ? 'inflow' : 'outflow',
            balance: Math.round(runningBalance * 100) / 100,
          });
        });

        resolve({
          valid: errors.length === 0,
          transactions,
          errors,
          totalRows: results.data.length,
          columnsFound,
        });
      },
      error: (err) => {
        resolve({
          valid: false,
          transactions: [],
          errors: [`File parsing error: ${err.message}`],
          totalRows: 0,
          columnsFound: [],
        });
      },
    });
  });
}

/**
 * Generates sample CSV text for user download reference
 */
export function generateSampleCSVString(): string {
  return `Date,Description,Amount,Category,Account
2026-08-01,Client Enterprise Retainer,18500.00,Revenue,Primary Checking (*4910)
2026-08-02,AWS Cloud Infrastructure,-3450.00,Software & Hosting,Primary Checking (*4910)
2026-08-03,Office Lease Payment,-5500.00,Facilities,Primary Checking (*4910)
2026-08-04,Stripe Merchant Payout,12400.00,Revenue,Primary Checking (*4910)
2026-08-05,Payroll Direct Deposit,-24800.00,Payroll,Payroll Checking (*1088)
2026-08-06,Software Licenses & SaaS,-1200.00,Software Tools,Corporate Credit (*9921)
2026-08-07,Consulting Inflow,6200.00,Revenue,Primary Checking (*4910)
2026-08-08,Vendor Hardware Invoice,-4100.00,Equipment,Primary Checking (*4910)`;
}
