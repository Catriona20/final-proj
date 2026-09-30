import { Router, Request, Response } from 'express';
import { pharmacyService } from '../services/pharmacyService';
import { nlpService } from '../services/nlpService';
import { PharmacyModel, PrescriptionModel } from '../database/models';

const router = Router();

// GET /api/pharmacy/prescriptions & GET /api/pharmacy/pending-prescriptions
const handleGetPrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = (req.query.clinicId || req.query.clinic_id) as string | undefined;
    const prescriptions = await PrescriptionModel.getAll(clinicId);
    res.json({
      success: true,
      count: prescriptions.length,
      prescriptions,
      data: prescriptions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch prescriptions' });
  }
};
router.get('/prescriptions', handleGetPrescriptions);
router.get('/pending-prescriptions', handleGetPrescriptions);

// GET /api/pharmacy/inventory
router.get('/inventory', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const clinicId = (req.query.clinicId || req.query.clinic_id) as string | undefined;

    const inventory = await pharmacyService.getInventory({ search, category, clinicId });
    res.json({
      success: true,
      count: inventory.length,
      inventory,
      data: inventory,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch pharmacy inventory' });
  }
});

// GET & POST /api/pharmacy/check-stock (Doctor stock verification before prescription)
const handleCheckStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicine = (req.query.medicine as string) || req.body.medicine || req.body.medicineName || req.body.name;
    const quantity = Number(req.query.quantity || req.body.quantity || 1);

    const clinicId = (req.query.clinicId || req.query.clinic_id || req.body.clinicId || req.body.clinic_id) as string | undefined;

    if (!medicine) {
      res.status(400).json({ success: false, error: 'Medicine name is required.' });
      return;
    }

    const check = await pharmacyService.checkMedicineStock(medicine, quantity, clinicId);
    res.json({
      success: true,
      ...check,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to check stock' });
  }
};
router.get('/check-stock', handleCheckStock);
router.post('/check-stock', handleCheckStock);

// POST /api/pharmacy/inventory
router.post('/inventory', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clinicId,
      name,
      genericName,
      category,
      dosageForm,
      strength,
      batchNumber,
      expiryDate,
      quantity,
      minStockLevel,
      reorderQuantity,
      unitPrice,
    } = req.body;

    if (!name || !batchNumber || !expiryDate) {
      res.status(400).json({ success: false, error: 'Name, batchNumber, and expiryDate are required fields.' });
      return;
    }

    const item = await PharmacyModel.create({
      clinic_id: clinicId || 'c1',
      name,
      generic_name: genericName || name,
      category: category || 'General Medicine',
      dosage_form: dosageForm || 'Tablet',
      strength: strength || '500mg',
      batch_number: batchNumber,
      expiry_date: expiryDate,
      quantity: Number(quantity) || 0,
      min_stock_level: Number(minStockLevel) || 15,
      reorder_quantity: Number(reorderQuantity) || 50,
      unit_price: Number(unitPrice) || 10.0,
    });

    res.status(201).json({
      success: true,
      message: `Batch ${batchNumber} of ${name} added to pharmacy inventory.`,
      item,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to add pharmacy inventory item' });
  }
});

// POST /api/pharmacy/dispense
router.post('/dispense', async (req: Request, res: Response): Promise<void> => {
  try {
    let { quantity, prescriptionId, patientId, patientName, dispensedBy, stockId } = req.body;
    let targetMedicineName = req.body.medicineName || req.body.name || req.body.medicine;
    const clinicId = req.body.clinicId || req.body.clinic_id;

    if (!targetMedicineName && stockId) {
      const item = await PharmacyModel.getById(stockId);
      if (item) {
        targetMedicineName = item.name;
      }
    }

    if (prescriptionId && (!patientId || !patientName)) {
      const rx = await PrescriptionModel.getById(prescriptionId);
      if (rx) {
        patientId = patientId || rx.patient_id;
        patientName = patientName || (rx as any).patient_name || 'Patient';
      }
    }

    const dispenseQty = Number(quantity);
    if (!targetMedicineName || isNaN(dispenseQty) || dispenseQty <= 0) {
      res.status(400).json({ success: false, error: 'medicineName and a valid positive quantity are required.' });
      return;
    }

    const result = await pharmacyService.dispenseMedicine({
      medicineName: targetMedicineName,
      quantity: dispenseQty,
      prescriptionId,
      patientId,
      patientName,
      dispensedBy,
      clinicId,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Dispensation failed' });
  }
});

// POST /api/pharmacy/dispense-prescription (Dispense all medicines for a prescription)
router.post('/dispense-prescription', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prescriptionId, dispensedBy, clinicId } = req.body;
    if (!prescriptionId) {
      res.status(400).json({ success: false, error: 'prescriptionId is required.' });
      return;
    }

    const prescription = await PrescriptionModel.getById(prescriptionId);
    if (!prescription) {
      res.status(404).json({ success: false, error: 'Prescription not found.' });
      return;
    }

    const dispensationResults: any[] = [];
    const stockErrors: string[] = [];

    for (const med of prescription.medicines) {
      try {
        let qty = 5;
        const durMatch = (med.duration || '').match(/(\d+)/);
        if (durMatch) {
          qty = parseInt(durMatch[1], 10);
        }
        if (req.body.quantity) {
          qty = Number(req.body.quantity);
        }

        const result = await pharmacyService.dispenseMedicine({
          medicineName: med.name,
          quantity: qty,
          prescriptionId: prescription.id,
          patientId: prescription.patient_id,
          patientName: (prescription as any).patient_name,
          dispensedBy: dispensedBy || 'Pharmacy Staff',
          clinicId: clinicId || prescription.clinic_id,
        });
        dispensationResults.push(result);
      } catch (err: any) {
        stockErrors.push(`${med.name}: ${err.message}`);
      }
    }

    if (dispensationResults.length === 0 && stockErrors.length > 0) {
      res.status(400).json({ success: false, error: stockErrors.join('; '), stockErrors });
      return;
    }

    res.json({
      success: true,
      message: `Prescription ${prescription.id} dispensed successfully via FEFO protocol.`,
      dispensationResults,
      stockErrors: stockErrors.length > 0 ? stockErrors : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Dispensation failed' });
  }
});

// GET /api/pharmacy/low-stock
router.get('/low-stock', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = (req.query.clinicId || req.query.clinic_id) as string | undefined;
    const alerts = await pharmacyService.getLowStockAlerts(clinicId);
    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to retrieve low-stock alerts' });
  }
});

