
import type { MenuItem, User, SaleEntry, DeletedItemLogEntry, Deal } from './definitions';
import { format, add, parseISO, isValid } from 'date-fns';

const IS_CLIENT = typeof window !== 'undefined';

function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (!IS_CLIENT) {
    return typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
      ? { ...defaultValue }
      : Array.isArray(defaultValue)
      ? (defaultValue.map(item => (typeof item === 'object' && item !== null ? { ...item } : item)) as unknown as T)
      : defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      const parsed = JSON.parse(storedValue);
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        console.warn(`LocalStorage item for ${key} is not an array as expected. Resetting to default.`);
        saveToLocalStorage(key, defaultValue);
        return Array.isArray(defaultValue)
          ? (defaultValue.map(item => (typeof item === 'object' && item !== null ? { ...item } : item)) as unknown as T)
          : defaultValue;
      }
      return parsed;
    }
    saveToLocalStorage(key, defaultValue);
    return typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
      ? { ...defaultValue }
      : Array.isArray(defaultValue)
      ? (defaultValue.map(item => (typeof item === 'object' && item !== null ? { ...item } : item)) as unknown as T)
      : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage. Resetting to default.`, error);
    saveToLocalStorage(key, defaultValue);
    return typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
      ? { ...defaultValue }
      : Array.isArray(defaultValue)
      ? (defaultValue.map(item => (typeof item === 'object' && item !== null ? { ...item } : item)) as unknown as T)
      : defaultValue;
  }
}


function saveToLocalStorage<T>(key: string, data: T): void {
  if (!IS_CLIENT) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
}

export const STORAGE_KEYS = {
  SALES: 'alshawaya_sales',
  MENU_ITEMS: 'alshawaya_menu_items',
  DELETED_ITEMS: 'alshawaya_deleted_items_log',
  CURRENT_BUSINESS_DAY: 'alshawaya_current_business_day',
  DEALS: 'alshawaya_deals',
};

export const initialMockUsers: User[] = [
  { id: 'admin001', username: 'admin', password: 'password', role: 'admin' },
  { id: 'ca1', username: 'ca1', password: 'password', role: 'cashier' },
  { id: 'ca2', username: 'ca2', password: 'password', role: 'cashier' },
];
export const initialMockMenuItems: MenuItem[] = [];
export const initialMockSales: SaleEntry[] = [];
export const initialMockDeletedItemLogs: DeletedItemLogEntry[] = [];
export const initialMockDeals: Deal[] = [];

function initializeBusinessDay(): string {
  if (!IS_CLIENT) {
    return "2024-01-01"; 
  }
  const systemCurrentDate = format(new Date(), 'yyyy-MM-dd');
  const loadedDay = loadFromLocalStorage(STORAGE_KEYS.CURRENT_BUSINESS_DAY, systemCurrentDate);

  if (isValid(parseISO(loadedDay))) {
    return loadedDay;
  }
  
  saveToLocalStorage(STORAGE_KEYS.CURRENT_BUSINESS_DAY, systemCurrentDate);
  return systemCurrentDate;
}


export let mockMenuItems: MenuItem[] = loadFromLocalStorage(STORAGE_KEYS.MENU_ITEMS, initialMockMenuItems);
export let mockSales: SaleEntry[] = loadFromLocalStorage(STORAGE_KEYS.SALES, initialMockSales);
export let mockDeletedItemLogs: DeletedItemLogEntry[] = loadFromLocalStorage(STORAGE_KEYS.DELETED_ITEMS, initialMockDeletedItemLogs);
export let mockDeals: Deal[] = loadFromLocalStorage(STORAGE_KEYS.DEALS, initialMockDeals);
let currentBusinessDay: string = initializeBusinessDay();


export function getCurrentBusinessDay(): string {
  if (IS_CLIENT) {
    const dayFromStorage = loadFromLocalStorage(STORAGE_KEYS.CURRENT_BUSINESS_DAY, currentBusinessDay);
    if (isValid(parseISO(dayFromStorage))) {
      currentBusinessDay = dayFromStorage; 
    } else {
      console.warn(`Business day '${dayFromStorage}' from storage is invalid. Resetting to system date.`);
      currentBusinessDay = format(new Date(), 'yyyy-MM-dd');
      saveToLocalStorage(STORAGE_KEYS.CURRENT_BUSINESS_DAY, currentBusinessDay);
    }
  }
  return currentBusinessDay;
}

export function advanceToNextBusinessDay(): string {
  getCurrentBusinessDay(); 

  let parsedCurrentDay = parseISO(currentBusinessDay);
  if (!isValid(parsedCurrentDay)) {
    console.warn(`Cannot advance invalid business day '${currentBusinessDay}'. Using system date as base.`);
    parsedCurrentDay = parseISO(format(new Date(), 'yyyy-MM-dd'));
  }
  const nextDay = add(parsedCurrentDay, { days: 1 });
  currentBusinessDay = format(nextDay, 'yyyy-MM-dd');
  saveToLocalStorage(STORAGE_KEYS.CURRENT_BUSINESS_DAY, currentBusinessDay);
  return currentBusinessDay;
}


export function getMenuItems(): MenuItem[] {
  if (IS_CLIENT) {
     mockMenuItems = loadFromLocalStorage(STORAGE_KEYS.MENU_ITEMS, initialMockMenuItems);
  }
  return [...mockMenuItems];
}

export function addMenuItemAndSave(item: MenuItem) {
  mockMenuItems.push(item);
  saveToLocalStorage(STORAGE_KEYS.MENU_ITEMS, mockMenuItems);
}

export function updateMenuItemAndSave(updatedItem: MenuItem) {
  const index = mockMenuItems.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    mockMenuItems[index] = updatedItem;
    saveToLocalStorage(STORAGE_KEYS.MENU_ITEMS, mockMenuItems);
  }
}

export function deleteMenuItemAndSave(itemId: string): MenuItem | undefined {
  const itemIndex = mockMenuItems.findIndex(i => i.id === itemId);
  if (itemIndex > -1) {
    const deletedItem = mockMenuItems.splice(itemIndex, 1)[0];
    saveToLocalStorage(STORAGE_KEYS.MENU_ITEMS, mockMenuItems);
    return deletedItem;
  }
  return undefined;
}

export function getSales(): SaleEntry[] {
  if (IS_CLIENT) {
    mockSales = loadFromLocalStorage(STORAGE_KEYS.SALES, initialMockSales);
  }
  return [...mockSales];
}

export function addSaleAndSave(sale: SaleEntry) {
  mockSales.push(sale);
  saveToLocalStorage(STORAGE_KEYS.SALES, mockSales);
}

export function deleteSaleAndSave(saleId: string): SaleEntry | undefined {
  const saleIndex = mockSales.findIndex(s => s.id === saleId);
  if (saleIndex > -1) {
    const deletedSale = mockSales.splice(saleIndex, 1)[0];
    saveToLocalStorage(STORAGE_KEYS.SALES, mockSales);
    return deletedSale;
  }
  return undefined;
}

export function clearAllSalesAndSave() {
  mockSales = [];
  saveToLocalStorage(STORAGE_KEYS.SALES, mockSales);
}

export function getDeletedItemLogs(): DeletedItemLogEntry[] {
  if (IS_CLIENT) {
     mockDeletedItemLogs = loadFromLocalStorage(STORAGE_KEYS.DELETED_ITEMS, initialMockDeletedItemLogs);
  }
  return [...mockDeletedItemLogs];
}

export function addDeletedItemLogAndSave(log: DeletedItemLogEntry) {
  mockDeletedItemLogs.push(log);
  saveToLocalStorage(STORAGE_KEYS.DELETED_ITEMS, mockDeletedItemLogs);
}

export function getDeals(): Deal[] {
  if (IS_CLIENT) {
    mockDeals = loadFromLocalStorage(STORAGE_KEYS.DEALS, initialMockDeals);
  }
  return [...mockDeals];
}

export function addDealAndSave(deal: Deal): Deal | null {
  if (mockDeals.some(d => d.dealNumber === deal.dealNumber)) {
    console.error("Deal number already exists.");
    return null; 
  }
  mockDeals.push(deal);
  saveToLocalStorage(STORAGE_KEYS.DEALS, mockDeals);
  return deal;
}

export function updateDealAndSave(updatedDeal: Deal): Deal | null {
  const index = mockDeals.findIndex(d => d.id === updatedDeal.id);
  if (index !== -1) {
    if (mockDeals.some(d => d.dealNumber === updatedDeal.dealNumber && d.id !== updatedDeal.id)) {
      console.error("Deal number already exists for another deal.");
      return null;
    }
    mockDeals[index] = updatedDeal;
    saveToLocalStorage(STORAGE_KEYS.DEALS, mockDeals);
    return updatedDeal;
  }
  return null;
}

export function deleteDealAndSave(dealId: string): Deal | undefined {
  const dealIndex = mockDeals.findIndex(d => d.id === dealId);
  if (dealIndex > -1) {
    const deletedDeal = mockDeals.splice(dealIndex, 1)[0];
    saveToLocalStorage(STORAGE_KEYS.DEALS, mockDeals);
    return deletedDeal;
  }
  return undefined;
}

export function refreshDataFromLocalStorage() {
  if (IS_CLIENT) {
    mockMenuItems = loadFromLocalStorage(STORAGE_KEYS.MENU_ITEMS, initialMockMenuItems);
    mockSales = loadFromLocalStorage(STORAGE_KEYS.SALES, initialMockSales);
    mockDeletedItemLogs = loadFromLocalStorage(STORAGE_KEYS.DELETED_ITEMS, initialMockDeletedItemLogs);
    mockDeals = loadFromLocalStorage(STORAGE_KEYS.DEALS, initialMockDeals);
  }
}

export function getAllDataForBackup() {
  return {
    menuItems: getMenuItems(),
    sales: getSales(),
    deletedItemLogs: getDeletedItemLogs(),
    currentBusinessDay: getCurrentBusinessDay(),
    deals: getDeals(),
  };
}

export type BackupData = ReturnType<typeof getAllDataForBackup>;

export function generateAndDownloadBackup(isAuto: boolean = false): boolean {
  if (!IS_CLIENT) {
    console.warn("Backup download can only be triggered from the client-side.");
    return false;
  }
  try {
    const backupData = getAllDataForBackup();
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const prefix = isAuto ? "alshawaya_backup_auto_" : "alshawaya_backup_";
    link.download = `${prefix}${timestamp}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Backup download failed:", error);
    return false;
  }
}


