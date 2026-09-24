import React, { useState } from 'react';
import { PharmacyItem } from '../types';
import { forecastPharmacyDemand } from '../ai-engine';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Pill, 
  Search, 
  Scan, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight,
  ShoppingCart
} from 'lucide-react';

interface PharmacyManagementProps {
  pharmacyItems: PharmacyItem[];
  onBack: () => void;
}

export const PharmacyManagement: React.FC<PharmacyManagementProps> = ({
  pharmacyItems,
  onBack,
}) => {
  const [items, setItems] = useState<PharmacyItem[]>(pharmacyItems);
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [scanning, setScanning] = useState(false);

  const forecast = forecastPharmacyDemand(items);

  const categories = ['All', 'Analgesics', 'Antibiotics', 'Cardiovascular', 'Gastroenterology', 'Antidiabetic', 'Respiratory'];

  const filtered = items.filter(item => {
    const qMatch = item.name.toLowerCase().includes(query.toLowerCase()) || 
                   item.batchNumber.toLowerCase().includes(query.toLowerCase());
    const catMatch = selectedCat === 'All' || item.category === selectedCat;
    return qMatch && catMatch;
  });

  const handleDispense = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, stockQuantity: Math.max(0, item.stockQuantity - 1) } : item));
  };

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setQuery('Paracetamol 650mg');
      setScanning(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
        >
          ← Back to Dashboard
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-healthcare-100 text-healthcare-700 border border-healthcare-300">
          Smart Pharmacy & Inventory AI
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-healthcare-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-healthcare-500 text-white flex items-center justify-center font-bold text-2xl shadow-floating">
            💊
          </div>
          <div>
            <h2 className="text-2xl font-black">Digital Pharmacy & AI Demand Engine</h2>
            <p className="text-xs text-slate-300">Real-time stock tracking, barcode scanning, and AI restock forecasting.</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-700/80 text-center text-xs">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Total Inventory SKUs</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{items.length} Items</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Critical Low Stock Alerts</span>
            <span className="text-2xl font-black text-rose-400 mt-0.5 block">{forecast.criticalRestockCount} SKUs</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">High AI Demand SKUs</span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">{forecast.highDemandCount} Items</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Total Stock Valuation</span>
            <span className="text-2xl font-black text-healthcare-300 mt-0.5 block">
              ₹{forecast.totalInventoryValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock AI Alert Banner */}
      {forecast.criticalRestockCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500 text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
              <h4 className="font-bold text-sm">CRITICAL INVENTORY ALERT: {forecast.criticalRestockCount} Medicine SKUs Below Safety Threshold</h4>
            </div>

            <button
              onClick={() => alert('Generating automated purchase orders with Sun Pharma & Cipla...')}
              className="px-3.5 py-1.5 rounded-xl bg-white text-rose-600 font-extrabold text-xs shadow hover:bg-slate-100 transition"
            >
              Generate AI Purchase Orders
            </button>
          </div>
        </div>
      )}

      {/* Search & Barcode Scan Bar */}
      <GlassCard className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicine name, batch number (e.g. Mox 500, BAT-2026)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-healthcare-500"
            />
          </div>

          <button
            onClick={handleSimulateScan}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border shadow ${
              scanning ? 'bg-healthcare-500 text-white animate-pulse' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Scan className="w-4 h-4 text-healthcare-400" />
            <span>{scanning ? 'Scanning Barcode...' : 'Simulate Barcode Scanner'}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === cat
                  ? 'bg-healthcare-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Pharmacy Inventory Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-3 rounded-l-xl">Medicine & Batch</th>
                <th className="p-3">Category</th>
                <th className="p-3">Stock Qty</th>
                <th className="p-3">Price/Unit</th>
                <th className="p-3">AI Demand</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.slice(0, 15).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.batchNumber} • {item.manufacturer}</span>
                  </td>

                  <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">
                    {item.category}
                  </td>

                  <td className="p-3">
                    <span className={`font-extrabold text-sm ${item.stockQuantity < item.minThreshold ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                      {item.stockQuantity} Units
                    </span>
                  </td>

                  <td className="p-3 font-semibold text-healthcare-600 dark:text-healthcare-400">
                    ₹{item.pricePerUnit}
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      item.aiDemandForecast === 'Critical' ? 'bg-rose-100 text-rose-700' : item.aiDemandForecast === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.aiDemandForecast}
                    </span>
                  </td>

                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {item.expiryDate}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDispense(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-bold text-xs shadow transition flex items-center space-x-1 ml-auto"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Dispense 1 Unit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
};
