
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Tags, Search, XCircle, PackagePlus } from "lucide-react";
import { PageTitle } from "@/components/common/page-title";
import type { Deal, DealItem, MenuItem } from "@/lib/definitions";
import { getDeals, addDealAndSave, updateDealAndSave, deleteDealAndSave, getMenuItems, refreshDataFromLocalStorage } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ManageDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [currentDeal, setCurrentDeal] = useState<Partial<Deal> | null>(null); // For add/edit
  
  // Form state for the deal
  const [dealId, setDealId] = useState('');
  const [dealNumber, setDealNumber] = useState('');
  const [dealName, setDealName] = useState('');
  const [dealDescription, setDealDescription] = useState('');
  const [dealItems, setDealItems] = useState<DealItem[]>([]);
  const [isDealActive, setIsDealActive] = useState(true);

  // State for adding an item to the current deal being edited/created
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [currentDealItemQuantity, setCurrentDealItemQuantity] = useState('1');
  const [currentDealItemPrice, setCurrentDealItemPrice] = useState('');

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    refreshDataFromLocalStorage();
    setDeals(getDeals());
    setMenuItems(getMenuItems());
  }, []);

  const filteredDeals = deals.filter(deal =>
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.dealNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setDealId('');
    setDealNumber('');
    setDealName('');
    setDealDescription('');
    setDealItems([]);
    setIsDealActive(true);
    setCurrentDeal(null);
    setSelectedMenuItemId('');
    setCurrentDealItemQuantity('1');
    setCurrentDealItemPrice('');
  };

  const handleOpenFormDialog = (deal?: Deal) => {
    resetForm();
    if (deal) {
      setCurrentDeal(deal);
      setDealId(deal.id);
      setDealNumber(deal.dealNumber);
      setDealName(deal.name);
      setDealDescription(deal.description || '');
      setDealItems(Array.isArray(deal.items) ? [...deal.items] : []); // Ensure deal.items is an array
      setIsDealActive(deal.isActive);
    } else {
      setCurrentDeal({}); // For new deal
    }
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
    resetForm();
  };

  const handleAddMenuItemToDeal = () => {
    if (!selectedMenuItemId) {
      toast({ title: "Select Item", description: "Please select a menu item to add.", variant: "destructive" });
      return;
    }
    const menuItem = menuItems.find(mi => mi.id === selectedMenuItemId);
    if (!menuItem) return;

    const quantity = parseInt(currentDealItemQuantity);
    const price = parseFloat(currentDealItemPrice);

    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Invalid Quantity", description: "Quantity must be a positive number.", variant: "destructive" });
      return;
    }
    if (isNaN(price) || price < 0) {
      toast({ title: "Invalid Price", description: "Deal price must be a non-negative number.", variant: "destructive" });
      return;
    }

    const existingDealItemIndex = dealItems.findIndex(di => di.menuItemId === menuItem.id);
    const newDealItem: DealItem = {
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity,
      dealPricePerItem: price,
      originalPricePerItem: menuItem.price,
    };

    if (existingDealItemIndex > -1) {
      const updatedDealItems = [...dealItems];
      updatedDealItems[existingDealItemIndex] = newDealItem;
      setDealItems(updatedDealItems);
    } else {
      setDealItems(prev => [...prev, newDealItem]);
    }
    
    setSelectedMenuItemId('');
    setCurrentDealItemQuantity('1');
    setCurrentDealItemPrice('');
  };

  const handleRemoveMenuItemFromDeal = (menuItemIdToRemove: string) => {
    setDealItems(prev => prev.filter(di => di.menuItemId !== menuItemIdToRemove));
  };

  const calculateTotalDealPrice = useCallback(() => {
    return dealItems.reduce((total, item) => {
      const itemPrice = Number(item.dealPricePerItem) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);
  }, [dealItems]);

  const handleSubmitDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealNumber || !dealName || dealItems.length === 0) {
      toast({ title: "Error", description: "Deal Number, Name, and at least one item are required.", variant: "destructive" });
      return;
    }

    const totalDealPrice = calculateTotalDealPrice();
    
    const dealData: Omit<Deal, 'id'> & { id?: string } = {
      dealNumber,
      name: dealName,
      description: dealDescription,
      items: dealItems,
      calculatedTotalDealPrice: totalDealPrice,
      isActive: isDealActive,
    };

    if (currentDeal && currentDeal.id) { 
      const result = updateDealAndSave({ ...dealData, id: currentDeal.id } as Deal);
      if (result) {
        toast({ title: "Success", description: `Deal "${dealName}" updated.` });
      } else {
        toast({ title: "Error", description: "Failed to update deal. Deal number might be a duplicate.", variant: "destructive" });
        return; 
      }
    } else { 
      const newDealId = `deal${Date.now()}`;
      const result = addDealAndSave({ ...dealData, id: newDealId } as Deal);
      if (result) {
        toast({ title: "Success", description: `Deal "${dealName}" added.` });
      } else {
        toast({ title: "Error", description: "Failed to add deal. Deal number might be a duplicate.", variant: "destructive" });
        return; 
      }
    }
    setDeals(getDeals());
    handleCloseFormDialog();
  };

  const handleOpenDeleteConfirmationDialog = (deal: Deal) => {
    setDealToDelete(deal);
    setIsConfirmDeleteDialogOpen(true);
  };

  const executeDeleteDeal = () => {
    if (dealToDelete) {
      deleteDealAndSave(dealToDelete.id);
      toast({ title: "Success", description: `Deal "${dealToDelete.name}" deleted.` });
      setDeals(getDeals());
      setIsConfirmDeleteDialogOpen(false);
      setDealToDelete(null);
    }
  };
  
  useEffect(() => {
    const menuItem = menuItems.find(mi => mi.id === selectedMenuItemId);
    if (menuItem) {
      setCurrentDealItemPrice(menuItem.price.toString());
    } else {
      setCurrentDealItemPrice('');
    }
  }, [selectedMenuItemId, menuItems]);


  return (
    <div className="space-y-6">
      <PageTitle icon={Tags} title="Manage Deals" description="Create, edit, or delete promotional deals.">
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Deal
        </Button>
      </PageTitle>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by deal name or number..."
          className="pl-10 w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Price (PKR)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.length > 0 ? filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.dealNumber}</TableCell>
                  <TableCell>{deal.name}</TableCell>
                  <TableCell>{deal.items.map(di => `${Number(di.quantity) || 0}x ${di.name || 'Unknown Item'}`).join(', ')}</TableCell>
                  <TableCell className="text-right">{(Number(deal.calculatedTotalDealPrice) || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${deal.isActive ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300'}`}>
                      {deal.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenFormDialog(deal)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteConfirmationDialog(deal)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No deals found. Add new deals to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCloseFormDialog(); else setIsFormDialogOpen(true);}}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentDeal?.id ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
            <DialogDescription>
              {currentDeal?.id ? 'Update the details of the deal.' : 'Enter the details for the new deal.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDeal}>
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="grid gap-6 py-4 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deal-number">Deal Number <span className="text-destructive">*</span></Label>
                    <Input id="deal-number" value={dealNumber} onChange={(e) => setDealNumber(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="deal-name">Deal Name <span className="text-destructive">*</span></Label>
                    <Input id="deal-name" value={dealName} onChange={(e) => setDealName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="deal-description">Description</Label>
                  <Textarea id="deal-description" value={dealDescription} onChange={(e) => setDealDescription(e.target.value)} placeholder="Optional details about the deal" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="deal-active" checked={isDealActive} onCheckedChange={setIsDealActive} />
                  <Label htmlFor="deal-active">Deal is Active</Label>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Items to Deal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <Label htmlFor="menu-item-select">Menu Item <span className="text-destructive">*</span></Label>
                         <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
                          <SelectTrigger id="menu-item-select">
                            <SelectValue placeholder="Select an item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {menuItems.map(mi => (
                              <SelectItem key={mi.id} value={mi.id}>{mi.name} ({mi.code}) - PKR {(Number(mi.price) || 0).toFixed(2)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                       <div>
                        <Label htmlFor="deal-item-qty">Quantity <span className="text-destructive">*</span></Label>
                        <Input id="deal-item-qty" type="number" value={currentDealItemQuantity} onChange={e => setCurrentDealItemQuantity(e.target.value)} placeholder="1" min="1" />
                      </div>
                       <div>
                        <Label htmlFor="deal-item-price">Deal Price/Item <span className="text-destructive">*</span></Label>
                        <Input id="deal-item-price" type="number" value={currentDealItemPrice} onChange={e => setCurrentDealItemPrice(e.target.value)} placeholder="e.g., 100" min="0" step="0.01"/>
                      </div>
                    </div>
                     <Button type="button" onClick={handleAddMenuItemToDeal} disabled={!selectedMenuItemId}>
                        <PackagePlus className="mr-2 h-4 w-4" /> Add/Update Item in Deal
                      </Button>
                  </CardContent>
                </Card>

                {dealItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Items in this Deal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {dealItems.map(di => (
                          <li key={di.menuItemId} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                              <p className="font-medium">{(di.name || 'Unknown Item')} (x{Number(di.quantity) || 0})</p>
                              <p className="text-sm text-muted-foreground">
                                Deal Price: PKR {(Number(di.dealPricePerItem) || 0).toFixed(2)} each (Original: PKR {(Number(di.originalPricePerItem) || 0).toFixed(2)})
                              </p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMenuItemFromDeal(di.menuItemId)}>
                              <XCircle className="h-5 w-5 text-destructive" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-right font-semibold text-lg">
                        Calculated Total Deal Price: PKR {(calculateTotalDealPrice() || 0).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{currentDeal?.id ? 'Save Changes' : 'Create Deal'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the deal
              "{dealToDelete?.name || 'this deal'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDealToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteDeal} className={buttonVariants({variant: "destructive"})}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

