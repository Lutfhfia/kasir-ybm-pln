import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Store, LayoutDashboard, ScanLine, Package, Boxes, Truck,
  Receipt as ReceiptIcon, BarChart3, Wallet, Settings, Search, Camera,
  PauseCircle, History, Plus, Printer, Download, LogOut,
  TrendingUp, AlertTriangle, Clock, X, ChevronDown, ChevronUp,
  Minus, Trash2, CheckCircle2, UserCheck, Upload, Globe, ShieldAlert, Check, Image as ImageIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Default Demo Data ---
type Product = {
  id: string | number;
  name: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  category?: string;
  status?: boolean;
  brand?: string;
  unit?: string;
  image?: string | null;
  expiry_date?: string;
  sku?: string;
  stock_minimum?: number;
  supplier?: string;
};

type CartItem = Product & { qty: number };

type Transaction = {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  cogs: number;
  grossProfit: number;
  paymentMethod: string;
  received: number;
  change: number;
  cashier: string;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: "Indomie Goreng Special", barcode: "8998866200116", price: 3500, cost: 2500, stock: 150, category: "Makanan", status: true, brand: "Indofood", unit: "bungkus", image: null, expiry_date: '2026-05-15' },
  { id: 'p2', name: "Beras Maknyuss 5kg", barcode: "8991234567890", price: 65000, cost: 58000, stock: 3, category: "Sembako", status: true, brand: "Maknyuss", unit: "karung", image: null, expiry_date: '2026-06-20' },
  { id: 'p3', name: "Aqua Botol 600ml", barcode: "8999999000001", price: 3000, cost: 2000, stock: 50, category: "Minuman", status: true, brand: "Danone", unit: "botol", image: null, expiry_date: '2026-04-10' },
  { id: 'p4', name: "Minyak Goreng Bimoli 1L", barcode: "8992222333344", price: 21000, cost: 18500, stock: 2, category: "Sembako", status: true, brand: "Bimoli", unit: "liter", image: null, expiry_date: '2026-03-30' },
  { id: 'p5', name: "Gula Pasir Gulaku 1kg", barcode: "8995555666677", price: 16000, cost: 14000, stock: 1, category: "Sembako", status: true, brand: "Gulaku", unit: "kg", image: null, expiry_date: '2026-02-15' },
];

const INITIAL_SUPPLIERS = [
  { id: 's1', name: 'PT Indofood Sukses Makmur', contact: 'Budi Santoso', phone: '081122334455', address: 'Jl. Industri Raya No. 12, Jakarta' },
  { id: 's2', name: 'CV Sumber Pangan Utama', contact: 'Siti Rahma', phone: '085566778899', address: 'Jl. Pasar Induk No. 8, Surabaya' }
];

