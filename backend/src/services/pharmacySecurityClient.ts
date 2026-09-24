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
      .post(`${this.baseUrl}/api/analytics/symptoms/log`, enriched, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 2500,
      })
      .catch((err) => {
        // Silently capture non-fatal audit forwarding notices
        // Local audit logs in memoryDb / PostgreSQL remain the primary audit source
      });
  }

  /**
   * Optional remote inventory sync
   */
  public async getRemoteMedicines(): Promise<any[] | null> {
    try {
      const res = await axios.get(`${this.baseUrl}/api/pharmacy/medicines`, { timeout: 3000 });
      return res.data?.medicines || null;
    } catch {
      return null;
    }
  }
}

export const pharmacySecurityClient = new PharmacySecurityClient();
