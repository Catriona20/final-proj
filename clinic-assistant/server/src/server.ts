import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 Clinic Assistant Backend API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Dashboard Summary: http://localhost:${PORT}/api/dashboard`);
  console.log(`   Appointments: http://localhost:${PORT}/api/appointments/today`);
  console.log(`   Waiting Queue: http://localhost:${PORT}/api/queue`);
  console.log(`   Doctors: http://localhost:${PORT}/api/doctors`);
  console.log(`   Walk-Ins: http://localhost:${PORT}/api/walk-ins`);
  console.log(`=======================================================`);
});
