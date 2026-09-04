'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api, { offerService } from '@/services/api';
import { 
    Search, Plus, Minus, X, CreditCard, Banknote, 
    ShoppingCart, Loader2, MonitorCheck, ScanLine, AlertCircle, Printer, RefreshCcw, Star,
    MessageSquare, Check, Keyboard, Users, Tag, Barcode
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { ThermalReceipt } from '@/components/pos/ThermalReceipt';
import { QuickAddModal } from '@/components/pos/QuickAddModal';
import POSReturnModal from '@/components/pos/POSReturnModal';
import KeyboardShortcutPanel from '@/components/pos/KeyboardShortcutPanel';
import POSOnboardingTour from '@/components/pos/POSOnboardingTour';
import POSStatusBar from '@/components/pos/POSStatusBar';

interface Product {
    id: number;
    name: string;
    price: number | string;
    discounted_price: number | string;
    image: string;
    quantity: number;
    category_name: string;
    barcode?: string;
    track_inventory?: boolean;
    has_batches?: boolean;
    batches?: any[];
}