export function restoreDataFromBackup(backupData: BackupData): boolean {
  try {
    if (
      !backupData ||
      !Array.isArray(backupData.menuItems) ||
      !Array.isArray(backupData.sales) ||
      !Array.isArray(backupData.deletedItemLogs) ||
      !Array.isArray(backupData.deals) ||
      typeof backupData.currentBusinessDay !== 'string' ||
      !isValid(parseISO(backupData.currentBusinessDay))
    ) {
      console.error("Invalid backup data structure");
      return false;
    }

    mockMenuItems = backupData.menuItems.map(item => ({...item}));
    mockSales = backupData.sales.map(sale => ({...sale}));
    mockDeletedItemLogs = backupData.deletedItemLogs.map(log => ({...log}));
    mockDeals = backupData.deals.map(deal => ({...deal}));
    currentBusinessDay = backupData.currentBusinessDay; 

    saveToLocalStorage(STORAGE_KEYS.MENU_ITEMS, mockMenuItems);
    saveToLocalStorage(STORAGE_KEYS.SALES, mockSales);
    saveToLocalStorage(STORAGE_KEYS.DELETED_ITEMS, mockDeletedItemLogs);
    saveToLocalStorage(STORAGE_KEYS.DEALS, mockDeals);
    saveToLocalStorage(STORAGE_KEYS.CURRENT_BUSINESS_DAY, currentBusinessDay); 
    
    return true;
  } catch (error) {
    console.error("Error restoring data:", error);
    return false;
  }
}

