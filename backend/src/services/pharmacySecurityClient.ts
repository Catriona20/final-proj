import axios from 'axios';
import { config } from '../config/env';

export interface SecurityAuditPayload {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
}

export class PharmacySecurityClient {
  private get baseUrl(): string {
    return (config.pharmacySecurityServiceUrl || 'http://localhost:4000').replace(/\/+$/, '');
  }

  /**
   * Check liveness probe of Pharmacy & Security microservice
   */
  public async checkHealth(): Promise<{ online: boolean; status: string; service: string }> {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
      return {
        online: res.status === 200,
        status: res.data?.status || 'healthy',
        service: res.data?.service || 'pharmacy-security-service',
      };
    } catch (err: any) {
      return {
        online: false,
        status: 'offline',
        service: 'pharmacy-security-service',
      };
    }
  }

  /**
   * Forward high-value clinical and administrative audit logs to the security service.
   * Runs non-blockingly so failures never impede normal MedLink operations.
   */
  public forwardAuditLog(payload: SecurityAuditPayload): void {
    const enriched = {
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId || 'system',
      details: payload.details || {},
      userId: payload.userId || 'system-admin',
      ipAddress: payload.ipAddress || '127.0.0.1',
      timestamp: new Date().toISOString(),
    };

    axios
      .post(`${this.baseUrl}/api/auth/audit-logs/internal`, enriched, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token-admin-a0000000-0000-0000-0000-000000000001',
        },
        timeout: 2500,
      })
      .catch(() => {
        // Silently capture non-fatal audit forwarding notices
      });
  }

  /**
   * Record remote dispensation in pharmacy security microservice with RBAC doctor token
   */
  public async recordRemoteDispensation(payload: {
    inventoryId?: string;
    medicineName?: string;
    batchNumber?: string;
    quantity?: number;
    quantityDispensed?: number;
    prescriptionId?: string;
    dispensedBy?: string;
    notes?: string;
  }): Promise<any> {
    try {
      const invId =
        payload.inventoryId ||
        (payload.medicineName && payload.medicineName.toLowerCase().includes('amox') ? 'inv-2a' : 'inv-1a');
      const qty = payload.quantity ?? payload.quantityDispensed ?? 1;

      const res = await axios.post(
        `${this.baseUrl}/api/pharmacy/dispense`,
        {
          inventoryId: invId,
          quantity: qty,
          prescriptionId: payload.prescriptionId,
          notes: payload.notes || `Dispensed via MedLink FEFO Workflow (${payload.batchNumber || 'batch'}) by ${payload.dispensedBy || 'Staff'}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-token-doctor-a0000000-0000-0000-0000-000000000002',
          },
          timeout: 3000,
        }
      );
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve catalog medicines from Pharmacy Security microservice
   */
  public async getRemoteMedicines(): Promise<any[] | null> {
    try {
      const res = await axios.get(`${this.baseUrl}/api/pharmacy/medicines`, {
        headers: {
          'Authorization': 'Bearer dev-token-doctor-a0000000-0000-0000-0000-000000000002',
        },
        timeout: 3000,
      });
      return res.data?.medicines || null;
    } catch {
      return null;
    }
  }
}

export const pharmacySecurityClient = new PharmacySecurityClient();
