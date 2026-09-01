import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, createUserWithEmailAndPassword, deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { db, auth, secondaryAuth } from '../firebase';
import { Language, User, Order, Table, MenuItem, Category, OrderItem, Expense } from '../types';
import { getTranslation, TranslationKey, isRTL } from '../i18n';
import { printerConfigService } from '../services/printerConfigService';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  loadingAuth: boolean;
  
  // Navigation
  currentPath: string;
  navigate: (path: string) => void;

  // App Data
  menuItems: MenuItem[];
  categories: Category[];
  tables: Table[];
  inventory: import('../types').InventoryItem[];
  addInventoryItem: (item: import('../types').InventoryItem) => void;
  updateInventoryItem: (id: string, item: Partial<import('../types').InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  inventoryLogs: import('../types').InventoryLog[];
  adjustInventoryStock: (itemId: string, newQuantity: number, reason: import('../types').InventoryLog['reason'], notes?: string) => Promise<void>;
  shifts: import('../types').Shift[];
  currentShift: import('../types').Shift | null;
  clockIn: () => Promise<void>;
  clockOut: (declaredCash?: number) => Promise<void>;
  incrementShiftOrdersSent: () => Promise<void>;
  recentOrders: Order[];
  users: User[];
  expenses: Expense[];
  expenseCategories: import('../types').ExpenseCategory[];
  addExpenseCategory: (cat: Omit<import('../types').ExpenseCategory, 'id'>) => void;
  deleteExpenseCategory: (id: string) => void;
  
  // App Actions
  addOrder: (order: Order) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  
  // Category Actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;

  // Users Actions
  addUser: (user: User, password?: string) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Expenses Actions
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => void;

  // Tables Management
  addTable: (table: Table) => void;
  updateTable: (id: string, table: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  
  // Table Orders Management
  activeTableOrders: Record<string, OrderItem[]>;
  updateTableOrder: (tableId: string, items: OrderItem[]) => void;
  clearTableOrder: (tableId: string) => void;
  moveTableOrder: (fromTableId: string, toTableId: string) => Promise<void>;
  mergeTables: (sourceId: string, targetId: string) => Promise<void>;
  unmergeTable: (tableId: string) => Promise<void>;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;

  // Layout
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Settings
  receiptSettings: ReceiptSettings;
  updateReceiptSettings: (settings: Partial<ReceiptSettings>) => void;
  resetExpenses: () => Promise<void>;
  resetSystemData: () => Promise<void>;
}

export interface ReceiptSettings {
  cafeName: string;
  address: string;
  phone: string;
  taxRate: number;
  currency: string;
  logo: string | null;
  headerText?: string;
  footerText: string;
  receiptLanguage: 'en' | 'ku' | 'ar';
  telegramToken?: string;
  telegramChatId?: string;
  printerIp?: string;
  printerPort?: number;
  printerProtocol?: 'epson_epos' | 'star_webprnt' | 'raw_escpos_bridge';
  paperWidth?: '80mm' | '58mm';
  silentPrint?: boolean;
  autoCut?: boolean;
  openCashDrawer?: boolean;
  autoPrint?: boolean;
  showVat?: boolean;
  taxId?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to recursively strip any undefined values which Firestore rejects
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('mas_pos_language') as Language) || 'en');
  
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('mas_pos_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('mas_pos_theme', newTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('mas_pos_language', lang);
    setLanguageState(lang);
  };
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [currentPath, setCurrentPath] = useState(() => localStorage.getItem('mas_pos_path') || 'dashboard');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    localStorage.setItem('mas_pos_path', currentPath);
  }, [currentPath]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<import('../types').InventoryItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<import('../types').InventoryLog[]>([]);
  const [shifts, setShifts] = useState<import('../types').Shift[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<import('../types').ExpenseCategory[]>([]);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setMenuItems([]);
      setTables([]);
      setRecentOrders([]);
      setExpenseCategories([]);
      setShifts([]);
      setInventoryLogs([]);
      setInventory([]);
      setExpenses([]);
      setActiveTableOrders({});
      return;
    }

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category)));
    });
    const unsubMenuItems = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem)));
    });
    const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      setTables(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          number: Number(data.number || 0)
        } as Table;
      }).sort((a, b) => a.number - b.number));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setRecentOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    
    const unsubExpenseCategories = onSnapshot(collection(db, 'expenseCategories'), (snapshot) => {
      setExpenseCategories(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as import('../types').ExpenseCategory)));
    });

    
    
    
    const unsubShifts = onSnapshot(collection(db, 'shifts'), (snapshot) => {
      setShifts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as import('../types').Shift)).sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
    });

    const unsubInventoryLogs = onSnapshot(collection(db, 'inventoryLogs'), (snapshot) => {
      setInventoryLogs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as import('../types').InventoryLog)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });

    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as import('../types').InventoryItem)));
    });

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'receipt'), (doc) => {
      if (doc.exists()) {
        setReceiptSettings(doc.data() as ReceiptSettings);
      }
    });

    const unsubTableOrders = onSnapshot(collection(db, 'tableOrders'), (snapshot) => {
      const ordersMap: Record<string, OrderItem[]> = {};
      snapshot.forEach(doc => {
        ordersMap[doc.id] = doc.data().items as OrderItem[];
      });
      setActiveTableOrders(ordersMap);
    });

    return () => {
      unsubCategories();
      unsubMenuItems();
      unsubTables();
      unsubOrders();
      unsubExpenseCategories();
      unsubShifts();
      unsubInventoryLogs();
      unsubInventory();
      unsubExpenses();
      unsubSettings();
      unsubTableOrders();
    };
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ id: firebaseUser.uid, ...userData } as User);
            if (userData.role === 'cashier' && currentPath === 'dashboard') {
              setCurrentPath('pos');
            }
          } else {
            // Handle edge case where user is in auth but not firestore
            setUser({ id: firebaseUser.uid, email: firebaseUser.email || '', name: firebaseUser.email?.split('@')[0] || 'User', username: firebaseUser.email?.split('@')[0] || 'user', role: 'cashier' });
          }
        } catch (error) {
          console.error("Error fetching user document", error);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach(doc => {
        usersData.push({ ...doc.data(), id: doc.id } as User);
      });
      setUsers(usersData);
    }, (error) => {
      console.error('Error fetching users:', error);
    });

    return () => unsubscribe();
  }, [user]);
  
  const [activeTableOrders, setActiveTableOrders] = useState<Record<string, OrderItem[]>>({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    cafeName: 'LAMOGE CAFE',
    address: 'Erbil Avenue',
    phone: '',
    taxRate: 0,
    currency: 'IQD',
    logo: '/lamoge_logo.png',
    footerText: 'Thank you for your visit!',
    receiptLanguage: 'en',
    telegramToken: '',
    telegramChatId: '',
    printerIp: '',
    printerPort: 80,
    printerProtocol: 'epson_epos',
    paperWidth: '80mm',
    silentPrint: true,
    autoCut: true,
    openCashDrawer: false,
    autoPrint: true,
  });

  useEffect(() => {
    printerConfigService.initRealtimeListener();
  }, []);

  const updateReceiptSettings = async (settings: Partial<ReceiptSettings>) => {
    try {
      const cleaned = removeUndefinedFields(settings);
      setReceiptSettings(prev => ({ ...prev, ...cleaned }));
      
      // Save to Firestore settings/receipt
      await setDoc(doc(db, 'settings', 'receipt'), cleaned, { merge: true });
      
      // Also sync cafe_config if printer settings are modified
      const hasPrinterProps = 
        settings.printerIp !== undefined || 
        settings.printerProtocol !== undefined || 
        settings.printerPort !== undefined || 
        settings.paperWidth !== undefined || 
        settings.silentPrint !== undefined ||
        settings.autoCut !== undefined ||
        settings.openCashDrawer !== undefined;

      if (hasPrinterProps) {
        const printerPayload: Record<string, any> = {};
        if (settings.printerIp !== undefined) printerPayload.printerIp = settings.printerIp;
        if (settings.printerProtocol !== undefined) printerPayload.protocol = settings.printerProtocol;
        if (settings.printerPort !== undefined && !isNaN(Number(settings.printerPort))) printerPayload.port = Number(settings.printerPort);
        if (settings.paperWidth !== undefined) printerPayload.paperWidth = settings.paperWidth;
        if (settings.silentPrint !== undefined) printerPayload.silentPrint = settings.silentPrint;
        if (settings.autoCut !== undefined) printerPayload.autoCut = settings.autoCut;
        if (settings.openCashDrawer !== undefined) printerPayload.openCashDrawer = settings.openCashDrawer;

        await printerConfigService.savePrinterConfig(printerPayload);
      }
    } catch (e) {
      console.error('Error updating receipt settings in Firebase:', e);
      throw e;
    }
  };

  useEffect(() => {
    document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: TranslationKey) => getTranslation(language, key);
  const isRtl = isRTL(language);

  const login = async (email: string, password?: string) => {
    if (!password) return false;
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'cashier') {
        setCurrentPath('pos');
      } else {
        setCurrentPath('dashboard');
      }
      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const addOrder = async (order: Order) => {
    try {
      const finalOrder = { ...order };
      if (!finalOrder.userId && user) {
        finalOrder.userId = user.id;
      }
      const cleaned = removeUndefinedFields(finalOrder);
      await setDoc(doc(db, 'orders', order.id), cleaned);
    } catch (e) {
      console.error('Error adding order:', e);
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    try {
      await setDoc(doc(db, 'menuItems', item.id), item);
    } catch (e) {
      console.error('Error adding menu item:', e);
    }
  };

  const updateMenuItem = async (id: string, updatedItem: Partial<MenuItem>) => {
    try {
      await setDoc(doc(db, 'menuItems', id), updatedItem, { merge: true });
    } catch (e) {
      console.error('Error updating menu item:', e);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menuItems', id));
    } catch (e) {
      console.error('Error deleting menu item:', e);
    }
  };

  const addCategory = async (category: Category) => {
    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch (e) {
      console.error('Error adding category:', e);
    }
  };

  const updateCategory = async (id: string, updatedCategory: Partial<Category>) => {
    try {
      await setDoc(doc(db, 'categories', id), updatedCategory, { merge: true });
    } catch (e) {
      console.error('Error updating category:', e);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.error('Error deleting category:', e);
    }
  };

  const reorderCategories = async (orderedIds: string[]) => {
    try {
      const batch = writeBatch(db);
      orderedIds.forEach((id, index) => {
        batch.set(doc(db, 'categories', id), { sortOrder: index }, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Error reordering categories:', e);
    }
  };

  const addUser = async (newUser: User, password?: string) => {
    if (!password) {
      console.error('Password is required to create a user');
      return;
    }
    try {
      const isFirst = users.length === 0;
      const userToSave = {
        ...newUser,
        role: isFirst ? 'super_admin' : newUser.role
      };
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, password);
      const uid = userCredential.user.uid;
      
      const { id, ...rest } = userToSave;
      await setDoc(doc(db, 'users', uid), rest);
      
      // Secondary auth doesn't auto sign out the primary app, but we should sign out the secondary one
      await firebaseSignOut(secondaryAuth);
    } catch (e) {
      console.error('Error adding user:', e);
      alert('Error creating user: ' + (e as Error).message);
    }
  };

  const updateUser = async (id: string, updatedUser: Partial<User>) => {
    try {
      await setDoc(doc(db, 'users', id), updatedUser, { merge: true });
    } catch (e) {
      console.error('Error updating user:', e);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  
  
  
  const currentShift = user ? shifts.find(s => s.userId === user.id && !s.clockOutTime) || null : null;

  const clockIn = async () => {
    if (!user || currentShift) return;
    
    try {
      const shiftRef = doc(collection(db, 'shifts'));
      await setDoc(shiftRef, {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        clockInTime: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error clocking in:', e);
    }
  };

  const incrementShiftOrdersSent = async () => {
    if (!user || !currentShift) return;
    try {
      const shiftRef = doc(db, 'shifts', currentShift.id);
      await setDoc(shiftRef, {
        totalOrders: (currentShift.totalOrders || 0) + 1
      }, { merge: true });
    } catch (e) {
      console.error('Error incrementing shift orders:', e);
    }
  };

  const clockOut = async (declaredCash?: number) => {
    if (!user || !currentShift) return;
    
    try {
      const now = new Date();
      const clockInDate = new Date(currentShift.clockInTime);
      const totalHours = (now.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);

      const shiftOrders = recentOrders.filter(o => 
        o.userId === user.id && 
        new Date(o.createdAt).getTime() >= clockInDate.getTime() && 
        o.status === 'completed'
      );
      
      const totalSales = shiftOrders.reduce((sum, o) => sum + o.total, 0);
      const totalOrders = user.role === 'waiter' ? (currentShift.totalOrders || 0) : shiftOrders.length;
      const expectedCash = totalSales;
      const discrepancy = (declaredCash ?? expectedCash) - expectedCash;

      await setDoc(doc(db, 'shifts', currentShift.id), {
        clockOutTime: now.toISOString(),
        totalHours,
        declaredCash: declaredCash ?? expectedCash,
        expectedCash,
        totalSales,
        totalOrders,
        discrepancy
      }, { merge: true });
    } catch (e) {
      console.error('Error clocking out:', e);
    }
  };


  const addExpenseCategory = async (cat: Omit<import('../types').ExpenseCategory, 'id'>) => {
    try {
      const newRef = doc(collection(db, 'expenseCategories'));
      await setDoc(newRef, cat);
    } catch (e) {
      console.error('Error adding expense category:', e);
    }
  };

  const deleteExpenseCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenseCategories', id));
    } catch (e) {
      console.error('Error deleting expense category:', e);
    }
  };

  
  
  const adjustInventoryStock = async (itemId: string, newQuantity: number, reason: import('../types').InventoryLog['reason'], notes?: string) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      const previousQuantity = item.quantity;
      
      // Update item
      await setDoc(doc(db, 'inventory', itemId), { quantity: newQuantity }, { merge: true });

      // Add log
      const logRef = doc(collection(db, 'inventoryLogs'));
      await setDoc(logRef, {
        itemId,
        itemName: item.nameEn,
        userId: user?.id || 'system',
        userName: user?.name || 'System',
        previousQuantity,
        newQuantity,
        reason,
        timestamp: new Date().toISOString(),
        notes: notes || ''
      });
    } catch (e) {
      console.error('Error adjusting inventory stock:', e);
    }
  };

  const addInventoryItem = async (item: import('../types').InventoryItem) => {
    try {
      await setDoc(doc(db, 'inventory', item.id), item);
    } catch (e) {
      console.error('Error adding inventory item:', e);
    }
  };

  const updateInventoryItem = async (id: string, updatedItem: Partial<import('../types').InventoryItem>) => {
    try {
      await setDoc(doc(db, 'inventory', id), updatedItem, { merge: true });
    } catch (e) {
      console.error('Error updating inventory item:', e);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (e) {
      console.error('Error deleting inventory item:', e);
    }
  };

  
  const addExpense = async (expense: Expense) => {
    try {
      await setDoc(doc(db, 'expenses', expense.id), expense);
    } catch (e) {
      console.error('Error adding expense:', e);
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      await setDoc(doc(db, 'expenses', id), updates, { merge: true });
    } catch (e) {
      console.error('Error updating expense:', e);
    }
  };


  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (e) {
      console.error('Error deleting expense:', e);
    }
  };

  const addTable = async (table: Table) => {
    try {
      await setDoc(doc(db, 'tables', table.id), table);
    } catch (e) {
      console.error('Error adding table:', e);
    }
  };

  const updateTable = async (id: string, updatedTable: Partial<Table>) => {
    try {
      await setDoc(doc(db, 'tables', id), updatedTable, { merge: true });
    } catch (e) {
      console.error('Error updating table:', e);
    }
  };

  const deleteTable = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (e) {
      console.error('Error deleting table:', e);
    }
  };

  const updateTableOrder = async (tableId: string, items: OrderItem[]) => {
    try {
      const cleanItems = removeUndefinedFields(items);
      await setDoc(doc(db, 'tableOrders', tableId), { items: cleanItems });
      const table = tables.find(t => t.id === tableId);
      if (table) {
        const newStatus = items.length > 0 ? 'occupied' : 'available';
        const updateData: any = { status: newStatus };
        if (newStatus === 'occupied' && table.status !== 'occupied') {
          updateData.occupiedAt = new Date().toISOString();
        } else if (newStatus === 'available') {
          updateData.occupiedAt = null;
        }
        await setDoc(doc(db, 'tables', tableId), updateData, { merge: true });
        
        // If it becomes available, release child tables
        if (items.length === 0) {
          const childTables = tables.filter(t => t.mergedWithId === tableId);
          for (const childTable of childTables) {
            await setDoc(doc(db, 'tables', childTable.id), { status: 'available', mergedWithId: null }, { merge: true });
          }
        }
      }
    } catch (e) {
      console.error('Error updating table order:', e);
    }
  };

  const clearTableOrder = async (tableId: string) => {
    try {
      await deleteDoc(doc(db, 'tableOrders', tableId));
      
      const table = tables.find(t => t.id === tableId);
      if (table) {
        await setDoc(doc(db, 'tables', tableId), { status: 'available' }, { merge: true });
      }

      // Also unmerge any tables that are merged with this table
      const childTables = tables.filter(t => t.mergedWithId === tableId);
      for (const childTable of childTables) {
        await setDoc(doc(db, 'tables', childTable.id), { status: 'available', mergedWithId: null }, { merge: true });
      }
    } catch (e) {
      console.error('Error clearing table order:', e);
    }
  };


  const mergeTables = async (sourceId: string, targetId: string) => {
    try {
      const sourceItems = activeTableOrders[sourceId] || [];
      const targetItems = activeTableOrders[targetId] || [];
      
      if (sourceItems.length > 0) {
        const combinedItems = [...targetItems, ...sourceItems];
        await setDoc(doc(db, 'tableOrders', targetId), { items: combinedItems });
        await deleteDoc(doc(db, 'tableOrders', sourceId));
      }
      
      await setDoc(doc(db, 'tables', sourceId), { mergedWithId: targetId, status: 'occupied', occupiedAt: new Date().toISOString() }, { merge: true });
      await setDoc(doc(db, 'tables', targetId), { status: 'occupied', occupiedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Error merging tables:', e);
    }
  };

  const unmergeTable = async (tableId: string) => {
    try {
      await setDoc(doc(db, 'tables', tableId), { mergedWithId: null, status: 'available' }, { merge: true });
    } catch (e) {
      console.error('Error unmerging table:', e);
    }
  };

  const moveTableOrder = async (fromTableId: string, toTableId: string) => {
    try {
      const items = activeTableOrders[fromTableId] || [];
      if (items.length > 0) {
        const targetItems = activeTableOrders[toTableId] || [];
        const combinedItems = [...targetItems, ...items];
        await setDoc(doc(db, 'tableOrders', toTableId), { items: combinedItems });
        await deleteDoc(doc(db, 'tableOrders', fromTableId));
        await setDoc(doc(db, 'tables', toTableId), { status: 'occupied', occupiedAt: new Date().toISOString() }, { merge: true });
        await setDoc(doc(db, 'tables', fromTableId), { status: 'available', occupiedAt: null }, { merge: true });
      }
    } catch (e) {
      console.error('Error moving table order:', e);
    }
  };

  const navigate = (path: string) => {
    setCurrentPath(path);
  };

  const resetExpenses = async () => {
    try {
      for (const exp of expenses) {
        await deleteDoc(doc(db, 'expenses', exp.id));
      }
    } catch (error) {
      console.error('Error resetting expenses:', error);
      throw error;
    }
  };

  const resetSystemData = async () => {
    try {
      // 1. Delete all expenses
      for (const exp of expenses) {
        await deleteDoc(doc(db, 'expenses', exp.id));
      }
      // 2. Delete all orders
      for (const ord of recentOrders) {
        await deleteDoc(doc(db, 'orders', ord.id));
      }
      // 3. Delete all shifts
      for (const sh of shifts) {
        await deleteDoc(doc(db, 'shifts', sh.id));
      }
      // 4. Delete all inventory items
      for (const inv of inventory) {
        await deleteDoc(doc(db, 'inventory', inv.id));
      }
      // 5. Delete all inventory logs
      for (const log of inventoryLogs) {
        await deleteDoc(doc(db, 'inventoryLogs', log.id));
      }
      // 6. Delete all active table orders
      for (const tableId of Object.keys(activeTableOrders)) {
        await deleteDoc(doc(db, 'tableOrders', tableId));
      }
      // 7. Reset all tables to available and unmerged
      for (const table of tables) {
        await setDoc(doc(db, 'tables', table.id), { status: 'available', mergedWithId: null, occupiedAt: null }, { merge: true });
      }
    } catch (error) {
      console.error('Error resetting system data:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ 
      language, setLanguage, theme, toggleTheme, t, isRtl, user, login, logout, loadingAuth, 
      currentPath, navigate,
      recentOrders, addOrder,
      menuItems, categories, tables,
      users, expenses, inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, inventoryLogs, adjustInventoryStock, shifts, currentShift, clockIn, clockOut, incrementShiftOrdersSent, expenseCategories, addExpenseCategory, deleteExpenseCategory,
      addMenuItem, updateMenuItem, deleteMenuItem,
      addCategory, updateCategory, deleteCategory, reorderCategories,
      addUser, updateUser, deleteUser,
      addExpense, updateExpense, deleteExpense,
      addTable, updateTable, deleteTable,
      activeTableOrders, updateTableOrder, clearTableOrder, moveTableOrder, mergeTables, unmergeTable,
      selectedTableId, setSelectedTableId,
      isSidebarCollapsed, toggleSidebar,
      receiptSettings, updateReceiptSettings,
      resetExpenses, resetSystemData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
