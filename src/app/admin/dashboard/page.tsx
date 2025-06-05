
"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, AlertTriangle, CalendarClock, PlayCircle } from "lucide-react";
import { PageTitle } from "@/components/common/page-title";
import { getMenuItems, getSales, getDeletedItemLogs, refreshDataFromLocalStorage, getCurrentBusinessDay, advanceToNextBusinessDay, generateAndDownloadBackup } from "@/lib/data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { SaleEntry } from '@/lib/definitions';
import { Button } from "@/components/ui/button";
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
import { format, parseISO } from 'date-fns';

export default function AdminDashboardPage() {
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [totalMenuItems, setTotalMenuItems] = useState(0);
  const [totalDeletedLogEntries, setTotalDeletedLogEntries] = useState(0);
  const [recentSalesChartData, setRecentSalesChartData] = useState<any[]>([]);
  const [currentBusinessDayDisplay, setCurrentBusinessDayDisplay] = useState('');
  const [isConfirmDayEndOpen, setIsConfirmDayEndOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refreshDataFromLocalStorage(); 
    
    const currentSales = getSales();
    const currentMenuItems = getMenuItems();
    const currentDeletedLogs = getDeletedItemLogs();
    const businessDay = getCurrentBusinessDay();

    setCurrentBusinessDayDisplay(format(parseISO(businessDay), "PPP")); 

    const calculatedTotalSales = currentSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    setTotalSalesAmount(calculatedTotalSales);
    setSalesCount(currentSales.length);
    setTotalMenuItems(currentMenuItems.length);
    setTotalDeletedLogEntries(currentDeletedLogs.length);

    const sortedSales = [...currentSales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(sale => ({
        name: `Bill ${sale.id.slice(-4)}`,
        total: sale.totalAmount,
        date: new Date(sale.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
      }));
    setRecentSalesChartData(sortedSales);
  }, []);
  
  const chartConfig = {
    sales: {
      label: "Sales (PKR)",
      color: "hsl(var(--accent))",
    },
  } satisfies ChartConfig;

  const handleAdvanceDay = () => {
    const newBusinessDay = advanceToNextBusinessDay();
    setCurrentBusinessDayDisplay(format(parseISO(newBusinessDay), "PPP"));
    toast({
      title: "Business Day Advanced",
      description: `The current business day is now ${format(parseISO(newBusinessDay), "PPP")}. Sales for closing will be based on this day.`,
    });

    const backupSuccess = generateAndDownloadBackup(true); // true for auto backup
    if (backupSuccess) {
      toast({
        title: "Automatic Backup Successful",
        description: "A backup file has been automatically downloaded.",
      });
    } else {
      toast({
        title: "Automatic Backup Failed",
        description: "Could not generate or download the automatic backup file.",
        variant: "destructive",
      });
    }
    
    setIsConfirmDayEndOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Admin Dashboard" description="Overview of your restaurant's performance." />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalSalesAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {salesCount} transactions (all time)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMenuItems}</div>
            <p className="text-xs text-muted-foreground">Currently available items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logged Deletions</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeletedLogEntries}</div>
            <p className="text-xs text-muted-foreground">Item deletions from bills (all time)</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Business Day</CardTitle>
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{currentBusinessDayDisplay || 'Loading...'}</div>
            <Button size="sm" className="mt-2 w-full" onClick={() => setIsConfirmDayEndOpen(true)}>
              <PlayCircle className="mr-2 h-4 w-4" /> End Day & Start Next
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales Activity (Last 5)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          {recentSalesChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={recentSalesChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => `PKR ${value / 1000}k`} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend />
                <Bar dataKey="total" fill="var(--color-sales)" radius={4} name="Sales (PKR)" />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground">No recent sales data to display.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmDayEndOpen} onOpenChange={setIsConfirmDayEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Day End</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the current business day ({currentBusinessDayDisplay}) and start the next one? 
              This will change the date used for the daily closing system and an automatic backup will be downloaded. This action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdvanceDay}
            >
              End Day & Start Next
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    