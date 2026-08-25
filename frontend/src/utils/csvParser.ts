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

        // Check for required date and amount fields (accepting raw transaction or daily cashflow headers)
        const hasDate = columnsFound.some((c) => {
          const l = c.toLowerCase();
          return l.includes('date') || l.includes('timestamp');
        });
        const hasAmount = columnsFound.some((c) => {
          const l = c.toLowerCase();
          return l.includes('amount') || l.includes('value') || l.includes('cash_in');
        });

        if (!hasDate || !hasAmount) {
          errors.push(`CSV missing required date/amount columns. Found: [${columnsFound.join(', ')}]`);
          resolve({ valid: false, transactions: [], errors, totalRows: results.data.length, columnsFound });
          return;
        }

        let runningBalance = 120000;
        const dataRows = results.data as Record<string, any>[];

        dataRows.forEach((row, index) => {
          const dateVal = row['transactionTimestamp'] || row['Date'] || row['date'] || row['Timestamp'];
          const amountVal =
            row['amount'] ||
            row['Amount'] ||
            row['Signed_Amount'] ||
            row['Value'] ||
            row['Net_Cashflow'] ||
            row['Cash_In'] ||
            0;
          const typeVal = String(row['type'] || '').toUpperCase();
          const descVal =
            row['narration'] ||
            row['Description'] ||
            row['description'] ||
            row['Memo'] ||
            row['Payee'] ||
            `Transaction #${index + 1}`;
          const categoryVal =
            row['Category'] || row['category'] || (typeVal === 'CREDIT' ? 'Revenue' : 'Operating Expense');
          const accountVal = row['Account'] || row['account'] || 'Primary Checking (*4910)';

          let numAmount = parseFloat(String(amountVal).replace(/[^0-9.-]+/g, ''));
          if (isNaN(numAmount)) {
            errors.push(`Row ${index + 1}: Invalid numeric amount "${amountVal}"`);
            return;
          }

          if (!dateVal) {
            errors.push(`Row ${index + 1}: Missing date value`);
            return;
          }

          if (typeVal === 'DEBIT' && numAmount > 0) {
            numAmount = -numAmount;
          }

          if (row['currentBalance'] !== undefined && row['currentBalance'] !== '') {
            runningBalance = parseFloat(String(row['currentBalance']).replace(/[^0-9.-]+/g, '')) || runningBalance;
          } else {
            runningBalance += numAmount;
          }

          transactions.push({
            id: String(row['txnId'] || `upload-tx-${index + 1}`),
            date: new Date(dateVal).toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            description: String(descVal),
            amount: Math.abs(numAmount),
            category: String(categoryVal),
            account: String(accountVal),
            type: numAmount >= 0 ? 'inflow' : 'outflow',
            balance: Math.round(runningBalance * 100) / 100,
          });
        });

        // Validate minimum 8 daily dates for feature engineering
        const uniqueDates = new Set(transactions.map((tx) => tx.date));
        if (errors.length === 0 && uniqueDates.size < 8) {
          errors.push(
            `Insufficient transaction history: CSV contains ${uniqueDates.size} daily date(s). At least 8 consecutive days of cashflow data are required for feature engineering.`
          );
        }

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
 * Generates sample CSV text matching backend raw upload contract:
 * transactionTimestamp,amount,type,currentBalance,txnId
 * Includes 15+ consecutive days of data to satisfy feature engineering lag/rolling requirements.
 */
