
"use client";

import { useState } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/common/page-title";
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
import { Wrench, Eraser, HardDriveDownload, HardDriveUpload, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateAndDownloadBackup, restoreDataFromBackup, resetAllData } from "@/lib/data";
import type { BackupData } from "@/lib/data";

export default function SystemUtilitiesPage() {
  const { toast } = useToast();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<BackupData | null>(null);

  const handleResetSystem = () => {
    resetAllData();
    toast({
      title: "System Reset Successful",
      description: "All data has been reset to initial defaults.",
    });
    setIsResetConfirmOpen(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleManualDownloadBackup = () => {
    const success = generateAndDownloadBackup(false); // false for manual backup
    if (success) {
      toast({
        title: "Backup Downloaded",
        description: "System data backup has been successfully downloaded.",
      });
    } else {
      toast({
        title: "Backup Failed",
        description: "Could not generate or download the backup file.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsedContent = JSON.parse(content) as BackupData;
          if (parsedContent.menuItems && parsedContent.sales && parsedContent.deletedItemLogs && parsedContent.currentBusinessDay && parsedContent.deals) {
            setFileContent(parsedContent);
          } else {
            throw new Error("Invalid backup file structure.");
          }
        } catch (err) {
          toast({
            title: "Invalid File",
            description: "The selected file is not a valid JSON backup file or has incorrect structure.",
            variant: "destructive",
          });
          setSelectedFile(null);
          setFileContent(null);
          event.target.value = ''; 
        }
      };
      reader.onerror = () => {
         toast({
            title: "File Read Error",
            description: "Could not read the selected file.",
            variant: "destructive",
          });
          setSelectedFile(null);
          setFileContent(null);
          event.target.value = ''; 
      }
      reader.readAsText(file);
    } else {
      setSelectedFile(null);
      setFileContent(null);
    }
  };

  const handleRestoreSystem = () => {
    if (fileContent) {
      const success = restoreDataFromBackup(fileContent);
      if (success) {
        toast({
          title: "System Restore Successful",
          description: "Data has been restored from the backup file.",
        });
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        toast({
          title: "Restore Failed",
          description: "Could not restore data. The backup file might be corrupted or invalid.",
          variant: "destructive",
        });
      }
    }
    setIsRestoreConfirmOpen(false);
    setSelectedFile(null);
    setFileContent(null);
    const fileInput = document.getElementById('backupFile') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-8">
      <PageTitle icon={Wrench} title="System Utilities" description="Manage system data with backup, restore, and reset options." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" /> Reset System
            </CardTitle>
            <CardDescription>
              Permanently delete all sales, menu items, and logs. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This will reset the application to its initial empty state. Consider taking a backup first.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={() => setIsResetConfirmOpen(true)} className="w-full">
              <Eraser className="mr-2 h-5 w-5" /> Reset Entire System
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDriveDownload className="mr-2 h-5 w-5" /> Backup Data
            </CardTitle>
            <CardDescription>
              Download all current system data (menu items, sales, logs, business day) as a JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
              Keep this file in a safe place to restore your system later if needed.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleManualDownloadBackup} className="w-full">
              <HardDriveDownload className="mr-2 h-5 w-5" /> Download Backup File
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDriveUpload className="mr-2 h-5 w-5" /> Restore Data
            </CardTitle>
            <CardDescription>
              Restore system data from a previously downloaded JSON backup file. This will overwrite current data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backupFile">Select Backup File (.json)</Label>
              <Input id="backupFile" type="file" accept=".json" onChange={handleFileChange} />
            </div>
            {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setIsRestoreConfirmOpen(true)} 
              disabled={!selectedFile || !fileContent}
              className="w-full"
            >
              <HardDriveUpload className="mr-2 h-5 w-5" /> Restore from File
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all data, including menu items, sales history, and logs. 
              This cannot be undone. Do you want to proceed with resetting the system?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetSystem} 
              className={buttonVariants({variant: "destructive"})}
            >
              Yes, Reset System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
            <AlertDialogDescription>
              Restoring from this backup will overwrite all current data in the system. 
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreSystem}>
              Yes, Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    