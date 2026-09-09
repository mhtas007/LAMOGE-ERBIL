import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { MenuItem, Category, OrderItem, Order, Table } from "../types";
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Coffee,
  ArrowLeft,
  Send,
  Printer,
  X,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Receipt } from "../components/Receipt";
import { PrinterService } from "../services/printerService";

export const POS: React.FC = () => {
  const {
    t,
    language,
    isRtl,
    currentShift,
    addOrder,
    menuItems,
    categories,
    selectedTableId,
    tables,
    activeTableOrders,
    updateTableOrder,
    clearTableOrder,
    receiptSettings,
    updateReceiptSettings,
    setSelectedTableId,
    navigate,
    user,
    incrementShiftOrdersSent,
  } = useAppContext();
  const isWaiter = user?.role === "waiter";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">(
    "takeaway",
  );
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    if (selectedTableId) {
      setOrderType("dine_in");
    } else {
      setOrderType("takeaway");
    }
  }, [selectedTableId]);

  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [lastOrderWasTable, setLastOrderWasTable] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [tendered, setTendered] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'fastpay' | 'fib' | 'zaincash'>('cash');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [liveInvoiceCode, setLiveInvoiceCode] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [orderNotes, setOrderNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSilentPrinting, setIsSilentPrinting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4500);
  };

  useEffect(() => {
    if (cartItems.length === 1) {
      setLiveInvoiceCode(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [cartItems.length]);

  // Load existing items if a table was selected
  useEffect(() => {
    if (selectedTableId) {
      setOrderType("dine_in");
      const existingOrders = activeTableOrders[selectedTableId];
      if (existingOrders) {
        setCartItems(existingOrders);
      } else {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [selectedTableId, activeTableOrders]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      item.nameEn.toLowerCase().includes(searchLower) ||
      item.nameKu.includes(searchLower) ||
      item.nameAr.includes(searchLower);
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  const [optionsModalItem, setOptionsModalItem] = useState<MenuItem | null>(null);

  const getAddonsKey = (addons?: import('../types').SelectedAddon[]) => {
    if (!addons || addons.length === 0) return '';
    return addons.map(a => a.id).sort().join(',');
  };

  const isSameOrderItem = (
    item: OrderItem,
    target: { menuItemId: string; variantName?: string; selectedAddons?: import('../types').SelectedAddon[] }
  ) => {
    if (item.menuItemId !== target.menuItemId) return false;
    if ((item.variantName || '') !== (target.variantName || '')) return false;
    return getAddonsKey(item.selectedAddons) === getAddonsKey(target.selectedAddons);
  };

  const addToCartDirect = (
    item: MenuItem,
    variantName?: string,
    variantPrice?: number,
    selectedAddons?: import('../types').SelectedAddon[]
  ) => {
    const basePrice = variantPrice ?? item.price;
    const addonsPrice = (selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
    const totalPrice = basePrice + addonsPrice;

    setCartItems((prev) => {
      const target = { menuItemId: item.id, variantName, selectedAddons };
      const existing = prev.find((i) => isSameOrderItem(i, target));
      if (existing) {
        return prev.map((i) =>
          isSameOrderItem(i, target) ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      const newItem: OrderItem = {
        menuItemId: item.id,
        quantity: 1,
        price: totalPrice,
      };
      if (variantName !== undefined) newItem.variantName = variantName;
      if (selectedAddons && selectedAddons.length > 0) newItem.selectedAddons = selectedAddons;

      return [...prev, newItem];
    });
    setOptionsModalItem(null);
  };

  const addToCart = (
    item: MenuItem,
    variantName?: string,
    variantPrice?: number,
    selectedAddons?: import('../types').SelectedAddon[]
  ) => {
    const hasVariants = item.variants && item.variants.length > 0;
    const hasAddons = item.addons && item.addons.length > 0;

    if (hasVariants || hasAddons) {
      setOptionsModalItem(item);
      return;
    }

    addToCartDirect(item, variantName, variantPrice, selectedAddons);
  };

  const updateQuantity = (
    id: string,
    variantName: string | undefined,
    selectedAddons: import('../types').SelectedAddon[] | undefined,
    delta: number
  ) => {
    setCartItems((prev) => {
      const target = { menuItemId: id, variantName, selectedAddons };
      return prev
        .map((item) => {
          if (isSameOrderItem(item, target)) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const serviceChargeValue =
    receiptSettings.taxRate > 0
      ? (subtotal * receiptSettings.taxRate) / 100
      : 0;
  const total = subtotal - discountValue + serviceChargeValue;

  const handleSendToTable = () => {
    if (!selectedTableId && !isWaiter) return;
    if (selectedTableId) {
      updateTableOrder(selectedTableId, cartItems);
      setSelectedTableId(null);
    }
    if (isWaiter) {
      incrementShiftOrdersSent();
    }
    setCartItems([]);
    navigate("tables"); // Go back to tables view
  };

  const openCheckout = () => {
    if (cartItems.length === 0) return;
    setShowCheckout(true);
    setTendered("");
    setDiscountValue(0);
    setOrderNotes("");
  };

  const liveOrderForReceipt: Order = useMemo(() => ({
    id: Math.random().toString(36).substr(2, 9),
    type: orderType,
    items: cartItems,
    subtotal,
    discount: discountValue,
    serviceCharge: serviceChargeValue,
    total,
    status: "completed",
    createdAt: new Date().toISOString(),
    invoiceCode: liveInvoiceCode,
    paymentMethod: paymentMethod,
    notes: orderNotes,
  }), [cartItems, orderType, subtotal, discountValue, serviceChargeValue, total, liveInvoiceCode, paymentMethod, orderNotes]);

  const performSilentPrint = async (orderToPrint: Order) => {
    setIsSilentPrinting(true);
    const tableObj = tables.find((t) => t.id === orderToPrint.tableId);
    const tableName = tableObj ? `${isRtl ? 'مێزی' : 'Table'} ${tableObj.number}` : undefined;

    try {
      const res = await PrinterService.printReceipt({
        order: orderToPrint,
        cafeName: receiptSettings.cafeName || 'LAMOGE CAFE',
        address: receiptSettings.address,
        phone: receiptSettings.phone,
        headerText: receiptSettings.headerText,
        footerText: receiptSettings.footerText,
        menuItems,
        currencySymbol: receiptSettings.currency || 'IQD',
        tableName,
        receiptLanguage: (receiptSettings.receiptLanguage || language || 'en') as 'en' | 'ku' | 'ar',
        logo: receiptSettings.logo,
      });

      showToast(
        isRtl ? `وەسڵ بە سەرکەوتوویی چاپکرا لە پرینتەر (${res.printerIp})` : `Receipt printed silently to ${res.printerIp} (${res.durationMs}ms)`,
        'success'
      );

      // Automatically close the receipt window after network printing
      setTimeout(() => {
        handleCloseReceipt();
      }, 500);
    } catch (err: any) {
      console.warn('[POS Checkout] Silent network print exception:', err.message);
      // Automatic fallback to native iPad AirPrint / Browser printing
      setTimeout(() => {
        window.print();
      }, 400);
    } finally {
      setIsSilentPrinting(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const isTableOrder = !!selectedTableId;
    setLastOrderWasTable(isTableOrder);

    const newOrder: Order = {
      ...liveOrderForReceipt,
      createdAt: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9),
    };

    if (selectedTableId) {
      newOrder.tableId = selectedTableId;
    }
    
    setLastOrder(newOrder);

    const hasConfiguredPrinter = Boolean(
      receiptSettings?.printerIp && 
      receiptSettings.printerIp.trim() !== '' && 
      receiptSettings.printerIp.trim() !== '192.168.1.100'
    );
    const isSilentMode = receiptSettings?.silentPrint !== false;

    if (receiptSettings?.autoPrint !== false) {
      if (hasConfiguredPrinter && isSilentMode) {
        // Direct Network IP Print (Epson ePOS / Star WebPRNT)
        performSilentPrint(newOrder);
      } else {
        // Standard iPad AirPrint / Browser Print
        // Trigger synchronously so Safari on iOS / iPadOS allows it directly
        setTimeout(() => {
          window.print();
        }, 80);
      }
    }

    addOrder(newOrder);
    setCartItems([]);
    if (selectedTableId) {
      clearTableOrder(selectedTableId);
      setSelectedTableId(null);
    }
    setShowCheckout(false);
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    if (lastOrderWasTable) {
      setLastOrderWasTable(false);
      navigate("tables");
    }
  };

  const handlePrint = async () => {
    const orderToPrint = lastOrder || liveOrderForReceipt;
    const hasConfiguredPrinter = Boolean(
      receiptSettings?.printerIp && 
      receiptSettings.printerIp.trim() !== '' && 
      receiptSettings.printerIp.trim() !== '192.168.1.100'
    );

    if (hasConfiguredPrinter && receiptSettings?.silentPrint !== false) {
      await performSilentPrint(orderToPrint);
    } else {
      window.print();
    }
  };


  const handleCancelTable = () => {
    setSelectedTableId(null);
    setCartItems([]);
    navigate("tables");
  };

  const getItemName = (item: MenuItem) => {
    if (language === "ku") return item.nameKu;
    if (language === "ar") return item.nameAr;
    return item.nameEn;
  };

  const getCategoryName = (cat: Category) => {
    if (language === "ku") return cat.nameKu;
    if (language === "ar") return cat.nameAr;
    return cat.nameEn;
  };

  if (!currentShift) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-24 h-24 bg-natural-bg rounded-full flex items-center justify-center text-natural-text-tertiary mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-light text-natural-dark">
          Shift Not Started
        </h2>
        <p className="text-natural-text-secondary max-w-md">
          You need to start your shift before you can access the point of sale
          or manage tables. Please clock in using the sidebar.
        </p>
      </div>
    );
  }

  const ItemOptionsModal = () => {
    if (!optionsModalItem) return null;

    const hasVariants = optionsModalItem.variants && optionsModalItem.variants.length > 0;
    const hasAddons = optionsModalItem.addons && optionsModalItem.addons.length > 0;

    const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(hasVariants ? 0 : -1);
    const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

    const chosenVariant = hasVariants && selectedVariantIndex >= 0 ? optionsModalItem.variants![selectedVariantIndex] : null;
    const variantName = chosenVariant ? (language === 'ku' ? chosenVariant.nameKu : language === 'ar' ? chosenVariant.nameAr : chosenVariant.nameEn) : undefined;
    const basePrice = chosenVariant ? chosenVariant.price : optionsModalItem.price;

    const selectedAddonsList = (optionsModalItem.addons || []).filter(a => selectedAddonIds.includes(a.id));
    const addonsTotal = selectedAddonsList.reduce((sum, a) => sum + a.price, 0);
    const itemTotalPrice = basePrice + addonsTotal;

    const toggleAddon = (addonId: string) => {
      setSelectedAddonIds(prev => 
        prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
      );
    };

    const handleConfirm = () => {
      if (hasVariants && selectedVariantIndex < 0) {
        alert(isRtl ? 'تکایە سەرەتا سایزێک هەڵبژێرە.' : 'Please select a size first.');
        return;
      }
      addToCartDirect(
        optionsModalItem,
        variantName,
        chosenVariant ? chosenVariant.price : optionsModalItem.price,
        selectedAddonsList
      );
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] border border-natural-border">
          <div className="flex justify-between items-center mb-4 shrink-0 pb-3 border-b border-natural-border">
            <div>
              <h2 className="text-xl font-bold text-natural-text">{getItemName(optionsModalItem)}</h2>
              <p className="text-xs text-natural-text-tertiary mt-0.5">{isRtl ? 'هەڵبژاردنی سایز و زیادکراوەکان' : 'Select size and add-ons'}</p>
            </div>
            <button onClick={() => setOptionsModalItem(null)} className="w-9 h-9 bg-natural-bg rounded-full flex items-center justify-center text-natural-text-tertiary hover:text-natural-text hover:bg-natural-border transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-1">
            {/* Variants Section */}
            {hasVariants && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-natural-text-tertiary mb-2">
                  {isRtl ? 'سایز / دەستکاری' : 'Size / Variant'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {optionsModalItem.variants!.map((v, i) => {
                    const vName = language === 'ku' ? v.nameKu : language === 'ar' ? v.nameAr : v.nameEn;
                    const isSelected = selectedVariantIndex === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedVariantIndex(i)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 text-sm font-bold transition-all active:scale-[0.98] ${isSelected ? 'bg-natural-dark text-natural-dark-text border-natural-dark shadow-md' : 'bg-natural-bg text-natural-text border-natural-border hover:border-natural-dark/40'}`}
                      >
                        <span>{vName}</span>
                        <span>{v.price.toLocaleString()} IQD</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add-ons Section */}
            {hasAddons && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-natural-text-tertiary mb-2">
                  {isRtl ? 'زیادکراوەکان / Add-ons' : 'Add-ons & Modifiers'}
                </label>
                <div className="space-y-2">
                  {optionsModalItem.addons!.map((addon) => {
                    const addonName = language === 'ku' ? addon.nameKu : language === 'ar' ? addon.nameAr : addon.nameEn;
                    const isChecked = selectedAddonIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 text-sm font-bold transition-all active:scale-[0.98] ${isChecked ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-sm' : 'bg-natural-bg text-natural-text border-natural-border hover:border-natural-dark/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-natural-border bg-white'}`}>
                            {isChecked && <Plus size={14} className="stroke-[3]" />}
                          </div>
                          <span className="font-semibold">{addonName}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isChecked ? 'bg-amber-200/80 text-amber-900' : 'bg-natural-surface text-natural-text-secondary border border-natural-border'}`}>
                          +{addon.price.toLocaleString()} IQD
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-natural-border flex items-center justify-between gap-3 shrink-0">
            <div>
              <span className="block text-xs text-natural-text-tertiary font-medium">{isRtl ? 'کۆی گشتی ئایتم' : 'Item Total'}</span>
              <span className="text-xl font-extrabold text-natural-text">{itemTotalPrice.toLocaleString()} <span className="text-xs font-normal">IQD</span></span>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} />
              {isRtl ? 'زیادکردن بۆ داواکاری' : 'Add to Order'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ItemOptionsModal />
      <div className="absolute inset-4 md:inset-8 flex flex-col lg:flex-row gap-4 lg:gap-6 print:block print:h-auto print:gap-0 print:relative">
        {/* Left Area - Menu */}
        <div
          className={`flex-1 flex flex-col gap-4 lg:gap-6 h-full overflow-hidden print:hidden ${isMobileCartOpen ? "hidden lg:flex" : "flex"}`}
        >
        {/* Top Header if Table Selected */}
        {selectedTable && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-natural-dark text-natural-dark-text flex items-center justify-center rounded-2xl font-bold text-lg">
                T{selectedTable.number}
              </div>
              <div>
                <h3 className="font-bold text-natural-text text-lg">
                  {isRtl ? `داواکاری مێزی ${selectedTable.number}` : `Table ${selectedTable.number} Order`}
                </h3>
                <p className="text-sm md:text-base text-natural-text-secondary font-medium">
                  {isRtl ? 'ئایتمەکان زیاد بکە و بینێرە بۆ مێز یان پارەدان تەواو بکە' : 'Add items and send to table or complete payment'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelTable}
              className="flex items-center gap-2 text-natural-text-secondary hover:text-red-500 font-medium bg-natural-bg px-4 py-2 rounded-xl transition-colors"
            >
              {isRtl ? 'گەڕانەوە بۆ مێزەکان' : 'Back to Tables'}
            </button>
          </div>
        )}

        {/* Top Bar */}
        <div className="flex flex-row gap-2 sm:gap-3 shrink-0 items-center overflow-hidden">
          <div className="relative w-1/3 sm:w-48 lg:w-56 shrink-0">
            <Search
              className={`absolute inset-y-0 ${isRtl ? "right-3" : "left-3"} h-full w-4 text-natural-text-tertiary`}
            />
            <input
              type="text"
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-natural-surface border-2 border-natural-border rounded-xl sm:rounded-2xl py-2.5 sm:py-3 shadow-sm text-sm ${isRtl ? "pr-10" : "pl-10"} focus:outline-none focus:border-natural-dark transition-colors`}
            />
          </div>
          <div className="flex flex-1 gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide items-center">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm whitespace-nowrap transition-all shadow-sm active:scale-95 ${selectedCategory === "all" ? "bg-natural-dark text-natural-dark-text shadow-md ring-2 ring-natural-dark ring-offset-2" : "bg-natural-surface border-2 border-natural-border text-natural-text hover:border-natural-dark hover:bg-natural-bg"}`}
            >
              {t("all")}
            </button>
            {[...categories].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm whitespace-nowrap transition-all shadow-sm active:scale-95 ${selectedCategory === cat.id ? "bg-natural-dark text-natural-dark-text shadow-md ring-2 ring-natural-dark ring-offset-2" : "bg-natural-surface border-2 border-natural-border text-natural-text hover:border-natural-dark hover:bg-natural-bg"}`}
              >
                {getCategoryName(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20 lg:pb-0">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(105px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2 sm:gap-3 lg:gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-natural-surface p-2 sm:p-3 rounded-2xl sm:rounded-[1.5rem] border border-natural-border shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-natural-dark/50 transition-all duration-300 text-center items-center flex flex-col group active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-natural-dark/20 h-full"
              >
                <div className="w-full aspect-square bg-natural-bg rounded-xl sm:rounded-2xl mb-2 sm:mb-3 flex items-center justify-center overflow-hidden transition-opacity">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={getItemName(item)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Coffee className="w-8 h-8 sm:w-10 sm:h-10 text-natural-text-tertiary" />
                  )}
                </div>
                <h3 className="font-bold text-natural-text text-[13px] sm:text-[15px] leading-snug w-full line-clamp-2 break-normal mt-1 mb-0.5">
                  {getItemName(item)}
                </h3>
                <p className="text-emerald-600 font-bold text-xs sm:text-sm mt-1">
                  {item.price.toLocaleString()} IQD
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile View Cart FAB */}
      {!isMobileCartOpen && cartItems.length > 0 && (
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="lg:hidden absolute bottom-6 right-6 left-6 bg-natural-dark text-natural-dark-text p-4 rounded-2xl font-bold shadow-2xl flex items-center justify-between active:scale-95 transition-transform z-10"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} Items</span>
          </div>
          <span>{subtotal.toLocaleString()} IQD</span>
        </button>
      )}

      {/* Right Area - Cart */}
      <div
        className={`w-full md:w-[300px] lg:w-[340px] xl:w-[380px] bg-natural-surface rounded-2xl lg:rounded-2xl sm:rounded-[2rem] border border-natural-border flex flex-col h-full shrink-0 overflow-hidden shadow-lg print:hidden ${isMobileCartOpen ? "flex" : "hidden md:flex"}`}
      >
        <div className="p-4 sm:p-5 border-b border-natural-border flex justify-between items-center bg-natural-surface">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 bg-natural-bg rounded-lg text-natural-text-secondary"
              onClick={() => setIsMobileCartOpen(false)}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-natural-text flex items-center gap-2">
              <ShoppingBag size={20} className="text-natural-accent" />
              {selectedTable ? `Table ${selectedTable.number}` : t("cart")}
            </h2>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={() => setCartItems([])}
              className="text-sm text-red-400 hover:text-red-500 font-medium"
            >
              {t("clearCart")}
            </button>
          )}
        </div>

        {!selectedTable && (
          <div className="p-4 border-b border-natural-border flex gap-2 shrink-0 bg-natural-bg">
            <button
              onClick={() => setOrderType("dine_in")}
              className={`flex-1 py-3 sm:py-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${orderType === "dine_in" ? "bg-natural-dark text-natural-dark-text shadow-md ring-2 ring-natural-dark ring-offset-2" : "bg-natural-surface border-2 border-natural-border text-natural-text hover:border-natural-dark hover:bg-natural-bg"}`}
            >
              {t("dineIn")}
            </button>
            <button
              onClick={() => setOrderType("takeaway")}
              className={`flex-1 py-3 sm:py-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${orderType === "takeaway" ? "bg-natural-dark text-natural-dark-text shadow-md ring-2 ring-natural-dark ring-offset-2" : "bg-natural-surface border-2 border-natural-border text-natural-text hover:border-natural-dark hover:bg-natural-bg"}`}
            >
              {t("takeaway")}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 bg-natural-bg">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-natural-text-tertiary gap-3">
              <ShoppingBag size={48} className="opacity-20" />
              <p className="text-base md:text-xl font-medium">{t("selectMenu")}</p>
            </div>
          ) : (
            cartItems.map((item, idx) => {
              const menuItem = menuItems.find((i) => i.id === item.menuItemId);
              if (!menuItem) return null;
              return (
                <div
                  key={`${item.menuItemId}-${item.variantName || 'default'}-${getAddonsKey(item.selectedAddons)}-${idx}`}
                  className="flex items-center gap-2 sm:gap-3 bg-natural-surface p-2 sm:p-2.5 rounded-xl border border-natural-border shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-natural-text text-[13px] sm:text-[14px] leading-snug break-normal line-clamp-2">
                      {getItemName(menuItem)} {item.variantName && <span className="text-natural-text-tertiary font-normal">({item.variantName})</span>}
                    </h4>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-snug mt-0.5">
                        + {item.selectedAddons.map(a => (language === 'ku' ? a.nameKu : language === 'ar' ? a.nameAr : a.nameEn)).join(', ')}
                      </p>
                    )}
                    <p className="text-[12px] sm:text-[13px] text-natural-text-secondary font-semibold mt-0.5">
                      {(item.price * item.quantity).toLocaleString()} IQD
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-natural-bg p-1 rounded-[14px] border border-natural-border">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.variantName, item.selectedAddons, -1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-natural-surface rounded-lg text-natural-text hover:bg-natural-border transition-colors shadow-sm active:scale-95 border border-natural-border/50">
                      <Minus size={16} />
                    </button>
                    <span className="font-bold w-5 text-center text-natural-text text-[13px] sm:text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.variantName, item.selectedAddons, 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-natural-surface rounded-lg text-natural-text hover:bg-natural-border transition-colors shadow-sm active:scale-95 border border-natural-border/50">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-natural-border bg-natural-surface shrink-0">
          <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
            <div className="flex justify-between text-sm text-natural-text-secondary">
              <span>{t("subtotal")}</span>
              <span className="font-medium">
                {subtotal.toLocaleString()} IQD
              </span>
            </div>
            <div className="flex justify-between text-sm text-natural-text-secondary">
              <span>{t("discount")}</span>
              <span className="font-medium">
                {discountValue.toLocaleString()} IQD
              </span>
            </div>
            {serviceChargeValue > 0 && (
              <div className="flex justify-between text-sm text-natural-text-secondary">
                <span>{t("serviceCharge")}</span>
                <span className="font-medium">
                  {serviceChargeValue.toLocaleString()} IQD
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg sm:text-xl font-bold text-natural-text pt-2 sm:pt-3 mt-1 border-t border-natural-border">
              <span>{t("total")}</span>
              <span>{total.toLocaleString()} IQD</span>
            </div>
          </div>

          <div className="flex gap-3">
            {selectedTable && (
              <button
                onClick={handleSendToTable}
                disabled={cartItems.length === 0}
                className="flex-1 bg-natural-dark hover:opacity-90 disabled:bg-natural-border disabled:text-natural-text-tertiary text-natural-dark-text py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-base transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {isRtl ? "ناردن بۆ مێز" : "Send to Table"}
              </button>
            )}
            {!isWaiter && (
              <button
                onClick={openCheckout}
                disabled={cartItems.length === 0}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-natural-border disabled:text-natural-text-tertiary text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all shadow-md active:scale-[0.98]"
              >
                {t("pay")}
              </button>
            )}
          </div>
        </div>
      </div>

                  {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-natural-surface rounded-[2rem] p-4 sm:p-5 w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl h-full sm:h-auto sm:max-h-[95vh] shadow-2xl flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h2 className="text-2xl sm:text-3xl font-light text-natural-text">
                {t("checkout")}
              </h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-12 h-12 bg-natural-surface rounded-full flex items-center justify-center text-natural-text-secondary hover:text-natural-text hover:bg-natural-border transition-colors shadow-sm active:scale-95 border-2 border-natural-border"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col md:flex-row gap-3 md:gap-4 pb-1">
              <div className="flex-1 space-y-3">
                <div className="bg-natural-surface p-3 rounded-2xl border-2 border-natural-border shadow-sm space-y-2">
                  <div className="flex justify-between items-center pb-4 border-b border-natural-border">
                    <span className="text-natural-text-secondary text-lg">
                      {t("subtotal")}
                    </span>
                    <span className="font-bold text-natural-text text-xl">
                      {subtotal.toLocaleString()} IQD
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-natural-text mb-2">
                      {t("discount")} (IQD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-natural-bg border-2 border-natural-border rounded-xl py-2 px-3 focus:outline-none focus:border-natural-dark text-xl font-bold transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="bg-natural-surface p-3 rounded-2xl border-2 border-natural-border shadow-sm">
                  <label className="block text-sm font-medium text-natural-text mb-3">
                    {t("receiptLanguage")}
                  </label>
                  <div className="flex bg-natural-bg rounded-2xl border-2 border-natural-border p-1.5 gap-1.5">
                    <button
                      onClick={() =>
                        updateReceiptSettings({ receiptLanguage: "en" })
                      }
                      className={`flex-1 py-2 md:py-3 text-base font-bold rounded-xl transition-all active:scale-95 ${receiptSettings.receiptLanguage === "en" ? "bg-natural-dark text-natural-dark-text shadow-md ring-2 ring-natural-dark ring-offset-2" : "bg-natural-surface text-natural-text border border-natural-border hover:bg-natural-surface shadow-sm"}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() =>
                        updateReceiptSettings({ receiptLanguage: "ku" })
                      }
                      className={`flex-1 py-2 md:py-3 text-base font-bold rounded-xl transition-all active:scale-95 ${receiptSettings.receiptLanguage === "ku" ? "bg-natural-dark text-natural-dark-text shadow-md ring-2 ring-natural-dark ring-offset-2" : "bg-natural-surface text-natural-text border border-natural-border hover:bg-natural-surface shadow-sm"}`}
                    >
                      KU
                    </button>
                    <button
                      onClick={() =>
                        updateReceiptSettings({ receiptLanguage: "ar" })
                      }
                      className={`flex-1 py-2 md:py-3 text-base font-bold rounded-xl transition-all active:scale-95 ${receiptSettings.receiptLanguage === "ar" ? "bg-natural-dark text-natural-dark-text shadow-md ring-2 ring-natural-dark ring-offset-2" : "bg-natural-surface text-natural-text border border-natural-border hover:bg-natural-surface shadow-sm"}`}
                    >
                      AR
                    </button>
                  </div>
                </div>

                <div className="bg-natural-surface p-3 rounded-2xl border-2 border-natural-border shadow-sm">
                  <label className="block text-sm font-medium text-natural-text mb-2">
                    {isRtl ? "تێبینییەکان (بۆ سەر وەسل)" : "Order Notes (printed on receipt)"}
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-natural-bg border-2 border-natural-border rounded-xl py-2 px-3 focus:outline-none focus:border-natural-dark text-sm transition-colors resize-none h-20"
                    placeholder={isRtl ? "تێبینی بنووسە..." : "Add notes..."}
                  />
                </div>
              </div>

              <div className="hidden md:block w-0.5 bg-natural-border/50 rounded-full" />
              <div className="md:hidden h-0.5 w-full bg-natural-border/50 rounded-full" />

              <div className="flex-[1.2] flex flex-col gap-3">
                <div className="bg-natural-dark text-natural-dark-text p-4 rounded-2xl flex justify-between items-center shadow-xl gap-2">
                  <span className="text-natural-text-tertiary font-medium uppercase tracking-wider text-sm">
                    {t("totalToPay")}
                  </span>
                  <span className="text-2xl md:text-3xl font-bold">
                    {total.toLocaleString()} <span className="text-2xl text-natural-text-secondary">IQD</span>
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-natural-text mb-3">
                    {t("paymentMethod")}
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {(['cash', 'card', 'fastpay', 'fib', 'zaincash'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method);
                          if (method !== 'cash') setTendered(total.toString());
                        }}
                        className={`py-3 px-3 text-sm md:text-base font-bold rounded-2xl border-2 transition-all active:scale-95 ${paymentMethod === method ? 'bg-natural-dark text-natural-dark-text border-natural-dark shadow-md ring-2 ring-natural-dark ring-offset-2' : 'bg-natural-surface text-natural-text border-natural-border hover:border-natural-dark hover:bg-natural-bg shadow-sm'}`}
                      >
                        {t(method as any) || method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="bg-natural-surface p-3 rounded-2xl border-2 border-natural-border shadow-sm space-y-2">
                    <label className="block text-sm font-medium text-natural-text">
                      {t("amountTendered")} (IQD)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[total, 5000, 10000, 25000, 50000, 100000].map(
                        (amt, idx) => (
                          <button
                            key={`amt-${idx}`}
                            onClick={() => setTendered(amt.toString())}
                            className="bg-natural-surface hover:bg-natural-bg hover:border-natural-dark active:bg-natural-border-light active:scale-95 border-2 border-natural-border py-2 rounded-xl text-sm md:text-base font-bold transition-all shadow-sm"
                          >
                            {amt.toLocaleString()}
                          </button>
                        ),
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={tendered}
                      onChange={(e) => setTendered(e.target.value)}
                      className="w-full bg-natural-bg border-2 border-natural-border rounded-xl py-2 px-3 focus:outline-none focus:border-natural-dark text-xl font-bold transition-colors"
                      placeholder="Custom amount..."
                    />
                    
                    {Number(tendered) > 0 && (
                      <div className="bg-natural-bg p-3 rounded-xl border-2 border-natural-border flex justify-between items-center mt-2">
                        <span className="text-natural-text-secondary font-medium">
                          {t("change")}
                        </span>
                        <span
                          className={`font-bold text-xl ${Number(tendered) >= total ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {(Number(tendered) - total).toLocaleString()} IQD
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-2 flex gap-3">
                  <button
                    onClick={handleCheckout}
                    disabled={paymentMethod === 'cash' && Number(tendered) < total}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-[2rem] text-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {t("completePayment")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 print:hidden">
          <div className="bg-natural-surface rounded-[2rem] p-5 sm:p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-bold text-natural-text">
                {t("orderSuccessful")}
              </h2>
              <button
                onClick={handleCloseReceipt}
                className="w-10 h-10 bg-natural-surface rounded-full flex items-center justify-center text-natural-text-tertiary hover:text-natural-text hover:bg-natural-border transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-natural-bg p-2 rounded-2xl border border-natural-border shadow-inner mb-4 overflow-y-auto flex-1 flex justify-center">
              <div className="transform scale-[0.9] origin-top">
                <Receipt order={lastOrder} />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handleCloseReceipt}
                  className="flex-1 bg-natural-bg hover:bg-natural-surface border-2 border-natural-border text-natural-text py-3 rounded-2xl font-bold transition-all text-sm"
                >
                  {t("close")}
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-[1.8] bg-natural-dark hover:opacity-90 text-white py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  <Printer size={18} />
                  <span>{isRtl ? 'چاپکردنی وەسڵ (AirPrint / چاپ)' : t("printReceipt")}</span>
                </button>
              </div>

              {receiptSettings?.printerIp && 
               receiptSettings.printerIp.trim() !== '' && 
               receiptSettings.printerIp.trim() !== '192.168.1.100' && (
                <button
                  onClick={() => performSilentPrint(lastOrder)}
                  disabled={isSilentPrinting}
                  className="w-full bg-natural-surface hover:bg-natural-bg border border-natural-border text-natural-text py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSilentPrinting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-natural-accent" />
                      <span>{isRtl ? 'دەنێردرێت بۆ پرینتەری نێتۆرک...' : 'Sending to network printer...'}</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={14} className="text-emerald-500" />
                      <span>{isRtl ? `چاپی نێتۆرک (${receiptSettings.printerIp})` : `Network IP Print (${receiptSettings.printerIp})`}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification on iPad */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9999] max-w-sm flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-bottom-4 print:hidden ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700/60 backdrop-blur-md shadow-emerald-950/40'
              : 'bg-rose-950/95 text-rose-200 border-rose-700/60 backdrop-blur-md shadow-rose-950/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={20} className="shrink-0 text-rose-400" />
          )}
          <span className="leading-snug">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-white/50 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Isolated Dedicated Printable Receipt Container for 100% Reliable iPad & Thermal Printing */}
      <div id="receipt-print-root" className="hidden print:block receipt-printable-root">
        <Receipt order={lastOrder || liveOrderForReceipt} />
      </div>
    </div>
    </>
  );
};
