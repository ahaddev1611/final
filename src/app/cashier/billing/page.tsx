
"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ItemSearch } from '@/components/cashier/item-search';
import { CurrentBill } from '@/components/cashier/current-bill';
import { InvoiceModal } from '@/components/cashier/invoice-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle } from '@/components/common/page-title';
import { FileText, Receipt, AlertCircle } from 'lucide-react';
import type { MenuItem, BillItem, Bill, DeletedItemLogEntry, Deal, DealItem as DealDefinitionItem } from '@/lib/definitions';
import { getMenuItems, addSaleAndSave, addDeletedItemLogAndSave, refreshDataFromLocalStorage, getDeals } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

function BillingPageContent() {
  const searchParams = useSearchParams();
  const cashierIdFromQuery = searchParams.get('cashierId');

  const [availableMenuItems, setAvailableMenuItems] = useState<MenuItem[]>([]);
  const [availableDeals, setAvailableDeals] = useState<Deal[]>([]);
  const [currentBillItems, setCurrentBillItems] = useState<BillItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [cashierId, setCashierId] = useState<string | null>(cashierIdFromQuery);

  const [generatedInvoice, setGeneratedInvoice] = useState<Bill | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    refreshDataFromLocalStorage();
    setAvailableMenuItems(getMenuItems());
    setAvailableDeals(getDeals().filter(d => d.isActive)); // Only active deals
  }, []);

  useEffect(() => {
    if (cashierIdFromQuery) {
      setCashierId(cashierIdFromQuery);
    }
  }, [cashierIdFromQuery]);

  const handleAddMenuItemToBill = (itemToAdd: MenuItem) => {
    setCurrentBillItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.menuItemId === itemToAdd.id && 
        item.price === itemToAdd.price && // Ensure price matches (for non-deal items)
        !item.dealContext // Not part of a deal
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.billItemId === existingItem.billItemId
            ? { ...item, quantity: item.quantity + 1, totalPrice: item.price * (item.quantity + 1) }
            : item
        );
      }
      const newBillItem: BillItem = {
        billItemId: `billItem_${itemToAdd.id}_${Date.now()}`,
        menuItemId: itemToAdd.id,
        code: itemToAdd.code,
        name: itemToAdd.name,
        price: itemToAdd.price,
        quantity: 1,
        totalPrice: itemToAdd.price,
        category: itemToAdd.category,
      };
      return [...prevItems, newBillItem];
    });
    toast({ title: "Item Added", description: `${itemToAdd.name} added to bill.`});
  };

  const handleAddDealToBill = (dealToAdd: Deal) => {
    const dealBillItems: BillItem[] = [];
    for (const dealItem of dealToAdd.items) {
      const baseMenuItem = availableMenuItems.find(mi => mi.id === dealItem.menuItemId);
      if (!baseMenuItem) {
        toast({ title: "Error", description: `Menu item ${dealItem.name} in deal not found. Skipping.`, variant: "destructive" });
        continue;
      }
      const newBillItem: BillItem = {
        billItemId: `billItem_deal_${dealItem.menuItemId}_${Date.now()}`, // Unique ID for deal item instance
        menuItemId: baseMenuItem.id,
        code: baseMenuItem.code,
        name: baseMenuItem.name,
        price: dealItem.dealPricePerItem,
        quantity: dealItem.quantity,
        totalPrice: dealItem.dealPricePerItem * dealItem.quantity,
        category: baseMenuItem.category,
        dealContext: {
          dealId: dealToAdd.id,
          dealName: dealToAdd.name,
          originalPricePerItem: dealItem.originalPricePerItem,
        }
      };
      dealBillItems.push(newBillItem);
    }
    setCurrentBillItems(prevItems => [...prevItems, ...dealBillItems]);
    toast({ title: "Deal Added", description: `Deal "${dealToAdd.name}" added to bill.`});
  };

  const handleUpdateQuantity = (billItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Find the item to log its details before removing
      const itemBeingRemoved = currentBillItems.find(item => item.billItemId === billItemId);
      if (itemBeingRemoved) {
        logRemovedItem(itemBeingRemoved, itemBeingRemoved.quantity, true);
      }
      setCurrentBillItems(prevItems => prevItems.filter(item => item.billItemId !== billItemId));
      return;
    }
    setCurrentBillItems(prevItems =>
      prevItems.map(item =>
        item.billItemId === billItemId
          ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
          : item
      )
    );
  };

  const logRemovedItem = (itemToRemove: BillItem, quantityRemoved: number, isUpdateLeadingToRemoval = false) => {
      const logEntry: DeletedItemLogEntry = {
        id: `del${Date.now()}`,
        menuItemId: itemToRemove.menuItemId,
        itemName: itemToRemove.name,
        itemCode: itemToRemove.code,
        quantityRemoved: quantityRemoved,
        pricePerItem: itemToRemove.price,
        removedByCashierId: cashierId || 'unknown_cashier',
        timestamp: new Date().toISOString(),
        reason: isUpdateLeadingToRemoval ? 'Quantity reduced to zero' : 'Removed by cashier',
        billId: generatedInvoice?.id, // This will be undefined if bill not yet generated
        isDealItem: !!itemToRemove.dealContext,
        dealName: itemToRemove.dealContext?.dealName,
      };
      addDeletedItemLogAndSave(logEntry);
  };

  const handleRemoveItemFromBill = (billItemId: string) => {
    const itemToRemove = currentBillItems.find(item => item.billItemId === billItemId);
    if (itemToRemove) {
      logRemovedItem(itemToRemove, itemToRemove.quantity, false);
      setCurrentBillItems(prevItems => prevItems.filter(item => item.billItemId !== billItemId));
      toast({ title: "Item Removed", description: `${itemToRemove.name} removed from bill.`, variant: "destructive" });
    }
  };

  const handleGenerateInvoice = () => {
    if (!cashierId) {
      toast({ title: "Error", description: "Cashier ID not found. Please re-login.", variant: "destructive" });
      return;
    }
    if (currentBillItems.length === 0) {
      toast({ title: "Error", description: "Cannot generate an empty invoice.", variant: "destructive" });
      return;
    }

    const subtotal = currentBillItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const newBill: Bill = {
      id: `bill${Date.now()}`,
      tableNumber,
      customerName,
      waiterName,
      items: currentBillItems,
      subtotal,
      totalAmount: subtotal, 
      createdAt: new Date().toISOString(),
      cashierId: cashierId,
    };

    addSaleAndSave(newBill);
    setGeneratedInvoice(newBill); // This will now contain the billId for subsequent logging
    setIsInvoiceModalOpen(true);
    
    setCurrentBillItems([]);
    setTableNumber('');
    setCustomerName('');
    setWaiterName('');
    toast({ title: "Invoice Generated", description: `Bill ${newBill.id} processed and recorded.`});
  };

  if (!cashierId && typeof window !== 'undefined' && !cashierIdFromQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            Cashier information is missing. Please <Link href="/login/cashier" className="underline hover:text-destructive-foreground">re-login</Link>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!cashierId && cashierIdFromQuery) {
     return <div>Loading cashier details...</div>;
  }


  return (
    <div className="space-y-6">
      <PageTitle icon={Receipt} title="Billing Station" description={`Cashier: ${cashierId || 'Loading...'} | Create new bills and manage customer orders.`} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input id="tableNumber" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g., 5A" />
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g., John Doe" />
              </div>
              <div>
                <Label htmlFor="waiterName">Waiter Name (Optional)</Label>
                <Input id="waiterName" value={waiterName} onChange={e => setWaiterName(e.target.value)} placeholder="e.g., Ali" />
              </div>
            </CardContent>
          </Card>
          
          <ItemSearch 
            menuItems={availableMenuItems} 
            deals={availableDeals}
            onAddMenuItem={handleAddMenuItemToBill} 
            onAddDeal={handleAddDealToBill}
          />
        </div>

        <div className="lg:col-span-2">
          <CurrentBill
            billItems={currentBillItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItemFromBill}
          />
           <Button 
            className="w-full mt-6 py-3 text-lg" 
            onClick={handleGenerateInvoice}
            disabled={currentBillItems.length === 0 || !cashierId}
          >
            <FileText className="mr-2 h-5 w-5" /> Generate Invoice
          </Button>
        </div>
      </div>

      <InvoiceModal
        bill={generatedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div>Loading cashier details...</div>}>
      <BillingPageContent />
    </Suspense>
  );
}
