
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, CalendarDays } from "lucide-react";
import { PageTitle } from "@/components/common/page-title";
import type { DeletedItemLogEntry } from "@/lib/definitions";
import { getDeletedItemLogs, refreshDataFromLocalStorage } from "@/lib/data";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';

export default function DeletedItemsLogPage() {
  const [logs, setLogs] = useState<DeletedItemLogEntry[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshDataFromLocalStorage(); // Ensure global mock arrays are fresh
    setLogs(getDeletedItemLogs());
  }, []);

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const logDate = new Date(log.timestamp);
        if (dateRange?.from && logDate < dateRange.from) return false;
        if (dateRange?.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (logDate > toDate) return false;
        }
        return true;
      })
      .filter(log =>
        log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.removedByCashierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.billId && log.billId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, dateRange, searchTerm]);

  return (
    <div className="space-y-6">
      <PageTitle icon={Trash2} title="Deleted Items Log" description="Track items removed from bills by cashiers." />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>Deletion Records</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Input
                type="search"
                placeholder="Search logs..."
                className="w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price/Item (PKR)</TableHead>
                <TableHead>Cashier ID</TableHead>
                <TableHead>Bill ID</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <ClientSideFormattedDate isoDateString={log.timestamp} />
                  </TableCell>
                  <TableCell>{log.itemCode}</TableCell>
                  <TableCell>{log.itemName}</TableCell>
                  <TableCell className="text-center">{log.quantityRemoved}</TableCell>
                  <TableCell className="text-right">{log.pricePerItem.toFixed(2)}</TableCell>
                  <TableCell>{log.removedByCashierId}</TableCell>
                  <TableCell>{log.billId || 'N/A'}</TableCell>
                  <TableCell>{log.reason || 'N/A'}</TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    No deletion logs found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
