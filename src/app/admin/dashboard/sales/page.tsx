
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, CalendarDays, DollarSign, Download, Trash2, Printer } from "lucide-react";
import { PageTitle } from "@/components/common/page-title";
import type { SaleEntry } from "@/lib/definitions";
import { getSales, clearAllSalesAndSave, refreshDataFromLocalStorage } from "@/lib/data"; 
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format as formatDateFns } from 'date-fns'; // Renamed to avoid conflict with format in scope
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';

export default function SalesReportPage() {
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refreshDataFromLocalStorage(); 
    setSales(getSales());
  }, []);

  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.createdAt);
        if (dateRange?.from && saleDate < dateRange.from) return false;
        if (dateRange?.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (saleDate > toDate) return false;
        }
        return true;
      })
      .filter(sale =>
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.waiterName && sale.waiterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.tableNumber && sale.tableNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.cashierId && sale.cashierId.toLowerCase().includes(searchTerm.toLowerCase())) 
      )
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, dateRange, searchTerm]);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalTransactions = filteredSales.length;

  const handleDownloadReport = () => {
    if (filteredSales.length === 0) {
      toast({
        title: "No Data",
        description: "No sales data to download for the current filter.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Bill ID", "Date", "Cashier ID", "Customer", "Waiter", "Table", "Total (PKR)"];
    const csvRows = [
      headers.join(','),
      ...filteredSales.map(sale => [
        `"${sale.id}"`,
        `"${new Date(sale.createdAt).toLocaleString('en-PK')}"`,
        `"${sale.cashierId}"`,
        `"${sale.customerName || 'N/A'}"`,
        `"${sale.waiterName || 'N/A'}"`,
        `"${sale.tableNumber || 'N/A'}"`,
        sale.totalAmount.toFixed(2)
      ].join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dateSuffix = dateRange?.from ? formatDateFns(dateRange.from, "yyyy-MM-dd") + (dateRange.to ? '_to_' + formatDateFns(dateRange.to, "yyyy-MM-dd") : '') : new Date().toISOString().split('T')[0];
      link.setAttribute('download', `sales_report_${dateSuffix}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "CSV Report Downloaded",
        description: "The sales report has been downloaded as a CSV file.",
      });
    }
  };
  
  const handlePrintAsPdf = () => {
    if (filteredSales.length === 0) {
      toast({
        title: "No Data",
        description: "No sales data to print for the current filter.",
        variant: "destructive",
      });
      return;
    }

    let dateRangeString = "All Time";
    if (dateRange?.from) {
      dateRangeString = formatDateFns(dateRange.from, "PPP");
      if (dateRange.to) {
        dateRangeString += ` - ${formatDateFns(dateRange.to, "PPP")}`;
      }
    }

    const reportHtml = `
      <html>
        <head>
          <title>Sales Report - Al-Shawaya</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 10pt; }
            h1 { text-align: center; color: #333; margin-bottom: 5px;}
            .report-header { text-align: center; margin-bottom: 15px; }
            .report-header p { margin: 2px 0; font-size: 9pt; color: #555; }
            .summary { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9; }
            .summary h2 { margin-top: 0; font-size: 12pt; color: #333;}
            .summary p { margin: 5px 0; font-size: 10pt;}
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9pt;}
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #e8e8e8; font-weight: bold; }
            .text-right { text-align: right; }
            @media print {
              body { margin: 10mm; }
              .no-print { display: none; }
              @page { 
                size: A4; 
                margin: 20mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>Al-Shawaya - Sales Report</h1>
            <p>Date Range: ${dateRangeString}</p>
            <p>Generated on: ${new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>

          <div class="summary">
            <h2>Report Summary (Filtered)</h2>
            <p><strong>Total Revenue:</strong> PKR ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Total Transactions:</strong> ${totalTransactions}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Date</th>
                <th>Cashier ID</th>
                <th>Customer</th>
                <th>Waiter</th>
                <th>Table</th>
                <th class="text-right">Total (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td>${sale.id}</td>
                  <td>${new Date(sale.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>${sale.cashierId || 'N/A'}</td>
                  <td>${sale.customerName || 'N/A'}</td>
                  <td>${sale.waiterName || 'N/A'}</td>
                  <td>${sale.tableNumber || 'N/A'}</td>
                  <td class="text-right">${sale.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            // Optional: Add print command if not relying on parent window
            // window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close(); // Important for some browsers
      // Timeout to ensure content is loaded before print
      setTimeout(() => {
         printWindow.print();
      }, 500); 
      toast({
        title: "Printing PDF",
        description: "Your sales report is being prepared for PDF printing.",
      });
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to print the report.",
        variant: "destructive",
      });
    }
  };


  const handleExecuteClearSales = () => {
    clearAllSalesAndSave();
    setSales(getSales()); 
    toast({
      title: "Sales Cleared",
      description: "All sales data has been cleared from localStorage.",
    });
    setIsConfirmClearOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageTitle icon={BarChart3} title="Sales Report" description="View detailed sales transactions and summaries." />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Filtered)</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions (Filtered)</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <Input
                type="search"
                placeholder="Search transactions..."
                className="w-full sm:w-auto md:w-52" // Adjusted width
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatDateFns(dateRange.from, "LLL dd, y")} - {formatDateFns(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        formatDateFns(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleDownloadReport} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
              <Button onClick={handlePrintAsPdf} variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" /> Print PDF
              </Button>
              <Button variant="destructive" onClick={() => setIsConfirmClearOpen(true)} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Sales
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cashier ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Waiter</TableHead>
                <TableHead>Table</TableHead>
                <TableHead className="text-right">Total (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id}</TableCell>
                  <TableCell>
                    <ClientSideFormattedDate isoDateString={sale.createdAt} />
                  </TableCell>
                  <TableCell>{sale.cashierId}</TableCell>
                  <TableCell>{sale.customerName || 'N/A'}</TableCell>
                  <TableCell>{sale.waiterName || 'N/A'}</TableCell>
                  <TableCell>{sale.tableNumber || 'N/A'}</TableCell>
                  <TableCell className="text-right">{sale.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No sales transactions found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmClearOpen} onOpenChange={setIsConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all sales records
              from localStorage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteClearSales}
              className={buttonVariants({ variant: "destructive" })}
            >
              Clear Sales
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

