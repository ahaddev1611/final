
"use client";

import { useState, useEffect } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { PlusCircle, Edit, Trash2, Package, Search } from "lucide-react";
import { PageTitle } from "@/components/common/page-title";
import type { MenuItem } from "@/lib/definitions";
import { getMenuItems, addMenuItemAndSave, updateMenuItemAndSave, deleteMenuItemAndSave, refreshDataFromLocalStorage } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function ManageItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem> | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    refreshDataFromLocalStorage(); // Ensure global mock arrays are fresh
    setItems(getMenuItems());
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenFormDialog = (item?: MenuItem) => {
    if (item) {
      setCurrentItem(item);
      setItemName(item.name);
      setItemCode(item.code);
      setItemPrice(item.price.toString());
      setItemCategory(item.category || '');
    } else {
      setCurrentItem({}); // For new item
      setItemName('');
      setItemCode('');
      setItemPrice('');
      setItemCategory('');
    }
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
    setCurrentItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemCode || !itemPrice) {
      toast({ title: "Error", description: "Name, Code, and Price are required.", variant: "destructive" });
      return;
    }
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: "Error", description: "Invalid price.", variant: "destructive" });
      return;
    }

    if (currentItem && currentItem.id) { // Editing existing item
      const updatedItemData = { ...currentItem, name: itemName, code: itemCode, price, category: itemCategory } as MenuItem;
      updateMenuItemAndSave(updatedItemData);
      toast({ title: "Success", description: `Item "${itemName}" updated.` });
    } else { // Adding new item
      const newItem: MenuItem = {
        id: `item${Date.now()}`, 
        name: itemName,
        code: itemCode,
        price,
        category: itemCategory,
      };
      addMenuItemAndSave(newItem);
      toast({ title: "Success", description: `Item "${itemName}" added.` });
    }
    setItems(getMenuItems()); // Refresh local state from source
    handleCloseFormDialog();
  };

  const handleOpenDeleteConfirmationDialog = (item: MenuItem) => {
    setItemToDelete(item);
    setIsConfirmDeleteDialogOpen(true);
  };

  const executeDeleteItem = () => {
    if (itemToDelete) {
      deleteMenuItemAndSave(itemToDelete.id);
      toast({ title: "Success", description: `Item "${itemToDelete.name}" deleted.` });
      setItems(getMenuItems()); // Refresh local state from source
      setIsConfirmDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle icon={Package} title="Manage Menu Items" description="Add, edit, or delete menu items.">
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
        </Button>
      </PageTitle>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by item name or code..."
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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price (PKR)</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category || 'N/A'}</TableCell>
                  <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenFormDialog(item)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteConfirmationDialog(item)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No items found. Add new items to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {currentItem?.id ? 'Update the details of the menu item.' : 'Enter the details for the new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-code" className="text-right">Code</Label>
                <Input id="item-code" value={itemCode} onChange={(e) => setItemCode(e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-name" className="text-right">Name</Label>
                <Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-category" className="text-right">Category</Label>
                <Input id="item-category" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="col-span-3" placeholder="e.g., Main Course" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-price" className="text-right">Price (PKR)</Label>
                <Input id="item-price" type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="col-span-3" required min="0" step="0.01" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseFormDialog}>Cancel</Button>
              <Button type="submit">{currentItem?.id ? 'Save Changes' : 'Add Item'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              "{itemToDelete?.name || 'this item'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteItem} className={buttonVariants({variant: "destructive"})}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
