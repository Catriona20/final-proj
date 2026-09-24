import { Router, Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { nlpService } from '../services/nlpService';
import { PrescriptionModel, MedicalFileModel, AppointmentModel } from '../database/models';

export const aiRouter = Router();

// POST /api/ai/symptom-analysis
// Free-text symptom input -> TF-IDF -> Department Classification -> Recommendation
aiRouter.post('/symptom-analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query = '', symptoms, durationDays } = req.body;
    const targetQuery = (query || symptoms || '').toString().trim();
    if (!targetQuery) {
      res.status(400).json({ success: false, error: 'Symptoms query string is required.' });
      return;
    }

    const result = await nlpService.analyzeSymptoms(targetQuery, durationDays);
    res.status(200).json({ success: true, analysis: result });
  } catch (err: any) {
    console.error('AI Symptom analysis error:', err);
    res.status(500).json({ success: false, error: 'Failed to process AI symptom analysis.' });
  }
});

// POST /api/ai/explain-prescription
aiRouter.post('/explain-prescription', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prescriptionId, prescriptionData } = req.body;

    let targetPrescription = prescriptionData;
    if (!targetPrescription && prescriptionId) {
      targetPrescription = await PrescriptionModel.getById(prescriptionId);
    }

    if (!targetPrescription) {
      res.status(404).json({ success: false, error: 'Prescription details not found for AI explanation.' });
      return;
    }

    const explanation = await aiService.explainPrescription(targetPrescription);
    res.status(200).json({ success: true, explanation });
  } catch (err: any) {
    console.error('AI Prescription explanation error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate AI prescription explanation.' });
  }
});

// POST /api/ai/summarize-report
aiRouter.post('/summarize-report', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId, fileData } = req.body;

    let targetFile = fileData;
    if (!targetFile && fileId) {
      const files = await MedicalFileModel.getByPatientId(req.body.patientId || '');
      targetFile = files.find((f) => f.id === fileId);
    }

    if (!targetFile) {
      targetFile = { test_name: req.body.testName || 'Medical Report', category: 'General' };
    }

    const summary = await aiService.summarizeMedicalReport(targetFile);
    res.status(200).json({ success: true, summary });
  } catch (err: any) {
    console.error('AI Medical Report summarization error:', err);
    res.status(500).json({ success: false, error: 'Failed to summarize medical report.' });
  }
});

// POST /api/ai/summarize-consultation
aiRouter.post('/summarize-consultation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationData } = req.body;
    if (!consultationData) {
      res.status(400).json({ success: false, error: 'Consultation data payload is required.' });
      return;
    }

    const summary = await aiService.summarizeConsultationNotes(consultationData);
    res.status(200).json({ success: true, summary });
  } catch (err: any) {
    console.error('AI Consultation summarization error:', err);
    res.status(500).json({ success: false, error: 'Failed to summarize consultation notes.' });
  }
});

// POST /api/ai/patient-summary
aiRouter.post('/patient-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      res.status(400).json({ success: false, error: 'Patient ID is required.' });
      return;
    }

    const appointments = await AppointmentModel.getByPatientId(patientId);
    const prescriptions = await PrescriptionModel.getByPatientId(patientId);
    const files = await MedicalFileModel.getByPatientId(patientId);

    const summary = await aiService.summarizePatientHistory({ appointments, prescriptions, files });
    res.status(200).json({ success: true, summary });
  } catch (err: any) {
    console.error('AI Patient summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to summarize patient history.' });
  }
});
