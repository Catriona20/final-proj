export interface PharmacyItem {
  id: string;
  clinic_id?: string;
  name: string;
  generic_name?: string;
  category: string;
  dosage_form: string;
  strength: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  min_stock_level: number;
  reorder_quantity: number;
  unit_price: number;
  status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  isLowStock?: boolean;
  isExpired?: boolean;
}

export interface PharmacyDispensation {
  id: string;
  inventory_id?: string;
  medicine_name: string;
  prescription_id?: string;
  patient_id?: string;
  patient_name?: string;
  quantity_dispensed: number;
  batch_number: string;
  dispensed_at: string;
  dispensed_by: string;
}

export interface LowStockAlert {
  item: PharmacyItem;
  currentStock: number;
  minStockLevel: number;
  suggestedReorder: number;
  severity: 'CRITICAL' | 'WARNING';
}

export interface DemandForecast {
  medicineName: string;
  status: 'forecast_available' | 'insufficient_data';
  message: string;
  historicalDispensationsCount: number;
  dailyAverageBurnRate?: number;
  projected30DayDemand?: number;
  recommendedSafetyStock?: number;
  confidenceScore?: number;
}