// GET /api/pharmacy/forecast
router.get('/forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    const medicine = req.query.medicine as string | undefined;
    const forecast = await pharmacyService.getDemandForecast(medicine);
    res.json({
      success: true,
      forecast,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate demand forecast' });
  }
});

// POST /api/pharmacy/forecast (Direct single-medicine demand forecast)
router.post('/forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    const { medicine_id, medicineId, history, horizon_days, horizonDays } = req.body;
    const targetMed = medicine_id || medicineId || 'All';
    const targetHorizon = horizon_days || horizonDays || 14;

    if (Array.isArray(history) && history.length >= 28) {
      const mlResult = await nlpService.getDemandForecast({
        medicineId: targetMed,
        history,
        horizonDays: targetHorizon,
      });
      if (mlResult) {
        res.json({ success: true, ...mlResult });
        return;
      }
    }

    const forecast = await pharmacyService.getDemandForecast(targetMed);
    res.json({ success: true, forecast });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to process demand forecast request' });
  }
});

// POST /api/pharmacy/inventory/analyze (Production Inventory Intelligence Analysis)
router.post('/inventory/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      medicine_id,
      medicineId,
      current_stock,
      currentStock,
      history,
      horizon_days,
      lead_time_days,
      safety_stock,
      reorder_point,
    } = req.body;

    const targetMed = medicine_id || medicineId || 'All';
    const onHand = current_stock !== undefined ? Number(current_stock) : Number(currentStock || 100);

    const mlResult = await nlpService.analyzeInventoryIntelligence({
      medicineId: targetMed,
      history: Array.isArray(history) ? history : [],
      currentStock: onHand,
      horizonDays: horizon_days || 14,
      leadTimeDays: lead_time_days || 7,
      safetyStock: safety_stock !== undefined ? Number(safety_stock) : 30,
      reorderPoint: reorder_point !== undefined ? Number(reorder_point) : 100,
    });

    if (mlResult) {
      res.json({ success: true, ...mlResult });
      return;
    }

    // Graceful fallback to aggregate forecast
    const forecast = await pharmacyService.getDemandForecast(targetMed);
    res.json({
      success: true,
      medicine_id: targetMed,
      forecast: {
        total_predicted_demand: (forecast.dailyAverageBurnRate || 2) * 14,
        average_daily_demand: forecast.dailyAverageBurnRate || 2,
        daily_forecast: [],
      },
      inventory: {
        current_stock: forecast.currentStock ?? onHand,
        days_of_coverage: forecast.coverageDays ?? 30,
        status: (forecast.currentStock ?? onHand) <= 30 ? 'LOW_STOCK' : 'OK',
      },
      recommendation: {
        reorder_required: (forecast.currentStock ?? onHand) <= 30,
        reason: forecast.reorderRecommendation || 'Standard inventory threshold calculation',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Inventory analysis failed' });
  }
});

// GET /api/pharmacy/dispensations
router.get('/dispensations', async (req: Request, res: Response): Promise<void> => {
  try {
    const medicineName = req.query.medicine as string | undefined;
    const patientId = req.query.patientId as string | undefined;
    const dispensations = await PharmacyModel.getDispensations({ medicineName, patientId });
    res.json({
      success: true,
      count: dispensations.length,
      dispensations,
      data: dispensations,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch dispensations' });
  }
});

export const pharmacyRouter = router;

