
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageTitle } from "@/components/common/page-title";
import { Undo2, Search } from "lucide-react";
import { deleteSaleAndSave, refreshDataFromLocalStorage, getSales } from "@/lib/data"; 
import { useToast } from '@/hooks/use-toast';
import type { SaleEntry } from '@/lib/definitions';

export default function ReturnBillPage() {
  const [billIdToReturn, setBillIdToReturn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Optional: To show details of the bill before returning
  // const [billToReturnDetails, setBillToReturnDetails] = useState<SaleEntry | null>(null);

  useEffect(() => {
    refreshDataFromLocalStorage(); // Ensure global mock arrays are fresh
  }, []);


  const handleReturnBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billIdToReturn.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Bill ID to return.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    const returnedBill = deleteSaleAndSave(billIdToReturn.trim());

    if (!returnedBill) {
      toast({
        title: "Bill Not Found",
        description: `Bill ID "${billIdToReturn}" not found in sales records.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    toast({
      title: "Bill Returned Successfully",
      description: `Bill ID "${returnedBill.id}" (Amount: PKR ${returnedBill.totalAmount.toFixed(2)}) has been returned and its sales record removed.`,
    });

    setBillIdToReturn(''); 
    setIsLoading(false);
    // Optionally clear billToReturnDetails if you implement showing details
    // setBillToReturnDetails(null);
  };

  return (
    <div className="space-y-6">
      <PageTitle icon={Undo2} title="Return Bill" description="Process a bill return by entering its ID. This will remove the sale from records." />

      <Card className="w-full max-w-lg mx-auto">
        <form onSubmit={handleReturnBill}>
          <CardHeader>
            <CardTitle>Process Bill Return</CardTitle>
            <CardDescription>Enter the Bill ID you wish to mark as returned. The corresponding sales entry will be deleted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="billId">Bill ID to Return</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="billId"
                  type="text"
                  value={billIdToReturn}
                  onChange={(e) => setBillIdToReturn(e.target.value)}
                  placeholder="Enter exact Bill ID (e.g., bill16293847...)"
                  required
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing Return...' : 'Return Bill & Delete Sale Record'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
