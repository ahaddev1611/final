
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PageTitle } from "@/components/common/page-title";
import { getSales, initialMockUsers, refreshDataFromLocalStorage, getCurrentBusinessDay } from "@/lib/data"; 
import type { SaleEntry, User } from "@/lib/definitions";
import { Calculator, Coins, CheckCircle2, AlertCircle, Info as InfoIcon, Calendar as CalendarIconLucide } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from 'date-fns';

const cashierUsers = initialMockUsers.filter(user => user.role === 'cashier');

export default function ClosingSystemPage() {
  const [selectedCashierId, setSelectedCashierId] = useState<string>('');
  const [cashAmount, setCashAmount] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [otherAmount, setOtherAmount] = useState('');
  const [returnAmount, setReturnAmount] = useState(''); 
  
  const [totalSystemSalesForDay, setTotalSystemSalesForDay] = useState<number>(0);
  const [totalSubmitted, setTotalSubmitted] = useState<number | null>(null);
  const [difference, setDifference] = useState<number | null>(null);
  
  const [systemBusinessDay, setSystemBusinessDay] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const { toast } = useToast();

  useEffect(() => {
    refreshDataFromLocalStorage(); 
    const businessDay = getCurrentBusinessDay();
    setSystemBusinessDay(businessDay);
    if (businessDay && isValid(parseISO(businessDay))) {
      setSelectedDate(parseISO(businessDay));
    } else {
      setSelectedDate(new Date()); // Fallback to current date if systemBusinessDay is invalid
    }
  }, []);


  useEffect(() => {
    if (!selectedCashierId || !selectedDate) {
      setTotalSystemSalesForDay(0);
      setTotalSubmitted(null);
      setDifference(null);
      setCashAmount('');
      setExpenseAmount('');
      setOtherAmount('');
      setReturnAmount('');
      return;
    }
    
    const currentSales = getSales();
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
    const salesForDayByCashier = currentSales.filter(sale => 
      sale.cashierId === selectedCashierId && 
      sale.createdAt.startsWith(selectedDateString)
    );
    const totalSales = salesForDayByCashier.reduce((sum, sale) => sum + sale.totalAmount, 0);
    setTotalSystemSalesForDay(totalSales);
    
    // Reset dependent states when cashier or date changes
    setTotalSubmitted(null);
    setDifference(null);
    setCashAmount('');
    setExpenseAmount('');
    setOtherAmount('');
    setReturnAmount('');

  }, [selectedCashierId, selectedDate]);

  const handleCalculateClosing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCashierId) {
        toast({
            title: "Select Cashier",
            description: "Please select a cashier to calculate closing.",
            variant: "destructive",
        });
        return;
    }
    if (!selectedDate) {
        toast({
            title: "Select Date",
            description: "Please select a date for closing.",
            variant: "destructive",
        });
        return;
    }

    const cash = parseFloat(cashAmount) || 0;
    const expenses = parseFloat(expenseAmount) || 0;
    const other = parseFloat(otherAmount) || 0;
    const returns = parseFloat(returnAmount) || 0;

    if (cash < 0 || expenses < 0 || other < 0 || returns < 0) {
        toast({
            title: "Invalid Input",
            description: "Amounts cannot be negative.",
            variant: "destructive",
        });
        return;
    }

    const submitted = cash + expenses + other + returns;
    setTotalSubmitted(submitted);
    setDifference(totalSystemSalesForDay - submitted);
  };
  
  let diffIcon = null;
  let diffBgClass = '';
  let diffTextClass = '';
  let diffMessage = '';

  if (difference !== null) {
    if (difference === 0) {
      diffIcon = <CheckCircle2 className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />;
      diffBgClass = 'bg-green-100 dark:bg-green-800/30';
      diffTextClass = 'text-green-700 dark:text-green-300';
      diffMessage = 'Submitted amount matches system sales. Well done!';
    } else if (difference > 0) { 
      diffIcon = <AlertCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />;
      diffBgClass = 'bg-red-100 dark:bg-red-800/30';
      diffTextClass = 'text-red-700 dark:text-red-300';
      diffMessage = `System has PKR ${difference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more sales recorded than submitted (Shortage).`;
    } else { 
      diffIcon = <InfoIcon className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />;
      diffBgClass = 'bg-blue-100 dark:bg-blue-800/30';
      diffTextClass = 'text-blue-700 dark:text-blue-300';
      diffMessage = `Submitted amount is PKR ${Math.abs(difference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more than system sales (Overage). Please verify.`;
    }
  }

  const formattedSystemBusinessDay = systemBusinessDay && isValid(parseISO(systemBusinessDay)) ? format(parseISO(systemBusinessDay), "PPP") : 'Loading...';
  const formattedSelectedDateForDisplay = selectedDate ? format(selectedDate, "PPP") : 'Select a date';

  return (
    <div className="space-y-6">
      <PageTitle 
        icon={Calculator} 
        title="Daily Closing System" 
        description={`Calculate and verify sales. System's current business day: ${formattedSystemBusinessDay}`} 
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Closing Criteria</CardTitle>
          <CardDescription>
            Choose the date and cashier for the closing report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label htmlFor="closingDate">Select Closing Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="closingDate"
                        variant={"outline"}
                        className="w-full md:w-1/2 justify-start text-left font-normal"
                    >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date("2000-01-01")} // Example range
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div>
                <Label htmlFor="cashierSelect">Select Cashier</Label>
                <Select onValueChange={setSelectedCashierId} value={selectedCashierId}>
                    <SelectTrigger id="cashierSelect" className="w-full md:w-1/2">
                    <SelectValue placeholder="Select a cashier..." />
                    </SelectTrigger>
                    <SelectContent>
                    {cashierUsers.map(cashier => (
                        <SelectItem key={cashier.id} value={cashier.id}>
                        {cashier.username} (ID: {cashier.id})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      {selectedCashierId && selectedDate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Sales ({formattedSelectedDateForDisplay})</CardTitle>
              <CardDescription>For cashier: {initialMockUsers.find(u=>u.id === selectedCashierId)?.username || selectedCashierId}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">PKR {totalSystemSalesForDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">Total expected sales based on system records for {initialMockUsers.find(u=>u.id === selectedCashierId)?.username || selectedCashierId} on {formattedSelectedDateForDisplay}.</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Submit Closing Figures for {initialMockUsers.find(u=>u.id === selectedCashierId)?.username || selectedCashierId}</CardTitle>
              <CardDescription>Enter amounts for {formattedSelectedDateForDisplay}.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCalculateClosing}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cashAmount">Physical Cash Submitted (PKR)</Label>
                  <Input 
                    id="cashAmount" 
                    type="number" 
                    value={cashAmount} 
                    onChange={(e) => setCashAmount(e.target.value)} 
                    placeholder="e.g., 50000"
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="expenseAmount">Expenses Paid from Till (PKR)</Label>
                  <Input 
                    id="expenseAmount" 
                    type="number" 
                    value={expenseAmount} 
                    onChange={(e) => setExpenseAmount(e.target.value)} 
                    placeholder="e.g., 1500 (with vouchers)" 
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="returnAmount">Returns Processed by Cashier (PKR)</Label>
                  <Input 
                    id="returnAmount" 
                    type="number" 
                    value={returnAmount} 
                    onChange={(e) => setReturnAmount(e.target.value)} 
                    placeholder="e.g., 350 (total value of returned bills)" 
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="otherAmount">Other Vouchers/Adjustments (PKR)</Label>
                  <Input 
                    id="otherAmount" 
                    type="number" 
                    value={otherAmount} 
                    onChange={(e) => setOtherAmount(e.target.value)} 
                    placeholder="e.g., 500 (staff meal deductions, etc.)" 
                    min="0"
                    step="0.01"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={!selectedCashierId || !selectedDate}>
                  <Coins className="mr-2 h-5 w-5" /> Calculate Difference
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {selectedCashierId && selectedDate && totalSubmitted !== null && difference !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Closing Summary for {initialMockUsers.find(u=>u.id === selectedCashierId)?.username || selectedCashierId} on {formattedSelectedDateForDisplay}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <span className="font-medium">Total Accounted by Cashier:</span>
                <span className="font-bold text-xl">PKR {totalSubmitted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-md ${diffBgClass}`}>
              <div className="flex items-center">
                {diffIcon}
                <span className="font-medium">Difference (System Sales - Accounted):</span>
              </div>
              <span className={`font-bold text-xl ${diffTextClass}`}>
                PKR {difference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {difference !== null && <p className={`text-sm ${diffTextClass}`}>{diffMessage}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