export function resetAllData() {
  mockMenuItems = initialMockMenuItems.map(item => ({...item}));
  mockSales = initialMockSales.map(sale => ({...sale}));
  mockDeletedItemLogs = initialMockDeletedItemLogs.map(log => ({...log}));
  mockDeals = initialMockDeals.map(deal => ({...deal}));
  currentBusinessDay = IS_CLIENT ? format(new Date(), 'yyyy-MM-dd') : "2024-01-01"; 

  saveToLocalStorage(STORAGE_KEYS.MENU_ITEMS, mockMenuItems);
  saveToLocalStorage(STORAGE_KEYS.SALES, mockSales);
  saveToLocalStorage(STORAGE_KEYS.DELETED_ITEMS, mockDeletedItemLogs);
  saveToLocalStorage(STORAGE_KEYS.DEALS, mockDeals);
  saveToLocalStorage(STORAGE_KEYS.CURRENT_BUSINESS_DAY, currentBusinessDay);
}

mockMenuItems = loadFromLocalStorage(STORAGE_KEYS.MENU_ITEMS, initialMockMenuItems);
mockSales = loadFromLocalStorage(STORAGE_KEYS.SALES, initialMockSales);
mockDeletedItemLogs = loadFromLocalStorage(STORAGE_KEYS.DELETED_ITEMS, initialMockDeletedItemLogs);
mockDeals = loadFromLocalStorage(STORAGE_KEYS.DEALS, initialMockDeals);
currentBusinessDay = initializeBusinessDay();

    