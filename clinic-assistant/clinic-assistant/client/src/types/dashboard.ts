export interface DashboardSummary {
  todayAppointments: {
    total: number;
    remaining: number;
  };
  checkedIn: {
    total: number;
    subtitle: string;
  };
  waiting: {
    total: number;
    subtitle: string;
  };
  availableDoctors: {
    available: number;
    total: number;
    subtitle: string;
  };
  walkIns: {
    total: number;
    subtitle: string;
  };
}
