import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  LogIn
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext.js';

interface DemoAssistantAccount {
  name: string;
  email: string;
  pass: string;
  otp: string;
  clinicId: string;
  clinicName: string;
  location: string;
  staffId: string;
  initials: string;
}

const DEMO_ASSISTANTS: DemoAssistantAccount[] = [
  { name: 'Sheryl Thomas', email: 'assistant01@demo.medlink.test', pass: 'Clinic@3001', otp: '300001', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental & Medical Clinic', location: 'Mylapore, Chennai', staffId: 'STAFF-MDC-01', initials: 'ST' },
  { name: 'Rahul Joseph', email: 'assistant02@demo.medlink.test', pass: 'Clinic@3002', otp: '300002', clinicId: 'c-demo-apollo-02', clinicName: 'Apollo Family Care Centre', location: 'Anna Nagar, Chennai', staffId: 'STAFF-AFC-02', initials: 'RJ' },
  { name: 'Nisha Kumar', email: 'assistant03@demo.medlink.test', pass: 'Clinic@3003', otp: '300003', clinicId: 'c-demo-greenlife-03', clinicName: "GreenLife Women's & Maternity Clinic", location: 'Kilpauk, Chennai', staffId: 'STAFF-GLW-03', initials: 'NK' },
  { name: 'Ravi Shankar', email: 'assistant04@demo.medlink.test', pass: 'Clinic@3004', otp: '300004', clinicId: 'c-demo-heart-04', clinicName: 'Chennai Heart & Vascular Centre', location: 'Nungambakkam, Chennai', staffId: 'STAFF-CHV-04', initials: 'RS' },
  { name: 'Deepak Raj', email: 'assistant05@demo.medlink.test', pass: 'Clinic@3005', otp: '300005', clinicId: 'c-demo-vision-05', clinicName: 'VisionPlus Eye Centre', location: 'T. Nagar, Chennai', staffId: 'STAFF-VPE-05', initials: 'DR' },
  { name: 'Lavanya S', email: 'assistant06@demo.medlink.test', pass: 'Clinic@3006', otp: '300006', clinicId: 'c-demo-ortho-06', clinicName: 'OrthoCare Chennai', location: 'Guindy, Chennai', staffId: 'STAFF-OCC-06', initials: 'LS' },
  { name: 'Joseph Mathew', email: 'assistant07@demo.medlink.test', pass: 'Clinic@3007', otp: '300007', clinicId: 'c-demo-skin-07', clinicName: 'SkinSphere Dermatology', location: 'Adyar, Chennai', staffId: 'STAFF-SSD-07', initials: 'JM' },
  { name: 'Priyanka Das', email: 'assistant08@demo.medlink.test', pass: 'Clinic@3008', otp: '300008', clinicId: 'c-demo-neuro-08', clinicName: 'NeuroBridge Care Clinic', location: 'Velachery, Chennai', staffId: 'STAFF-NBC-08', initials: 'PD' },
  { name: 'Karthik V', email: 'assistant09@demo.medlink.test', pass: 'Clinic@3009', otp: '300009', clinicId: 'c-demo-nova-09', clinicName: 'Nova ENT Care', location: 'Perambur, Chennai', staffId: 'STAFF-PMS-09', initials: 'KV' },
  { name: 'Divya Raj', email: 'assistant10@demo.medlink.test', pass: 'Clinic@3010', otp: '300010', clinicId: 'c-demo-smile-10', clinicName: 'Smile & Child Pediatric Centre', location: 'Porur, Chennai', staffId: 'STAFF-SCP-10', initials: 'DR' },
  { name: 'Suresh Nair', email: 'assistant11@demo.medlink.test', pass: 'Clinic@3011', otp: '300011', clinicId: 'c-demo-ramapuram-11', clinicName: 'Ramapuram Family Medical Centre', location: 'Ramapuram, Chennai', staffId: 'STAFF-RFM-11', initials: 'SN' },
  { name: 'Meenakshi R', email: 'assistant12@demo.medlink.test', pass: 'Clinic@3012', otp: '300012', clinicId: 'c-demo-omr-12', clinicName: 'OMR Health City Clinic', location: 'Thoraipakkam, Chennai', staffId: 'STAFF-OMR-12', initials: 'MR' },
  { name: 'Anand K', email: 'assistant13@demo.medlink.test', pass: 'Clinic@3013', otp: '300013', clinicId: 'c-demo-sholinganallur-13', clinicName: 'Sholinganallur Family Healthcare', location: 'Sholinganallur, Chennai', staffId: 'STAFF-SFH-13', initials: 'AK' },
  { name: 'Shalini G', email: 'assistant14@demo.medlink.test', pass: 'Clinic@3014', otp: '300014', clinicId: 'c-demo-tambaram-14', clinicName: 'Tambaram Prime Healthcare', location: 'Tambaram, Chennai', staffId: 'STAFF-TPH-14', initials: 'SG' },
  { name: 'Vignesh B', email: 'assistant15@demo.medlink.test', pass: 'Clinic@3015', otp: '300015', clinicId: 'c-demo-chromepet-15', clinicName: 'Chromepet Medical Pavilion', location: 'Chromepet, Chennai', staffId: 'STAFF-CMP-15', initials: 'VB' },
  { name: 'Reshma T', email: 'assistant16@demo.medlink.test', pass: 'Clinic@3016', otp: '300016', clinicId: 'c-demo-pallavaram-16', clinicName: 'Pallavaram Prime Health Clinic', location: 'Pallavaram, Chennai', staffId: 'STAFF-PPH-16', initials: 'RT' },
  { name: 'Arjun P', email: 'assistant17@demo.medlink.test', pass: 'Clinic@3017', otp: '300017', clinicId: 'c-demo-ambattur-17', clinicName: 'Ambattur Industrial Care Clinic', location: 'Ambattur, Chennai', staffId: 'STAFF-AIC-17', initials: 'AP' },
  { name: 'Pooja M', email: 'assistant18@demo.medlink.test', pass: 'Clinic@3018', otp: '300018', clinicId: 'c-demo-besant-18', clinicName: 'Besant Nagar Coastal Health Care', location: 'Besant Nagar, Chennai', staffId: 'STAFF-BNC-18', initials: 'PM' },
  { name: 'Manoj S', email: 'assistant19@demo.medlink.test', pass: 'Clinic@3019', otp: '300019', clinicId: 'c-demo-avadi-18', clinicName: 'Avadi Central Care Hospital', location: 'Avadi, Chennai', staffId: 'STAFF-ACC-19', initials: 'MS' },
  { name: 'Kavitha R', email: 'assistant20@demo.medlink.test', pass: 'Clinic@3020', otp: '300020', clinicId: 'c-demo-royapuram-20', clinicName: 'Royapuram Community Health Clinic', location: 'Royapuram, Chennai', staffId: 'STAFF-RCH-20', initials: 'KR' },
];

export const AssistantLoginScreen: React.FC = () => {
  const { loginAssistant, verifyAssistantOtp } = useClinic();

  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN');
  const [email, setEmail] = useState('assistant01@demo.medlink.test');
  const [password, setPassword] = useState('Clinic@3001');
  const [otpCode, setOtpCode] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<DemoAssistantAccount | null>(DEMO_ASSISTANTS[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoDrawer, setShowDemoDrawer] = useState(true);

  const handleSelectDemo = (item: DemoAssistantAccount) => {
    setSelectedDemo(item);
    setEmail(item.email);
    setPassword(item.pass);
    setOtpCode(item.otp);
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter assistant email and confidential password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAssistant(email.trim(), password);
      if (res.success) {
        setStep('OTP');
        // If it was a demo account, default OTP code
        const matched = DEMO_ASSISTANTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (matched) {
          setSelectedDemo(matched);
          setOtpCode(matched.otp);
        }
      } else {
        setErrorMessage(res.error || 'Invalid clinic assistant credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication service unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyAssistantOtp(email.trim(), otpCode.trim(), selectedDemo);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid OTP code. Please check your demo credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-3 shadow-lg shadow-teal-500/10">
          <Building2 className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          MedLink <span className="text-teal-400 font-semibold">Clinic Assistant</span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Front Desk Reception, Triage, and Live OPD Queue Console
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          {/* STEP HEADER */}
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {step === 'LOGIN' ? 'Receptionist Sign In' : 'Two-Factor Security Verification'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 'LOGIN'
                  ? 'Access your facility roster, patient appointments & triage queue'
                  : `Enter the 6-digit code dispatched for ${email}`}
              </p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {step === 'LOGIN' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </span>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {step === 'LOGIN' ? (
            /* STEP 1: PASSWORD LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assistant Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. assistant01@demo.medlink.test"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter confidential password"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Proceed to OTP Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION FORM */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{selectedDemo?.name || email}</div>
                  <div className="text-[11px] text-teal-700 font-semibold">
                    {selectedDemo?.clinicName || 'Assigned Clinic'} • {selectedDemo?.location || 'Chennai'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('LOGIN')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                >
                  Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    6-Digit Security OTP Code *
                  </label>
                  {selectedDemo && (
                    <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Static Demo OTP: {selectedDemo.otp}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="• • • • • •"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-3 text-base font-mono tracking-widest text-slate-900 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Enter Clinic Workspace</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('LOGIN')}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Back to Password Login
              </button>
            </form>
          )}

          {/* DEMO ACCOUNTS QUICK-FILL ACCORDION */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>⚡ Demo Assistant Accounts (20 Facilities)</span>
              </div>
              {showDemoDrawer ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showDemoDrawer && (
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {DEMO_ASSISTANTS.map((ast) => {
                  const isSelected = email.toLowerCase() === ast.email.toLowerCase();
                  return (
                    <div
                      key={ast.email}
                      onClick={() => handleSelectDemo(ast)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-left ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-300 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{ast.name}</span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                            {ast.staffId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">{ast.clinicName} • {ast.location}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{ast.email}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-teal-700 bg-white rounded-lg border border-teal-200 shadow-2xs">
                          Auto-Fill
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