export default function App() {
  // Auth & Approval State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isApproved, setIsApproved] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'pending'
  const [loginEmail, setLoginEmail] = useState('admin@tokocahaya.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [currentUser, setCurrentUser] = useState({ name: 'Gilang', role: 'Pemilik' });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('id'); // 'id' | 'en'
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [purchases, setPurchases] = useState([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Operasional', note: 'Beli ATK', amount: 50000, date: new Date().toISOString().slice(0,10) }
  ]);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [amountReceived, setAmountReceived] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef(null);
  const searchInputRef = useRef(null);

  // Camera Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [scanModeForProductForm, setScanModeForProductForm] = useState(false);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const emptyProductForm = { name: '', category: '', brand: '', sku: '', barcode: '', unit: 'pcs', supplier: '', cost: 0, price: 0, stock_minimum: 5, stock: 0, expiry_date: '', image: null };
  const [productForm, setProductForm] = useState(emptyProductForm);

  // Inventory Tab State
  const [activeInvTab, setActiveInvTab] = useState('kadaluarsa');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Purchase & Supplier Tab State
  const [activePurchaseTab, setActivePurchaseTab] = useState('riwayat');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState({
    supplier: '',
    invoice: '',
    date: new Date().toLocaleDateString('id-ID'),
    items: [{ productId: '', qty: 1, cost: 0 }],
    additionalCost: 0
  });

  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', phone: '', address: '' });

  // Finance Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Operasional',
    note: '',
    amount: 0,
    date: new Date().toISOString().slice(0,10) // YYYY-MM-DD
  });

  // Reports Tab State
  const [activeReportTab, setActiveReportTab] = useState('periode');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Dashboard Detail Modal State (For clicking low stock or expiring items)
  const [dashboardDetailModal, setDashboardDetailModal] = useState(null); // 'lowStock' | 'expiring' | null

  // Store Settings State with Timezones
  const [storeSettings, setStoreSettings] = useState({
    name: 'TOKO CAHAYA YBM PLN',
    phone: '0812-3456-7890',
    taxRate: 0,
    address: 'Jl. PLN No. 123, Makassar',
    receiptMessage: 'Terima kasih telah berbelanja!',
    minStock: 5,
    expiryWarningDays: 30,
    timeZone: 'Asia/Makassar' // Default WITA
  });

  const timezonesList = [
    { label: 'WIB (Waktu Indonesia Barat - Jakarta/Surabaya)', value: 'Asia/Jakarta' },
    { label: 'WITA (Waktu Indonesia Tengah - Makassar/Bali)', value: 'Asia/Makassar' },
    { label: 'WIT (Waktu Indonesia Timur - Jayapura)', value: 'Asia/Jayapura' },
    { label: 'London, UK (GMT)', value: 'Europe/London' },
    { label: 'New York, USA (EST/EDT)', value: 'America/New_York' },
    { label: 'Tokyo, Japan (JST)', value: 'Asia/Tokyo' },
    { label: 'Sydney, Australia (AEST)', value: 'Australia/Sydney' },
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' }
  ];

  const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString('id-ID', { timeZone: storeSettings.timeZone, dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
      return new Date(date).toLocaleString();
    }
  };

  // Export functions (Excel CSV & PDF)
  const exportToCSV = (filename, rows) => {
    const processRow = (row) => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
    const csvFile = rows.map(processRow).join("\n");
    const blob = new Blob(["\ufeff" + csvFile], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportExcel = () => {
    const data = [
      ["LAPORAN KEUANGAN & PENJUALAN - TOKO CAHAYA YBM PLN"],
      ["Tanggal Cetak", new Date().toLocaleDateString('id-ID')],
      ["Zona Waktu", storeSettings.timeZone],
      [],
      ["Ringkasan Utama"],
      ["Total Penjualan", transactions.reduce((s, t) => s + t.total, 0)],
      ["HPP (COGS)", transactions.reduce((s, t) => s + t.cogs, 0)],
      ["Laba Kotor", transactions.reduce((s, t) => s + t.grossProfit, 0)],
      ["Pengeluaran", expenses.reduce((s, e) => s + e.amount, 0)],
      ["Estimasi Laba Bersih", transactions.reduce((s, t) => s + t.grossProfit, 0) - expenses.reduce((s, e) => s + e.amount, 0)],
      [],
      ["Daftar Transaksi Terbaru"],
      ["ID Transaksi", "Waktu", "Metode", "Kasir", "Total", "Laba Kotor"]
    ];
    transactions.forEach(t => {
      data.push([t.id, formatDate(t.date), t.paymentMethod, t.cashier, t.total, t.grossProfit]);
    });
    exportToCSV(`Laporan_TokoCahaya_${new Date().toISOString().slice(0,10)}.csv`, data);
  };

  // Receipt download as image using Canvas
  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 650;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(storeSettings.name, canvas.width / 2, 35);

      ctx.font = '12px monospace';
      ctx.fillText(storeSettings.address, canvas.width / 2, 55);
      ctx.fillText(`Telp: ${storeSettings.phone}`, canvas.width / 2, 73);

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(20, 90);
      ctx.lineTo(380, 90);
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '12px monospace';
      ctx.fillText(`No: ${receiptData.id}`, 20, 115);
      ctx.fillText(`Waktu: ${formatDate(receiptData.date)}`, 20, 135);
      ctx.fillText(`Kasir: ${receiptData.cashier}`, 20, 155);

      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(20, 170);
      ctx.lineTo(380, 170);
      ctx.stroke();

      let y = 195;
      receiptData.items.forEach(item => {
        ctx.fillText(item.name, 20, y);
        y += 20;
        ctx.fillText(`${item.qty} x ${formatIDR(item.price)}`, 30, y);
        ctx.textAlign = 'right';
        ctx.fillText(formatIDR(item.qty * item.price), 380, y);
        ctx.textAlign = 'left';
        y += 25;
      });

      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(380, y);
      ctx.stroke();
      y += 25;

      ctx.font = 'bold 14px monospace';
      ctx.fillText('TOTAL', 20, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatIDR(receiptData.total), 380, y);
      ctx.textAlign = 'left';
      y += 22;

      ctx.font = '12px monospace';
      ctx.fillText(`BAYAR (${receiptData.paymentMethod})`, 20, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatIDR(receiptData.received), 380, y);
      ctx.textAlign = 'left';
      y += 22;

      ctx.fillText('KEMBALI', 20, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatIDR(receiptData.change), 380, y);
      ctx.textAlign = 'left';
      y += 45;

      ctx.textAlign = 'center';
      ctx.font = '11px monospace';
      ctx.fillText(storeSettings.receiptMessage, canvas.width / 2, y);
      ctx.fillText('Terima kasih atas kunjungan Anda!', canvas.width / 2, y + 20);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Struk_${receiptData.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');

    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh gambar struk. Silakan coba lagi.");
    }
  };

  // POS Search & Add
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
    );
  }, [searchQuery, products]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert(`Stok ${product.name} kosong!`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert("Stok tidak mencukupi!");
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const prod = products.find(p => p.id === id);
        const newQty = item.qty + delta;
        if (newQty > prod.stock) {
          alert("Stok tidak mencukupi!");
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const holdCart = () => {
    if (cart.length === 0) return;
    setHeldCarts([...heldCarts, { id: Date.now(), items: cart, time: new Date().toLocaleTimeString() }]);
    setCart([]);
  };

  const resumeCart = (held) => {
    setCart(held.items);
    setHeldCarts(heldCarts.filter(h => h.id !== held.id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal;

  const handlePayment = () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    const received = parseInt(amountReceived.replace(/\D/g, '')) || 0;
    if (paymentMethod === 'Tunai' && received < total) {
        return alert("Uang diterima kurang dari total belanja!");
    }

    const change = paymentMethod === 'Tunai' ? received - total : 0;
    const grossProfit = cart.reduce((sum, item) => sum + ((item.price - item.cost) * item.qty), 0);
    const cogs = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);

    const newTransaction = {
        id: `TRX-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        items: [...cart],
        total,
        cogs,
        grossProfit,
        paymentMethod,
        received: paymentMethod === 'Tunai' ? received : total,
        change,
        cashier: currentUser.name || "Admin YBM PLN"
    };

    setProducts(prevProducts => prevProducts.map(p => {
        const cartItem = cart.find(item => item.id === p.id);
        if (cartItem) {
            return { ...p, stock: p.stock - cartItem.qty };
        }
        return p;
    }));

    setTransactions([newTransaction, ...transactions]);
    setReceiptData(newTransaction);
    setCart([]);
    setAmountReceived('');
  };

  const simulateContinuousScan = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (scanModeForProductForm) {
      setProductForm(prev => ({ ...prev, barcode: randomProduct.barcode }));
      setScanModeForProductForm(false);
      setIsScannerOpen(false);
    } else {
      addToCart(randomProduct);
      setLastScanned(randomProduct.name);
      setTimeout(() => setLastScanned(null), 1500);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Auth & Approval Screen ---
  if (!isAuthenticated || !isApproved) {
    return (
      <div className="flex h-screen w-screen bg-[#0f172a] items-center justify-center font-sans text-slate-800 p-4">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-[#10b981] rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Store size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">TOKO CAHAYA</h1>
          <p className="text-[#10b981] text-xs font-bold tracking-widest mb-6">YBM PLN</p>

          {authView === 'pending' ? (
            <div className="text-center py-6">
              <ShieldAlert size={48} className="text-amber-500 mx-auto mb-3 animate-pulse" />
              <h3 className="font-bold text-lg text-slate-800 mb-2">Menunggu Persetujuan Admin</h3>
              <p className="text-sm text-slate-500 mb-6">Akun Anda telah terdaftar dan menunggu verifikasi admin.</p>
              <button
                onClick={() => setAuthView('login')}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Kembali ke Login
              </button>
            </div>
          ) : authView === 'register' ? (
            <div className="w-full space-y-4">
              <h3 className="font-bold text-lg text-slate-800 mb-2 text-center">Pendaftaran Akun Baru</h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" placeholder="Nama Anda" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input type="email" placeholder="email@domain.com" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi</label>
                <input type="password" placeholder="••••••••" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]" />
              </div>
              <button
                onClick={() => setAuthView('pending')}
                className="w-full py-3.5 bg-[#10b981] text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-colors"
              >
                Daftar & Minta Persetujuan
              </button>
              <p className="text-center text-xs text-slate-500 pt-2">
                Sudah punya akun? <button onClick={() => setAuthView('login')} className="text-[#10b981] font-bold underline">Masuk</button>
              </p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <button
                onClick={() => {
                  setIsAuthenticated(true);
                  setIsApproved(true);
                }}
                className="w-full py-3.5 bg-[#10b981] text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-colors"
              >
                Masuk
              </button>
              <div className="flex justify-between items-center text-xs pt-2">
                <button onClick={() => setAuthView('register')} className="text-[#10b981] font-bold underline">Daftar Akun Baru</button>
                <span className="text-slate-400">Demo: admin@tokocahaya.com</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sidebar navigation
  const renderSidebar = () => {
    const navItems = [
      { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: language === 'id' ? 'Dasbor' : 'Dashboard' },
      { id: 'pos', icon: <ScanLine size={20}/>, label: language === 'id' ? 'Kasir (POS)' : 'Cashier (POS)' },
      { id: 'products', icon: <Package size={20}/>, label: language === 'id' ? 'Produk' : 'Products' },
      { id: 'inventory', icon: <Boxes size={20}/>, label: language === 'id' ? 'Inventaris' : 'Inventory' },
      { id: 'purchases', icon: <Truck size={20}/>, label: language === 'id' ? 'Pembelian' : 'Purchases' },
      { id: 'transactions', icon: <ReceiptIcon size={20}/>, label: language === 'id' ? 'Transaksi' : 'Transactions' },
      { id: 'reports', icon: <BarChart3 size={20}/>, label: language === 'id' ? 'Laporan' : 'Reports' },
      { id: 'finance', icon: <Wallet size={20}/>, label: language === 'id' ? 'Keuangan' : 'Finance' },
      { id: 'settings', icon: <Settings size={20}/>, label: language === 'id' ? 'Pengaturan' : 'Settings' },
    ];

    return (
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col shadow-xl z-20 h-screen print:hidden">
        <div className="p-5 flex flex-col items-start gap-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#10b981] rounded-lg flex items-center justify-center shadow-lg shrink-0">
                 <Store size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-sm tracking-tight leading-none uppercase">{storeSettings.name.split(' ')[0] || 'TOKO'}</h1>
                <p className="text-[#10b981] text-xs font-bold tracking-widest">{storeSettings.name.split(' ').slice(1).join(' ') || 'YBM PLN'}</p>
              </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id ? 'bg-[#10b981] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-[#10b981]" />
                <span>{language === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
              </div>
              <ChevronUp size={16} className="text-slate-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-30 p-1">
                <button
                  onClick={() => { setLanguage('id'); setIsLangMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${language === 'id' ? 'bg-[#10b981] text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  <span>Bahasa Indonesia</span> {language === 'id' && <Check size={14}/>}
                </button>
                <button
                  onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${language === 'en' ? 'bg-[#10b981] text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  <span>English</span> {language === 'en' && <Check size={14}/>}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-bold text-white">{currentUser.name} · <span className="text-[#10b981]">{currentUser.role}</span></p>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-slate-400 hover:text-red-400 flex items-center gap-1.5 text-xs font-bold transition-colors"
              title="Keluar"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </aside>
    );
  };

  // Dashboard
  const renderDashboard = () => {
    const todaySales = transactions.reduce((sum, trx) => sum + trx.total, 0);
    const todayProfit = transactions.reduce((sum, trx) => sum + trx.grossProfit, 0);
    const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
    const netProfit = todayProfit - totalExpenses;

    const lowStockProducts = products.filter(p => p.stock < (p.stock_minimum || storeSettings.minStock));
    const lowStockCount = lowStockProducts.length;

    const now = new Date();
    const expiringProducts = products.filter(p => {
      if (!p.expiry_date) return false;
      const expDate = new Date(p.expiry_date);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= storeSettings.expiryWarningDays;
    });
    const expiringCount = expiringProducts.length;

    const inventoryValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);

    const chartData = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
        const dayTotal = transactions.filter(t => new Date(t.date).getDate() === d.getDate()).reduce((sum, t) => sum + t.total, 0);
        return { name: dateStr, total: dayTotal };
    });

    const productSales: Record<string, number> = {};
    transactions.forEach(trx => {
        trx.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.qty;
        });
    });
    const bestSellers = Object.entries(productSales).map(([name, qty]) => ({name, qty})).sort((a,b) => b.qty - a.qty).slice(0, 5);

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 print:hidden">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-800">Dasbor Utama</h2>
              <p className="text-slate-500 font-medium">Ringkasan performa {storeSettings.name}. Zona Waktu: <span className="font-bold text-[#10b981]">{storeSettings.timeZone}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#10b981]">
                <span className="text-2xl font-bold text-white">Rp</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Pendapatan Hari Ini</p>
                <h3 className="text-xl font-black text-slate-800">{formatIDR(todaySales)}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-500">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Laba Kotor</p>
                <h3 className="text-xl font-black text-slate-800">{formatIDR(todayProfit)}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Estimasi Laba Bersih</p>
                <h3 className="text-xl font-black text-slate-800">{formatIDR(netProfit)}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-500">
                <ReceiptIcon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Transaksi Hari Ini</p>
                <h3 className="text-xl font-black text-slate-800">{transactions.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-700">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Produk Aktif</p>
                <h3 className="text-xl font-black text-slate-800">{products.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-teal-600">
                <Boxes className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Nilai Inventaris</p>
                <h3 className="text-xl font-black text-slate-800">{formatIDR(inventoryValue)}</h3>
              </div>
            </div>

            <div
              onClick={() => setDashboardDetailModal('lowStock')}
              className="bg-white p-5 rounded-2xl border-2 border-orange-200 hover:border-orange-400 shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:shadow-md bg-orange-50/30"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-orange-500">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Stok Menipis (Klik)</p>
                <h3 className="text-xl font-black text-orange-600">{lowStockCount} Produk</h3>
              </div>
            </div>

            <div
              onClick={() => setDashboardDetailModal('expiring')}
              className="bg-white p-5 rounded-2xl border-2 border-rose-200 hover:border-rose-400 shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:shadow-md bg-rose-50/30"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-rose-500">
                <Clock className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Mendekati Kadaluarsa (Klik)</p>
                <h3 className="text-xl font-black text-rose-600">{expiringCount} Produk</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 mb-6">Penjualan 7 Hari</h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={true} stroke="#cbd5e1" tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={true} stroke="#cbd5e1" tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                    <Tooltip formatter={(value) => formatIDR(value)} labelStyle={{color: '#0f172a', fontWeight: 'bold'}} />
                    <Line type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={3} dot={false} activeDot={{r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Produk Terlaris</h3>
              {bestSellers.length === 0 ? (
                  <div className="text-slate-400 text-sm py-8 text-center">Belum ada data</div>
              ) : (
                  <div className="space-y-3 flex-1 overflow-y-auto">
                      {bestSellers.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="font-bold text-slate-800 line-clamp-1">{p.name}</p>
                              <span className="font-black text-slate-600 bg-white px-3 py-1 rounded border border-slate-200 text-xs shrink-0 shadow-sm">{p.qty} terjual</span>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Transaksi Terbaru</h3>
              {transactions.length === 0 ? (
                  <div className="text-slate-400 text-sm py-8 text-center">Belum ada data</div>
              ) : (
                  <div className="space-y-3">
                      {transactions.slice(0, 5).map(trx => (
                          <div key={trx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <div>
                                  <p className="font-bold text-slate-800">{trx.id}</p>
                                  <p className="text-xs text-slate-500">{formatDate(trx.date)}</p>
                              </div>
                              <span className="font-black text-[#10b981]">{formatIDR(trx.total)}</span>
                          </div>
                      ))}
                  </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Kas Masuk & Keluar</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">Kas Masuk</p>
                    <p className="font-black text-[#10b981] text-lg">{formatIDR(todaySales)}</p>
                 </div>
                 <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">Kas Keluar</p>
                    <p className="font-black text-rose-500 text-lg">{formatIDR(totalExpenses)}</p>
                 </div>
              </div>

              <div className="text-xs text-slate-400 text-center mt-auto pt-2">
                Klik kartu stok menipis atau kadaluarsa di atas untuk melihat detail lengkap produk.
              </div>
            </div>
          </div>

          {dashboardDetailModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-xl text-slate-800">
                    {dashboardDetailModal === 'lowStock' ? 'Detail Produk Stok Menipis' : 'Detail Produk Mendekati Kadaluarsa'}
                  </h3>
                  <button onClick={() => setDashboardDetailModal(null)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-3 flex-1">
                  {dashboardDetailModal === 'lowStock' ? (
                    lowStockProducts.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">Tidak ada produk dengan stok menipis.</p>
                    ) : (
                      lowStockProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500">Kategori: {p.category} | Min. Stok: {p.stock_minimum || storeSettings.minStock}</p>
                          </div>
                          <span className="font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-lg text-sm">Sisa: {p.stock}</span>
                        </div>
                      ))
                    )
                  ) : (
                    expiringProducts.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">Tidak ada produk mendekati kadaluarsa.</p>
                    ) : (
                      expiringProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500">Kategori: {p.category}</p>
                          </div>
                          <span className="font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-lg text-sm">Exp: {p.expiry_date}</span>
                        </div>
                      ))
                    )
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button onClick={() => setDashboardDetailModal(null)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Tutup</button>
                </div>
              </div>
            </div>
          )}
        </div>
    );
  };

  // POS
  const renderKasir = () => (
    <div className="flex flex-1 overflow-hidden bg-slate-50 print:hidden">
      <div className="flex-1 flex flex-col border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
                <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10b981]" size={22} />
                <input
                ref={searchInputRef} type="text" placeholder="Pindai / ketik barcode atau nama produk..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#10b981] focus:outline-none focus:ring-4 focus:ring-emerald-500/20 text-lg shadow-sm"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button
              onClick={() => { setScanModeForProductForm(false); setIsScannerOpen(true); }}
              className="bg-slate-900 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md shrink-0"
            >
              <Camera size={20} /> Scan
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#10b981] hover:shadow-md transition-all text-left flex flex-col active:scale-95">
                <div className="w-full h-24 bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-slate-300 overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover"/> : <Package size={32} />}
                </div>
                <h3 className="font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{p.name}</h3>
                <div className="flex items-center justify-between w-full mt-auto pt-2">
                  <span className="font-black text-[#10b981]">{formatIDR(p.price)}</span>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      Sisa {p.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[420px] bg-white flex flex-col z-10 shadow-2xl relative">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
             Keranjang ({cart.reduce((sum, item) => sum + item.qty, 0)})
          </h2>
          <div className="flex gap-2">
            <button onClick={holdCart} className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-50">
              <PauseCircle size={16}/> Tahan
            </button>
            <div className="relative group">
              <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-50">
                <History size={16}/> {heldCarts.length}
              </button>
              {heldCarts.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white shadow-xl border border-slate-200 rounded-xl p-2 z-30 hidden group-hover:block">
                  <p className="text-xs font-bold text-slate-400 px-2 py-1">Keranjang Ditahan:</p>
                  {heldCarts.map(h => (
                    <div key={h.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => resumeCart(h)}>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{h.time}</p>
                        <p className="text-[10px] text-slate-500">{h.items.length} item</p>
                      </div>
                      <span className="text-xs font-bold text-[#10b981]">Lanjutkan</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium">
              <ScanLine size={48} className="mb-4 opacity-20" />
              Keranjang kosong
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex flex-col p-3 border border-slate-100 rounded-xl bg-slate-50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="pr-2">
                      <h4 className="font-bold text-slate-800 leading-tight">{item.name}</h4>
                      <p className="text-[#10b981] font-semibold text-sm">{formatIDR(item.price)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 shrink-0 p-1"><Trash2 size={16}/></button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600"><Minus size={16}/></button>
                      <span className="w-10 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600"><Plus size={16}/></button>
                    </div>
                    <span className="font-black text-slate-800 text-lg">{formatIDR(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-medium">Subtotal</span>
            <span className="font-bold text-slate-800">{formatIDR(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-xl text-slate-800">Total</span>
            <span className="font-black text-4xl text-[#10b981]">{formatIDR(total)}</span>
          </div>

          <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl">
            {['Tunai', 'Transfer', 'QRIS', 'Debit'].map(method => (
              <button
                key={method} onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${paymentMethod === method ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'Tunai' && (
              <>
                <div className="mb-4 relative">
                    <input
                    type="text"
                    placeholder="Uang Diterima"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981] font-black text-2xl text-slate-800"
                    />
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    {['Rp0', 'Rp50.000', 'Rp100.000', 'Rp150.000', 'Rp200.000'].map(val => (
                    <button
                        key={val}
                        onClick={() => setAmountReceived(val === 'Rp0' ? total.toString() : val.replace(/\D/g, ''))}
                        className="whitespace-nowrap px-4 py-2.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 border border-slate-200"
                    >
                        {val}
                    </button>
                    ))}
                </div>
              </>
          )}

          <button
            onClick={handlePayment}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${cart.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#10b981] hover:bg-emerald-600 text-white'}`}
          >
            Proses Pembayaran
          </button>
        </div>
      </div>
    </div>
  );

  // Products
  const renderProducts = () => {
    const margin = productForm.price && productForm.cost ? Math.round(((productForm.price - productForm.cost) / productForm.cost) * 100) : 0;

    return (
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-3xl font-black text-slate-800">Produk</h2>
              <p className="text-slate-500 font-medium">Kelola katalog barang {storeSettings.name}.</p>
          </div>
          <button
              onClick={() => { setProductForm(emptyProductForm); setIsProductModalOpen(true); }}
              className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50">
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Cari..." className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981] bg-white shadow-sm" />
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-200">
              <tr className="text-slate-500 text-sm">
                <th className="p-4 font-semibold">Nama</th>
                <th className="p-4 font-semibold">SKU/Barcode</th>
                <th className="p-4 font-semibold text-right">Harga Beli</th>
                <th className="p-4 font-semibold text-right">Harga Jual</th>
                <th className="p-4 font-semibold text-center">Stok</th>
                <th className="p-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">Belum ada data</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                           {p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <Package size={20} className="text-slate-400"/>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.category} · {p.brand}</p>
                        </div>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-sm">{p.barcode || p.sku || '-'}</td>
                    <td className="p-4 text-slate-600 text-right font-medium">{formatIDR(p.cost)}</td>
                    <td className="p-4 text-[#10b981] font-black text-right">{formatIDR(p.price)}</td>
                    <td className="p-4 text-center">
                        <span className={`font-bold px-3 py-1 rounded-full text-xs ${p.stock < storeSettings.minStock ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                            {p.stock}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">Aktif</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Tambah Produk */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print:hidden overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-xl text-slate-800">Tambah Produk</h3>
                <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                    {productForm.image ? <img src={productForm.image} className="w-full h-full object-cover"/> : <Package size={32} className="text-slate-400"/>}
                  </div>
                  <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm">
                    <Upload size={16}/> Unggah Gambar
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama</label>
                  <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                    value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Merek</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">SKU</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Barcode</label>
                    <div className="flex gap-2">
                      <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                        value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})}
                      />
                      <button
                        onClick={() => { setScanModeForProductForm(true); setIsScannerOpen(true); }}
                        type="button"
                        className="p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 shrink-0"
                      >
                        <Camera size={20}/>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Satuan</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pemasok</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.supplier} onChange={e => setProductForm({...productForm, supplier: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Harga Beli</label>
                    <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.cost} onChange={e => setProductForm({...productForm, cost: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Harga Jual</label>
                    <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.price} onChange={e => setProductForm({...productForm, price: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Stok Minimum</label>
                    <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.stock_minimum} onChange={e => setProductForm({...productForm, stock_minimum: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-500">Margin: <span className="text-[#10b981]">{margin}%</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Stok Awal</label>
                    <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tgl Kadaluarsa</label>
                    <input type="date" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={productForm.expiry_date} onChange={e => setProductForm({...productForm, expiry_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsProductModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Batal</button>
                <button
                  onClick={() => {
                    if (!productForm.name) return alert("Nama produk wajib diisi!");
                    setProducts([{ ...productForm, id: `p${Date.now()}`, status: true }, ...products]);
                    setIsProductModalOpen(false);
                  }}
                  className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
                >Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Inventory
  const renderInventory = () => (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto print:hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-black text-slate-800">Inventaris</h2>
            <p className="text-slate-500 font-medium">Manajemen batch dan kadaluarsa produk.</p>
        </div>
        <button
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Tambah Batch
        </button>
      </div>

      <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl w-fit">
        {[
          { id: 'kadaluarsa', label: 'Mendekati Kadaluarsa' },
          { id: 'batch', label: 'Batch Inventaris' },
          { id: 'pergerakan', label: 'Pergerakan Stok' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveInvTab(tab.id)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeInvTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
            {activeInvTab === 'kadaluarsa' && (
              <tr>
                <th className="p-4 font-semibold">Nama</th>
                <th className="p-4 font-semibold">No. Lot</th>
                <th className="p-4 font-semibold">Tgl Kadaluarsa</th>
                <th className="p-4 font-semibold text-center">Sisa</th>
                <th className="p-4 font-semibold text-right">Nilai Berisiko</th>
                <th className="p-4 font-semibold text-center">Status</th>
              </tr>
            )}
            {activeInvTab === 'batch' && (
              <tr>
                <th className="p-4 font-semibold">Nama</th>
                <th className="p-4 font-semibold">No. Lot</th>
                <th className="p-4 font-semibold">Tgl Masuk</th>
                <th className="p-4 font-semibold text-center">Stok Awal</th>
                <th className="p-4 font-semibold text-center">Sisa Stok</th>
              </tr>
            )}
            {activeInvTab === 'pergerakan' && (
              <tr>
                <th className="p-4 font-semibold">Tanggal</th>
                <th className="p-4 font-semibold">Produk</th>
                <th className="p-4 font-semibold">Jenis</th>
                <th className="p-4 font-semibold text-center">Jumlah</th>
                <th className="p-4 font-semibold">Keterangan</th>
              </tr>
            )}
          </thead>
          <tbody>
            <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">Belum ada data</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Purchases
  const renderPurchases = () => {
    const totalPurchaseCost = purchaseForm.items.reduce((sum, item) => sum + (item.qty * item.cost), 0) + (purchaseForm.additionalCost || 0);

    return (
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-3xl font-black text-slate-800">Pembelian</h2>
              <p className="text-slate-500 font-medium">Kelola pesanan pembelian (PO) dan data pemasok.</p>
          </div>
          {activePurchaseTab === 'riwayat' ? (
            <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} /> Pembelian Baru
            </button>
          ) : (
            <button
                onClick={() => setIsSupplierModalOpen(true)}
                className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} /> Tambah Pemasok
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6 bg-slate-200/60 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActivePurchaseTab('riwayat')}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activePurchaseTab === 'riwayat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Riwayat Pembelian
          </button>
          <button
            onClick={() => setActivePurchaseTab('pemasok')}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activePurchaseTab === 'pemasok' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Pemasok
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {activePurchaseTab === 'riwayat' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">No. PO</th>
                  <th className="p-4 font-semibold">Pemasok</th>
                  <th className="p-4 font-semibold">No. Faktur</th>
                  <th className="p-4 font-semibold">Tgl Pembelian</th>
                  <th className="p-4 font-semibold">Item</th>
                  <th className="p-4 font-semibold text-right">Total Keseluruhan</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">Belum ada data</td></tr>
                ) : (
                  purchases.map(po => (
                    <tr key={po.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{po.id}</td>
                      <td className="p-4 text-slate-700 font-medium">{po.supplier}</td>
                      <td className="p-4 text-slate-500 text-sm">{po.invoice}</td>
                      <td className="p-4 text-slate-500 text-sm">{po.date}</td>
                      <td className="p-4 text-slate-600 text-sm">{po.items.map(i => `${i.name} (${i.qty}x)`).join(', ')}</td>
                      <td className="p-4 font-black text-[#10b981] text-right">{formatIDR(po.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Kontak</th>
                  <th className="p-4 font-semibold">Telepon</th>
                  <th className="p-4 font-semibold">Alamat</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">Belum ada data</td></tr>
                ) : (
                  suppliers.map(sup => (
                    <tr key={sup.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{sup.name}</td>
                      <td className="p-4 text-slate-700">{sup.contact}</td>
                      <td className="p-4 text-slate-600 text-sm">{sup.phone}</td>
                      <td className="p-4 text-slate-500 text-sm">{sup.address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {isPurchaseModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                   <h3 className="font-bold text-xl text-slate-800">Pembelian Baru</h3>
                   <p className="text-xs text-slate-500">Stok otomatis ditambahkan saat pembelian disimpan</p>
                </div>
                <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pemasok</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#10b981]"
                      value={purchaseForm.supplier}
                      onChange={e => setPurchaseForm({...purchaseForm, supplier: e.target.value})}
                    >
                      <option value="">Pilih Pemasok</option>
                      {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">No. Faktur</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={purchaseForm.invoice} onChange={e => setPurchaseForm({...purchaseForm, invoice: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tgl Pembelian</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setPurchaseForm({...purchaseForm, items: [...purchaseForm.items, { productId: '', qty: 1, cost: 0 }]})}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={16}/> Tambah Item
                  </button>
                </div>

                {purchaseForm.items.map((it, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <select
                      className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-white text-sm"
                      value={it.productId}
                      onChange={e => {
                        const prod = products.find(p => p.id === e.target.value);
                        const newItems = [...purchaseForm.items];
                        newItems[idx] = { ...newItems[idx], productId: e.target.value, cost: prod ? prod.cost : 0 };
                        setPurchaseForm({...purchaseForm, items: newItems});
                      }}
                    >
                      <option value="">Pilih Produk</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" placeholder="Qty" className="w-20 p-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                      value={it.qty} onChange={e => {
                        const newItems = [...purchaseForm.items];
                        newItems[idx].qty = parseInt(e.target.value) || 1;
                        setPurchaseForm({...purchaseForm, items: newItems});
                      }}
                    />
                    <input type="number" placeholder="Harga Beli" className="w-32 p-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                      value={it.cost} onChange={e => {
                        const newItems = [...purchaseForm.items];
                        newItems[idx].cost = parseInt(e.target.value) || 0;
                        setPurchaseForm({...purchaseForm, items: newItems});
                      }}
                    />
                    <button onClick={() => {
                      const newItems = purchaseForm.items.filter((_, i) => i !== idx);
                      setPurchaseForm({...purchaseForm, items: newItems});
                    }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Biaya Tambahan</label>
                    <input type="number" className="p-3 border border-slate-200 rounded-xl w-48 focus:outline-none focus:border-[#10b981]"
                      value={purchaseForm.additionalCost} onChange={e => setPurchaseForm({...purchaseForm, additionalCost: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total Keseluruhan</p>
                    <h4 className="text-2xl font-black text-[#10b981]">{formatIDR(totalPurchaseCost)}</h4>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsPurchaseModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Batal</button>
                <button
                  onClick={() => {
                    if (!purchaseForm.supplier) return alert("Pilih pemasok terlebih dahulu!");
                    if (purchaseForm.items.length === 0 || !purchaseForm.items[0].productId) return alert("Tambahkan minimal 1 item produk!");

                    const newPO = {
                      id: `PO-${Date.now().toString().slice(-6)}`,
                      supplier: purchaseForm.supplier,
                      invoice: purchaseForm.invoice || 'INV-001',
                      date: purchaseForm.date,
                      items: purchaseForm.items.map(it => {
                        const p = products.find(prod => prod.id === it.productId);
                        return { productId: it.productId, name: p ? p.name : 'Produk', qty: it.qty, cost: it.cost };
                      }),
                      total: totalPurchaseCost
                    };

                    setProducts(prev => prev.map(p => {
                      const found = purchaseForm.items.find(i => i.productId === p.id);
                      if (found) {
                        return { ...p, stock: p.stock + found.qty, cost: found.cost };
                      }
                      return p;
                    }));

                    setPurchases([newPO, ...purchases]);
                    setIsPurchaseModalOpen(false);
                    setPurchaseForm({ supplier: '', invoice: '', date: new Date().toLocaleDateString('id-ID'), items: [{ productId: '', qty: 1, cost: 0 }], additionalCost: 0 });
                  }}
                  className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
                >Simpan</button>
              </div>
            </div>
          </div>
        )}

        {isSupplierModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-xl text-slate-800">Tambah Pemasok</h3>
                <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama</label>
                  <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                    value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Kontak</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={supplierForm.contact} onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Telepon</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                      value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Alamat</label>
                  <textarea className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981] h-24"
                    value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsSupplierModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Batal</button>
                <button
                  onClick={() => {
                    if (!supplierForm.name) return alert("Nama pemasok wajib diisi!");
                    setSuppliers([{ ...supplierForm, id: `s${Date.now()}` }, ...suppliers]);
                    setIsSupplierModalOpen(false);
                    setSupplierForm({ name: '', contact: '', phone: '', address: '' });
                  }}
                  className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
                >Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Transactions
  const renderTransactions = () => (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto print:hidden">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-800">Riwayat Transaksi</h2>
        <p className="text-slate-500 font-medium">Catatan penjualan {storeSettings.name}.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
            <tr>
              <th className="p-4 font-semibold">No. Transaksi</th>
              <th className="p-4 font-semibold">Waktu</th>
              <th className="p-4 font-semibold">Metode</th>
              <th className="p-4 font-semibold">Kasir</th>
              <th className="p-4 font-semibold text-right">Total Penjualan</th>
              <th className="p-4 font-semibold text-right">Laba Kotor</th>
            </tr>
          </thead>
          <tbody>
             {transactions.length === 0 ? (
                 <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">Belum ada transaksi</td></tr>
             ) : (
                 transactions.map(trx => (
                    <tr key={trx.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{trx.id}</td>
                        <td className="p-4 text-slate-500 text-sm">{formatDate(trx.date)}</td>
                        <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{trx.paymentMethod}</span></td>
                        <td className="p-4 text-slate-600 text-sm">{trx.cashier}</td>
                        <td className="p-4 font-black text-[#10b981] text-right">{formatIDR(trx.total)}</td>
                        <td className="p-4 font-bold text-blue-500 text-right">{formatIDR(trx.grossProfit)}</td>
                    </tr>
                 ))
             )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Reports
  const renderReports = () => {
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalCOGS = transactions.reduce((sum, t) => sum + t.cogs, 0);
    const totalGrossProfit = transactions.reduce((sum, t) => sum + t.grossProfit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalGrossProfit - totalExpenses;
    const margin = totalSales > 0 ? Math.round((totalGrossProfit / totalSales) * 100) : 0;

    const productSalesMap: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};
    transactions.forEach(trx => {
      trx.items.forEach(item => {
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = { name: item.name, qty: 0, revenue: 0, profit: 0 };
        }
        productSalesMap[item.id].qty += item.qty;
        productSalesMap[item.id].revenue += item.price * item.qty;
        productSalesMap[item.id].profit += (item.price - item.cost) * item.qty;
      });
    });
    const productSalesList = Object.values(productSalesMap);

    const paymentMethodsMap: Record<string, number> = {};
    transactions.forEach(trx => {
      paymentMethodsMap[trx.paymentMethod] = (paymentMethodsMap[trx.paymentMethod] || 0) + trx.total;
    });

    const cashierMap: Record<string, { count: number; profit: number }> = {};
    transactions.forEach(trx => {
      if (!cashierMap[trx.cashier]) {
        cashierMap[trx.cashier] = { count: 0, profit: 0 };
      }
      cashierMap[trx.cashier].count += 1;
      cashierMap[trx.cashier].profit += trx.grossProfit;
    });
    const cashierList = Object.entries(cashierMap).map(([name, data]) => ({ name, ...data }));

    const months = [
      { name: 'Jan', num: 0 }, { name: 'Feb', num: 1 }, { name: 'Mar', num: 2 },
      { name: 'Apr', num: 3 }, { name: 'Mei', num: 4 }, { name: 'Jun', num: 5 },
      { name: 'Jul', num: 6 }, { name: 'Agu', num: 7 }, { name: 'Sep', num: 8 },
      { name: 'Okt', num: 9 }, { name: 'Nov', num: 10 }, { name: 'Des', num: 11 }
    ];

    const currentYearNum = new Date().getFullYear();
    const yearsList = Array.from({ length: 101 }, (_, i) => (currentYearNum + i).toString());

    return (
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-3xl font-black text-slate-800">Laporan</h2>
              <p className="text-slate-500 font-medium">Analisis laporan penjualan dan performa bisnis.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 shadow-sm">
              <Printer size={16}/> Ekspor PDF
            </button>
            <button onClick={exportReportExcel} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 shadow-sm">
              <Download size={16}/> Ekspor Excel
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-slate-200/60 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActiveReportTab('periode')}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeReportTab === 'periode' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Laporan Periode
          </button>
          <button
            onClick={() => setActiveReportTab('bulanan')}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeReportTab === 'bulanan' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Rekap Bulanan
          </button>
        </div>

        {activeReportTab === 'periode' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Penjualan</p>
                <h3 className="text-2xl font-black text-[#10b981]">{formatIDR(totalSales)}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">HPP (COGS)</p>
                <h3 className="text-2xl font-black text-slate-800">{formatIDR(totalCOGS)}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Laba Kotor</p>
                <h3 className="text-2xl font-black text-blue-600">{formatIDR(totalGrossProfit)}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Estimasi Laba Bersih</p>
                <h3 className="text-2xl font-black text-indigo-600">{formatIDR(netProfit)}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Jml Transaksi</p>
                <h3 className="text-2xl font-black text-slate-800">{transactions.length}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Pengeluaran</p>
                <h3 className="text-2xl font-black text-rose-500">{formatIDR(totalExpenses)}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Jml Refund</p>
                <h3 className="text-2xl font-black text-slate-800">0</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Margin Laba</p>
                <h3 className="text-2xl font-black text-slate-800">{margin}%</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Penjualan Produk</h3>
                <button onClick={exportReportExcel} className="border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-50">
                   <Download size={14}/> Ekspor Excel
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 text-sm text-slate-500">
                  <tr>
                    <th className="p-4 font-semibold">Nama</th>
                    <th className="p-4 font-semibold text-center">Jml Terjual</th>
                    <th className="p-4 font-semibold text-right">Pendapatan</th>
                    <th className="p-4 font-semibold text-right">Laba</th>
                  </tr>
                </thead>
                <tbody>
                  {productSalesList.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Belum ada data</td></tr>
                  ) : (
                    productSalesList.map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{p.name}</td>
                        <td className="p-4 text-center font-medium text-slate-600">{p.qty}</td>
                        <td className="p-4 text-right font-bold text-[#10b981]">{formatIDR(p.revenue)}</td>
                        <td className="p-4 text-right font-bold text-blue-600">{formatIDR(p.profit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-5">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Metode Pembayaran</h3>
                {Object.keys(paymentMethodsMap).length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center">Belum ada data</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(paymentMethodsMap).map(([method, amount], idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700">{method}</span>
                        <span className="font-black text-[#10b981]">{formatIDR(amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">Kinerja Kasir</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-sm text-slate-500">
                    <tr>
                      <th className="p-4 font-semibold">Kasir</th>
                      <th className="p-4 font-semibold text-center">Jml Transaksi</th>
                      <th className="p-4 font-semibold text-right">Laba</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashierList.length === 0 ? (
                      <tr><td colSpan={3} className="p-8 text-center text-slate-400">Belum ada data</td></tr>
                    ) : (
                      cashierList.map((c, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="p-4 font-bold text-slate-800">{c.name}</td>
                          <td className="p-4 text-center font-medium">{c.count}</td>
                          <td className="p-4 text-right font-bold text-blue-600">{formatIDR(c.profit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-800">Rekap Bulanan {selectedYear}</h3>
              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                >
                  {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button onClick={() => window.print()} className="border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50">
                  <Printer size={16}/> Ekspor PDF
                </button>
                <button onClick={exportReportExcel} className="border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50">
                  <Download size={16}/> Ekspor Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                  <tr>
                    <th className="p-4 font-semibold">Bulan</th>
                    <th className="p-4 font-semibold text-center">Jml Transaksi</th>
                    <th className="p-4 font-semibold text-right">Total Penjualan</th>
                    <th className="p-4 font-semibold text-right">HPP (COGS)</th>
                    <th className="p-4 font-semibold text-right">Laba Kotor</th>
                    <th className="p-4 font-semibold text-right">Pengeluaran Saja</th>
                    <th className="p-4 font-semibold text-right">Estimasi Laba Bersih</th>
                    <th className="p-4 font-semibold text-right">Pembelian</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, idx) => {
                    const monthTrxs = transactions.filter(t => {
                      const d = new Date(t.date);
                      return d.getFullYear().toString() === selectedYear && d.getMonth() === m.num;
                    });
                    const mSales = monthTrxs.reduce((s, t) => s + t.total, 0);
                    const mCogs = monthTrxs.reduce((s, t) => s + t.cogs, 0);
                    const mGross = monthTrxs.reduce((s, t) => s + t.grossProfit, 0);

                    const monthExpenses = expenses.filter(e => {
                      if (!e.date) return idx === 0;
                      const d = new Date(e.date);
                      return d.getFullYear().toString() === selectedYear && d.getMonth() === m.num;
                    });
                    const mExp = monthExpenses.reduce((s, e) => s + e.amount, 0);
                    const mNet = mGross - mExp;

                    const mPurchasesTotal = idx === 0 ? purchases.reduce((s, p) => s + p.total, 0) : 0;

                    return (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-4 font-bold text-[#10b981]">{m.name}</td>
                        <td className="p-4 text-center">{monthTrxs.length}</td>
                        <td className="p-4 text-right">{formatIDR(mSales)}</td>
                        <td className="p-4 text-right">{formatIDR(mCogs)}</td>
                        <td className="p-4 text-right">{formatIDR(mGross)}</td>
                        <td className="p-4 text-right text-rose-500">{formatIDR(mExp)}</td>
                        <td className="p-4 text-right font-bold text-[#10b981]">{formatIDR(mNet)}</td>
                        <td className="p-4 text-right">{formatIDR(mPurchasesTotal)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/80 font-black text-slate-900">
                    <td className="p-4">Total</td>
                    <td className="p-4 text-center">{transactions.length}</td>
                    <td className="p-4 text-right">{formatIDR(totalSales)}</td>
                    <td className="p-4 text-right">{formatIDR(totalCOGS)}</td>
                    <td className="p-4 text-right">{formatIDR(totalGrossProfit)}</td>
                    <td className="p-4 text-right text-rose-500">{formatIDR(totalExpenses)}</td>
                    <td className="p-4 text-right text-[#10b981]">{formatIDR(netProfit)}</td>
                    <td className="p-4 text-right">{formatIDR(purchases.reduce((s, p) => s + p.total, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Finance
  const renderFinance = () => {
    const totalIncome = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const cashBalance = totalIncome - totalExpense;

    return (
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-3xl font-black text-slate-800">Keuangan & Kas</h2>
              <p className="text-slate-500 font-medium">Pencatatan kas masuk dan kas keluar usaha.</p>
          </div>
          <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Tambah Pengeluaran
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Kas Masuk</p>
            <h3 className="text-2xl font-black text-[#10b981]">{formatIDR(totalIncome)}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Kas Keluar</p>
            <h3 className="text-2xl font-black text-rose-500">{formatIDR(totalExpense)}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Saldo Kas</p>
            <h3 className="text-2xl font-black text-slate-800">{formatIDR(cashBalance)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Tanggal</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">Catatan</th>
                <th className="p-4 font-semibold text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400">Belum ada data pengeluaran</td></tr>
              ) : (
                expenses.map((ex, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="p-4 text-slate-500 text-sm">{ex.date}</td>
                    <td className="p-4 font-bold text-slate-800">{ex.category}</td>
                    <td className="p-4 text-slate-600 text-sm">{ex.note}</td>
                    <td className="p-4 text-right font-black text-rose-500">{formatIDR(ex.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isExpenseModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-xl text-slate-800">Tambah Pengeluaran</h3>
                <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal</label>
                  <input type="date" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                    value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                  <select className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                    value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Listrik & Air">Listrik & Air</option>
                    <option value="Gaji Karyawan">Gaji Karyawan</option>
                    <option value="Transportasi">Transportasi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah (Rp)</label>
                  <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                    value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Catatan</label>
                  <textarea className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981] h-20"
                    value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsExpenseModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Batal</button>
                <button
                  onClick={() => {
                    if (expenseForm.amount <= 0) return alert("Jumlah pengeluaran harus lebih dari 0!");
                    setExpenses([{ ...expenseForm, id: Date.now() }, ...expenses]);
                    setIsExpenseModalOpen(false);
                    setExpenseForm({ category: 'Operasional', note: '', amount: 0, date: new Date().toISOString().slice(0,10) });
                  }}
                  className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
                >Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Settings
  const renderSettings = () => (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto print:hidden">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-800">Pengaturan Toko</h2>
        <p className="text-slate-500 font-medium">Informasi, profil bisnis, dan zona waktu {storeSettings.name}.</p>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-2xl space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Nama Toko</label>
          <input
            type="text"
            className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-[#10b981]"
            value={storeSettings.name}
            onChange={e => setStoreSettings({...storeSettings, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Telepon</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              value={storeSettings.phone}
              onChange={e => setStoreSettings({...storeSettings, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tarif Pajak (%)</label>
            <input
              type="number"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              value={storeSettings.taxRate}
              onChange={e => setStoreSettings({...storeSettings, taxRate: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Alamat</label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981] h-20"
            value={storeSettings.address}
            onChange={e => setStoreSettings({...storeSettings, address: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Pesan Struk</label>
          <input
            type="text"
            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
            value={storeSettings.receiptMessage}
            onChange={e => setStoreSettings({...storeSettings, receiptMessage: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Zona Waktu (Wilayah Indonesia & Dunia)</label>
          <select
            className="w-full p-3 border border-slate-200 rounded-xl bg-white font-bold focus:outline-none focus:border-[#10b981]"
            value={storeSettings.timeZone}
            onChange={e => setStoreSettings({...storeSettings, timeZone: e.target.value})}
          >
            {timezonesList.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">Waktu saat ini di zona terpilih: {new Date().toLocaleTimeString('id-ID', { timeZone: storeSettings.timeZone })}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Ambang Stok Minimum</label>
            <input
              type="number"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              value={storeSettings.minStock}
              onChange={e => setStoreSettings({...storeSettings, minStock: parseInt(e.target.value) || 5})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Peringatan Kadaluarsa (hari)</label>
            <input
              type="number"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              value={storeSettings.expiryWarningDays}
              onChange={e => setStoreSettings({...storeSettings, expiryWarningDays: parseInt(e.target.value) || 30})}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => alert("Pengaturan toko berhasil disimpan!")}
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
            body { background: white; margin: 0; padding: 0; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:absolute { position: absolute; left: 0; top: 0; }
            .print\\:w-full { width: 100%; max-width: 100%; }
        }
      `}} />

      {renderSidebar()}

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'pos' && renderKasir()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'purchases' && renderPurchases()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'settings' && renderSettings()}

        {isScannerOpen && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4 print:hidden">
                <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                    <div className="p-5 bg-slate-900 text-white font-bold flex justify-between items-center">
                        <span className="flex items-center gap-2"><Camera size={20}/> Scan Barcode / Kamera</span>
                        <button onClick={() => setIsScannerOpen(false)} className="hover:bg-slate-700 p-1 rounded-lg"><X size={20}/></button>
                    </div>

                    <div className="p-8 bg-slate-50 flex flex-col items-center relative">
                        <div className="w-64 h-64 border-4 border-dashed border-[#10b981] flex items-center justify-center bg-slate-200 mb-6 relative overflow-hidden rounded-2xl shadow-inner">
                            <div className="absolute w-full h-1 bg-red-500/75 shadow-[0_0_15px_red] animate-[scan_2s_ease-in-out_infinite]"></div>
                            <Camera size={48} className="text-slate-400 opacity-30" />
                        </div>

                        <p className="text-sm text-slate-500 font-medium mb-6 text-center">Arahkan kamera ke barcode produk.<br/>{scanModeForProductForm ? 'Barcode akan otomatis mengisi form.' : 'Produk otomatis masuk ke keranjang.'}</p>

                        <div className="h-10 w-full mb-4 flex items-center justify-center">
                            {lastScanned ? (
                                <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 animate-bounce">
                                    <CheckCircle2 size={16} /> Berhasil scan: {lastScanned}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex w-full gap-3">
                            <button
                                onClick={simulateContinuousScan}
                                className="bg-[#10b981] hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold flex-1 shadow-lg flex items-center justify-center gap-2"
                            >
                                <ScanLine size={18}/> Simulasi Scan
                            </button>
                            <button
                                onClick={() => setIsScannerOpen(false)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-xl font-bold flex-1 shadow-sm"
                            >
                                Stop Scan
                            </button>
                        </div>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
                `}} />
            </div>
        )}

        {receiptData && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 print:bg-white print:p-0 print:block">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-[360px] overflow-hidden flex flex-col print:rounded-none print:shadow-none print:w-full print:max-w-none print:absolute print:left-0 print:top-0">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
                        <button onClick={downloadReceiptAsImage} className="bg-[#10b981] text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-600 shadow-sm">
                            <ImageIcon size={16}/> Unduh Gambar
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => window.print()} className="bg-slate-800 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-slate-700">
                              <Printer size={16}/> Cetak
                          </button>
                          <button onClick={() => setReceiptData(null)} className="bg-red-100 text-red-600 px-3 py-2 rounded-lg font-bold text-xs hover:bg-red-200">
                              Tutup
                          </button>
                        </div>
                    </div>

                    <div ref={receiptRef} className="p-6 font-mono text-sm text-black bg-white">
                        <div className="text-center mb-6">
                            <h2 className="font-black text-xl mb-1 uppercase">{storeSettings.name}</h2>
                            <p className="text-xs">{storeSettings.address}<br/>Telp: {storeSettings.phone}</p>
                        </div>

                        <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-xs">
                            <div className="flex justify-between"><span>Tgl:</span> <span>{formatDate(receiptData.date)}</span></div>
                            <div className="flex justify-between"><span>No:</span> <span>{receiptData.id}</span></div>
                            <div className="flex justify-between"><span>Kasir:</span> <span>{receiptData.cashier}</span></div>
                        </div>

                        <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                            {receiptData.items.map(item => (
                                <div key={item.id} className="mb-2">
                                    <div>{item.name}</div>
                                    <div className="flex justify-between text-xs">
                                        <span>{item.qty} x {formatIDR(item.price)}</span>
                                        <span>{formatIDR(item.qty * item.price)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-b border-dashed border-slate-400 pb-2 mb-4 font-bold text-sm">
                            <div className="flex justify-between"><span>TOTAL</span> <span>{formatIDR(receiptData.total)}</span></div>
                            <div className="flex justify-between"><span>BAYAR ({receiptData.paymentMethod})</span> <span>{formatIDR(receiptData.received)}</span></div>
                            <div className="flex justify-between"><span>KEMBALI</span> <span>{formatIDR(receiptData.change)}</span></div>
                        </div>

                        <div className="text-center text-xs space-y-1">
                            <p>{storeSettings.receiptMessage}</p>
                            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}