export function generateSampleCSVString(): string {
  return `type,amount,currentBalance,transactionTimestamp,txnId,narration
DEBIT,120.0,145800.0,2026-07-20T09:15:00+05:30,txn-20260720-01,AWS Cloud Hosting
CREDIT,8500.0,154300.0,2026-07-20T14:30:00+05:30,txn-20260720-02,Client Invoice Payout
DEBIT,450.0,153850.0,2026-07-21T10:00:00+05:30,txn-20260721-01,Office Supplies
CREDIT,3200.0,157050.0,2026-07-21T16:20:00+05:30,txn-20260721-02,Merchant Settlement
DEBIT,1200.0,155850.0,2026-07-22T11:45:00+05:30,txn-20260722-01,Software Subscription
CREDIT,4100.0,159950.0,2026-07-22T15:10:00+05:30,txn-20260722-02,Consulting Deposit
DEBIT,3500.0,156450.0,2026-07-23T09:30:00+05:30,txn-20260723-01,Equipment Maintenance
CREDIT,6800.0,163250.0,2026-07-23T14:00:00+05:30,txn-20260723-02,Stripe Payout
DEBIT,850.0,162400.0,2026-07-24T10:15:00+05:30,txn-20260724-01,Utility Bill
CREDIT,2900.0,165300.0,2026-07-24T13:45:00+05:30,txn-20260724-02,Services Retainer
DEBIT,15000.0,150300.0,2026-07-25T11:00:00+05:30,txn-20260725-01,Payroll Expense
CREDIT,9400.0,159700.0,2026-07-25T16:30:00+05:30,txn-20260725-02,Customer Payment
DEBIT,600.0,159100.0,2026-07-26T12:20:00+05:30,txn-20260726-01,Marketing Campaign
CREDIT,3100.0,162200.0,2026-07-26T17:00:00+05:30,txn-20260726-02,SaaS Subscription Rev
DEBIT,1100.0,161100.0,2026-07-27T08:45:00+05:30,txn-20260727-01,Server Infrastructure
CREDIT,5200.0,166300.0,2026-07-27T15:30:00+05:30,txn-20260727-02,Enterprise Contract
DEBIT,750.0,165550.0,2026-07-28T10:00:00+05:30,txn-20260728-01,Insurance Premium
CREDIT,4400.0,169950.0,2026-07-28T14:15:00+05:30,txn-20260728-02,Partner Revenue Share
DEBIT,2200.0,167750.0,2026-07-29T11:30:00+05:30,txn-20260729-01,Vendor Hardware Invoice
CREDIT,8900.0,176650.0,2026-07-29T16:00:00+05:30,txn-20260729-02,Client Retainer
DEBIT,480.0,176170.0,2026-07-30T09:20:00+05:30,txn-20260730-01,Telecommunications
CREDIT,3600.0,179770.0,2026-07-30T13:40:00+05:30,txn-20260730-02,Merchant Daily Settlement
DEBIT,12500.0,167270.0,2026-07-31T10:00:00+05:30,txn-20260731-01,Monthly Rent & Facilities
CREDIT,7800.0,175070.0,2026-07-31T15:45:00+05:30,txn-20260731-02,Consulting Services
DEBIT,920.0,174150.0,2026-08-01T11:15:00+05:30,txn-20260801-01,Software Tools
CREDIT,6100.0,180250.0,2026-08-01T16:20:00+05:30,txn-20260801-02,Stripe Payout
DEBIT,1400.0,178850.0,2026-08-02T09:30:00+05:30,txn-20260802-01,Travel & Logistics
CREDIT,4300.0,183150.0,2026-08-02T14:10:00+05:30,txn-20260802-02,Customer Direct Credit
DEBIT,3100.0,180050.0,2026-08-03T10:45:00+05:30,txn-20260803-01,Contractor Payout
CREDIT,7200.0,187250.0,2026-08-03T15:30:00+05:30,txn-20260803-02,Advisory Fee Inflow
DEBIT,1800.0,185450.0,2026-08-04T12:00:00+05:30,txn-20260804-01,Cloud Services
CREDIT,5400.0,190850.0,2026-08-04T16:45:00+05:30,txn-20260804-02,Client Deposit
DEBIT,2600.0,188250.0,2026-08-05T09:15:00+05:30,txn-20260805-01,Legal & Professional
CREDIT,6900.0,195150.0,2026-08-05T14:50:00+05:30,txn-20260805-02,Enterprise Payout`;
}
