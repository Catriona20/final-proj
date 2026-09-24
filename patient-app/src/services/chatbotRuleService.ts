import {
  ChatbotIntent,
  ChatMessage,
  ActiveLocation,
  Appointment,
  Clinic,
  Doctor,
  HealthRecord,
} from '../types';
import { announcementService } from './announcementService';

export interface ChatbotContext {
  activeLocation?: ActiveLocation;
  upcomingAppointment?: Appointment | null;
  clinics?: Clinic[];
  doctors?: Doctor[];
  healthRecords?: HealthRecord[];
}

export interface DepartmentRecommendationRule {
  intent: ChatbotIntent;
  department: string;
  specialtyName: string;
  keywords: string[];
  whyExplanation: string;
  urgencyLevel: 'Emergency' | 'Specialist Consultation' | 'Primary Care Consultation' | 'Routine / Non-Urgent';
  actionButtonLabel: string;
  quickFollowUps: string[];
}

// Structured Specialty & Symptom Taxonomy Rules
export const DEPARTMENT_RULES: DepartmentRecommendationRule[] = [
  {
    intent: 'OPHTHALMOLOGY',
    department: 'Ophthalmology',
    specialtyName: 'Eye Specialist / Ophthalmologist',
    keywords: [
      'blurry vision',
      'blurred vision',
      'eye pain',
      'vision problem',
      'red eye',
      'cataract',
      'glaucoma',
      'eyesight',
      'eye specialist',
      'eye doctor',
      'ophthalmologist',
      'ophthalmology',
      'lasik',
      'floaters',
      'burning eyes',
      'cornea',
      'eye clinic',
      'spectacle',
      'vision',
      'watery eyes',
      'dry eyes',
    ],
    whyExplanation:
      'An Ophthalmology consultation is recommended for assessing visual acuity, corneal integrity, intraocular pressure, and retinal health under specialized diagnostic instruments.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Eye Specialists Near Me',
    quickFollowUps: ['Eye clinics near me', 'Check clinic hours', 'How to book appointment'],
  },
  {
    intent: 'CARDIOLOGY',
    department: 'Cardiology',
    specialtyName: 'Cardiologist / Heart Specialist',
    keywords: [
      'heart',
      'palpitations',
      'irregular heartbeat',
      'high blood pressure',
      'hypertension',
      'cardiologist',
      'cardiology',
      'heart doctor',
      'ecg',
      'cholesterol',
      'cardiac checkup',
      'racing heart',
      'pulse rate',
      'cardiac',
      'angina',
      'bp check',
    ],
    whyExplanation:
      'A Cardiology specialist evaluates cardiac rhythm, arterial blood pressure, circulatory efficiency, and cardiovascular risk factors with resting ECG and clinical diagnostics.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Cardiologists Near Me',
    quickFollowUps: ['Cardiology clinics near me', 'Clinic operating hours', 'Book consultation'],
  },
  {
    intent: 'DERMATOLOGY',
    department: 'Dermatology',
    specialtyName: 'Dermatologist / Skin Specialist',
    keywords: [
      'skin rash',
      'rash',
      'acne',
      'eczema',
      'psoriasis',
      'itching',
      'itchy skin',
      'skin allergy',
      'pimples',
      'hives',
      'hair loss',
      'dandruff',
      'fungal infection',
      'dermatologist',
      'dermatology',
      'skin doctor',
      'dry skin',
      'skin lesion',
      'blisters',
      'scalp',
    ],
    whyExplanation:
      'A Dermatologist specializes in dermatological diagnostics, allergy patch assessment, and targeted therapeutic management for epidermal and scalp barrier conditions.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Dermatologists Near Me',
    quickFollowUps: ['Skin clinics near me', 'Check doctor availability', 'Book skin appointment'],
  },
  {
    intent: 'DENTISTRY',
    department: 'Dentistry',
    specialtyName: 'Dentist / Dental Specialist',
    keywords: [
      'tooth pain',
      'toothache',
      'dentist',
      'dentistry',
      'cavity',
      'bleeding gums',
      'root canal',
      'teeth sensitivity',
      'dental cleaning',
      'braces',
      'wisdom tooth',
      'broken tooth',
      'gum swelling',
      'oral pain',
      'dental checkup',
      'teeth',
    ],
    whyExplanation:
      'A Dental surgeon provides clinical intra-oral examination, digital dental radiographs, cavity restoration, periodontal therapy, and precise oral pain relief.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Dental Clinics Near Me',
    quickFollowUps: ['Dentists near me', 'Clinic hours', 'Book dental visit'],
  },
  {
    intent: 'ENT',
    department: 'ENT',
    specialtyName: 'ENT Specialist (Ear, Nose & Throat)',
    keywords: [
      'ear pain',
      'earache',
      'ear discharge',
      'hearing loss',
      'blocked ear',
      'tinnitus',
      'sore throat',
      'throat irritation',
      'tonsil',
      'tonsillitis',
      'nasal congestion',
      'sinusitis',
      'sinus',
      'ent specialist',
      'ent doctor',
      'ear nose throat',
      'voice loss',
      'throat pain',
      'nasal blockage',
    ],
    whyExplanation:
      'An ENT physician specializes in endo-nasal diagnostics, tympanic membrane otoscopy, pharyngeal inspection, and management of upper airway and auditory disorders.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find ENT Clinics Near Me',
    quickFollowUps: ['ENT clinics near me', 'Check timings', 'Book OPD slot'],
  },
  {
    intent: 'PEDIATRICS',
    department: 'Pediatrics',
    specialtyName: 'Pediatrician / Child Specialist',
    keywords: [
      'baby fever',
      'child doctor',
      'pediatrician',
      'pediatrics',
      'infant vaccine',
      'child cough',
      'pediatric checkup',
      'toddler illness',
      'newborn care',
      'kids doctor',
      'child health',
      'infant fever',
      'baby colic',
    ],
    whyExplanation:
      'A Pediatrician assesses pediatric developmental parameters, immunization scheduling, age-adjusted pharmacology, and pediatric infection management.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Pediatricians Near Me',
    quickFollowUps: ['Child specialists near me', 'Vaccine checkup', 'Book pediatric visit'],
  },
  {
    intent: 'ORTHOPEDICS',
    department: 'Orthopedics',
    specialtyName: 'Orthopedic / Bone & Joint Specialist',
    keywords: [
      'joint pain',
      'knee pain',
      'bone fracture',
      'back pain',
      'spine ache',
      'sprain',
      'swollen ankle',
      'arthritis',
      'bone doctor',
      'orthopedic specialist',
      'orthopedics',
      'tendon',
      'ligament',
      'shoulder pain',
      'neck pain',
      'hip pain',
    ],
    whyExplanation:
      'An Orthopedic specialist provides musculoskeletal evaluations, joint mobility tests, radiographic review, and rehabilitation planning for joint and spinal conditions.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Orthopedic Clinics Near Me',
    quickFollowUps: ['Orthopedic doctors near me', 'Check clinic hours', 'Book appointment'],
  },
  {
    intent: 'GYNECOLOGY',
    department: 'Gynecology',
    specialtyName: 'Gynecologist / Obstetrician',
    keywords: [
      'pregnancy',
      'period pain',
      'gynecologist',
      'gynecology',
      'menstrual irregularity',
      'pcos',
      'cramps',
      'maternity',
      'obstetric',
      'women health',
      'pelvic pain',
      'prenatal checkup',
      'missed period',
    ],
    whyExplanation:
      'A Gynecologist / Obstetrician provides comprehensive reproductive healthcare, hormonal assessments, maternal counseling, and pelvic health monitoring.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Gynecologists Near Me',
    quickFollowUps: ['Maternity clinics near me', 'Clinic hours', 'Book consultation'],
  },
  {
    intent: 'NEUROLOGY',
    department: 'Neurology',
    specialtyName: 'Neurologist / Brain & Nerve Specialist',
    keywords: [
      'frequent migraine',
      'severe headache',
      'numbness',
      'tingling nerves',
      'tremors',
      'neurologist',
      'neurology',
      'dizziness',
      'vertigo',
      'unsteadiness',
      'nerve pain',
      'sciatica',
    ],
    whyExplanation:
      'A Neurologist conducts cranial nerve reflex evaluations, neuro-vascular assessments, peripheral neuropathy checks, and targeted migraine therapy.',
    urgencyLevel: 'Specialist Consultation',
    actionButtonLabel: 'Find Neurologists Near Me',
    quickFollowUps: ['Neurology centers near me', 'Book consultation', 'Clinic hours'],
  },
  {
    intent: 'GENERAL_MEDICINE',
    department: 'General Medicine',
    specialtyName: 'General Physician / Primary Care',
    keywords: [
      'mild fever',
      'common cold',
      'cough',
      'flu',
      'general checkup',
      'family doctor',
      'body ache',
      'fatigue',
      'weakness',
      'indigestion',
      'stomach upset',
      'primary care',
      'general physician',
      'general medicine',
      'fever',
      'headache',
      'vomiting',
      'diarrhea',
      'doctor checkup',
    ],
    whyExplanation:
      'A General Physician offers comprehensive primary care, initial diagnostic assessment, prescription management, and coordination with sub-specialists when necessary.',
    urgencyLevel: 'Primary Care Consultation',
    actionButtonLabel: 'Find General Physicians Near Me',
    quickFollowUps: ['Primary clinics near me', 'Check wait times', 'Book OPD slot'],
  },
];

export const chatbotRuleService = {
  /**
   * Classifies user query into structured intent categories.
   * Safety rules are executed first to intercept emergency scenarios immediately.
   */
  classifyIntent(rawInput: string): ChatbotIntent {
    const text = (rawInput || '').trim().toLowerCase();

    // 1. SAFETY-FIRST: Critical Emergency Situations
    const emergencyKeywords = [
      'chest pain',
      'heart attack',
      'stroke',
      'shortness of breath',
      'cannot breathe',
      'severe bleeding',
      'unconscious',
      'unresponsive',
      'emergency',
      'choking',
      'poison',
      'seizure',
      'severe allergic reaction',
      'anaphylaxis',
      'sudden loss of vision',
      'facial drooping',
      'slurred speech',
      'severe trauma',
      'head trauma',
      'suicidal',
      'self harm',
      '108',
      '112',
      'ambulance',
    ];
    if (emergencyKeywords.some((k) => text.includes(k))) {
      return 'EMERGENCY_REDIRECT';
    }

    // 2. Announcements & Live Notices
    if (
      text.includes('announcement') ||
      text.includes('update') ||
      text.includes('notice') ||
      text.includes('news') ||
      text.includes('holiday') ||
      text.includes('apollo open') ||
      text.includes('clinic change') ||
      text.includes('timing change')
    ) {
      return 'ANNOUNCEMENT_QUERY';
    }

    // 3. Health Records & Digital Prescriptions
    if (
      text.includes('prescription') ||
      text.includes('rx') ||
      text.includes('record') ||
      text.includes('report') ||
      text.includes('lab result') ||
      text.includes('previous visit') ||
      text.includes('past visit') ||
      text.includes('past consultation') ||
      text.includes('medical document') ||
      text.includes('last visited')
    ) {
      return 'HEALTH_RECORDS';
    }

    // 4. Appointment Status & Live Queue
    if (
      (text.includes('appointment') || text.includes('booking') || text.includes('doctor visit') || text.includes('token') || text.includes('queue')) &&
      (text.includes('when') ||
        text.includes('where') ||
        text.includes('who') ||
        text.includes('tomorrow') ||
        text.includes('status') ||
        text.includes('is my') ||
        text.includes('my appointment') ||
        text.includes('upcoming') ||
        text.includes('time') ||
        text.includes('how long') ||
        text.includes('patients ahead'))
    ) {
      return 'APPOINTMENT_STATUS';
    }

    // 5. Reschedule / Earlier Slot
    if (
      text.includes('reschedule') ||
      text.includes('postpone') ||
      text.includes('change date') ||
      text.includes('change time') ||
      text.includes('earlier slot') ||
      text.includes('move up')
    ) {
      return 'RESCHEDULE_APPOINTMENT';
    }

    // 6. Cancel Appointment
    if (text.includes('cancel') || text.includes('drop appointment')) {
      return 'CANCEL_APPOINTMENT';
    }

    // 7. How to Book / Schedule
    if (
      text.includes('how to book') ||
      text.includes('how do i book') ||
      text.includes('schedule visit') ||
      text.includes('booking process') ||
      text.includes('steps to book') ||
      text.includes('make an appointment')
    ) {
      return 'BOOK_APPOINTMENT';
    }

    // 8. Clinic Recommendation ("Which clinic should I go to?")
    if (
      text.includes('which clinic') ||
      text.includes('recommend a clinic') ||
      text.includes('best clinic') ||
      text.includes('where should i visit') ||
      text.includes('top clinic') ||
      text.includes('suggest clinic')
    ) {
      return 'CLINIC_RECOMMENDATION';
    }

    // 9. Department & Specialty Symptom Matching
    for (const rule of DEPARTMENT_RULES) {
      const isMatch = rule.keywords.some((k) => text.includes(k)) ||
        text.includes(rule.department.toLowerCase()) ||
        text.includes(rule.specialtyName.toLowerCase());
      if (isMatch) {
        return rule.intent;
      }
    }

    // 10. Clinic Hours
    if (
      text.includes('hours') ||
      text.includes('timing') ||
      text.includes('open') ||
      text.includes('close') ||
      text.includes('working hours') ||
      text.includes('opd timing')
    ) {
      return 'CLINIC_HOURS';
    }

    // 11. Location Navigation
    if (
      text.includes('location') ||
      text.includes('change address') ||
      text.includes('where am i') ||
      text.includes('gps') ||
      text.includes('set location') ||
      text.includes('nearby')
    ) {
      return 'LOCATION_HELP';
    }

    // 12. General Doctor List
    if (
      text.includes('find doctor') ||
      text.includes('available doctor') ||
      text.includes('dr.') ||
      text.includes('dr ') ||
      text.includes('physician list') ||
      text.includes('specialist list')
    ) {
      return 'FIND_DOCTOR';
    }

    // 13. General App Guidance
    if (
      text.includes('help') ||
      text.includes('what can you do') ||
      text.includes('hello') ||
      text.includes('hi') ||
      text.includes('hey')
    ) {
      return 'APP_HELP';
    }

    return 'UNKNOWN';
  },

  /**
   * Generates a context-aware response using the structured rule taxonomy.
   */
  processMessage(rawInput: string, context: ChatbotContext): ChatMessage {
    const intent = this.classifyIntent(rawInput);
    const locality = context.activeLocation?.locality || context.activeLocation?.name || 'Chennai';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Critical Emergency Handler
    if (intent === 'EMERGENCY_REDIRECT' || intent === 'EMERGENCY') {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `🚨 **EMERGENCY MEDICAL ADVISORY**\n\nIf you or someone nearby is experiencing acute symptoms such as severe chest pain, breathing difficulty, signs of stroke, severe bleeding, or loss of consciousness, **please do not wait for an outpatient appointment**.\n\n📞 **Emergency Ambulance Helpline**: Dial **108** or **112** immediately.\n\n⚠️ *MedLink Assistant provides non-diagnostic navigation guidance and does not replace emergency medical physicians.*`,
        timestamp,
        intent: 'EMERGENCY_REDIRECT',
        quickReplies: ['Call 108 Emergency', 'Open Emergency Map', 'Check nearest clinic'],
        actionLink: {
          type: 'emergency',
          label: 'Open Emergency Facilities Map',
        },
      };
    }

    // 2. Department & Specialty Symptom Match Handlers
    const matchedDeptRule = DEPARTMENT_RULES.find((r) => r.intent === intent);
    if (matchedDeptRule) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `🩺 **Medical Guidance: ${matchedDeptRule.department}**\n\nBased on your reported inquiry, consulting an **${matchedDeptRule.specialtyName}** is recommended.\n\n• **Clinical Rationale**: ${matchedDeptRule.whyExplanation}\n• **Recommended Action**: ${matchedDeptRule.urgencyLevel}\n• **Active Location**: ${locality}\n\n⚠️ *Notice: This is a navigation recommendation based on reported symptoms, not a clinical diagnosis. Consult a qualified doctor for medical evaluation.*`,
        timestamp,
        intent,
        quickReplies: matchedDeptRule.quickFollowUps,
        actionLink: {
          type: 'search',
          department: matchedDeptRule.department,
          label: matchedDeptRule.actionButtonLabel,
        },
      };
    }

    // 3. Clinic Recommendation Intent ("Which clinic should I go to?")
    if (intent === 'CLINIC_RECOMMENDATION') {
      const topClinic = context.clinics && context.clinics.length > 0 ? context.clinics[0] : null;
      if (topClinic) {
        const scorePct = Math.round((topClinic.recommendationScore ?? 0.88) * 100);
        const isOpenStatus = topClinic.isOpen ?? topClinic.is_open ?? true;
        const reviewsCount = topClinic.reviewsCount ?? topClinic.reviews_count ?? 120;
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `🏥 **Top Recommended Clinic near ${locality}:**\n\n**${topClinic.name}**\n• **Match Score**: ${scorePct}% (Weighted by Distance, ETA, Availability & Rating)\n• **Distance & Travel Time**: ${topClinic.distance || '1.2 km'} · ~${topClinic.travelTime || '8 min drive'}\n• **Operating Status**: ${isOpenStatus ? '✅ Open Now' : 'Closed'}\n• **Rating**: ⭐ ${topClinic.rating} (${reviewsCount} reviews)\n• **Why Recommended**: ${topClinic.recommendationReason || 'Fastest arrival · Low waiting time · Verified specialists'}\n\nWould you like to view clinic details or schedule a visit?`,
          timestamp,
          intent,
          quickReplies: ['View Clinic Profile', 'Schedule Appointment', 'See other clinics on Map'],
          actionLink: {
            type: 'clinic',
            targetId: topClinic.id,
            label: `View ${topClinic.name}`,
          },
        };
      }
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `📍 Based on your active location (**${locality}**), multiple partner clinics and hospitals are available. You can view clinics sorted by fastest ETA or nearest road distance.`,
        timestamp,
        intent,
        quickReplies: ['Explore Nearby Clinics', 'Eye Care Clinics', 'Cardiology Centers'],
        actionLink: {
          type: 'search',
          label: 'Explore Clinics Near You',
        },
      };
    }

    // 4. Live Announcements
    if (intent === 'ANNOUNCEMENT_QUERY' || intent === 'ANNOUNCEMENT') {
      const announcements = announcementService.getAnnouncements();
      const announcementsList =
        announcements.length > 0
          ? announcements
              .map((a) => `• **${a.title}** (${a.category}): ${a.summary}`)
              .join('\n\n')
          : '• All partner clinics in Chennai are operating on standard OPD schedules with 24/7 emergency walk-in coverage.';

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `📢 **Active Healthcare & Clinic Announcements:**\n\n${announcementsList}\n\nAll notices are synchronized live from clinic administrative portals.`,
        timestamp,
        intent: 'ANNOUNCEMENT_QUERY',
        quickReplies: ['Book appointment', 'Check clinic hours', 'Upcoming appointment'],
      };
    }

    // 5. Health Records & Digital Prescriptions
    if (intent === 'HEALTH_RECORDS' || intent === 'PRESCRIPTION_HELP') {
      const records = context.healthRecords || [];
      const prescriptions = records.filter((r) => r.type === 'prescription');
      const latestRx = prescriptions[0];

      if (latestRx) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `📄 **Health Records & Prescriptions:**\n\nYou have **${records.length} digital health documents** stored securely in your account.\n\n• **Latest Prescription**: ${latestRx.title} from ${latestRx.doctor} (${latestRx.clinic}, ${latestRx.date})\n\nTap below to view, verify, and download your digital prescriptions and verified lab reports.`,
          timestamp,
          intent,
          quickReplies: ['Open Health Records', 'View Prescriptions', 'Upload New Report'],
          actionLink: {
            type: 'records',
            label: 'View Health Records & Prescriptions',
          },
        };
      }

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `📄 You have **${records.length} verified records** in your Health Records repository. You can access past consultations, laboratory test results, and digital prescriptions anytime.`,
        timestamp,
        intent,
        quickReplies: ['Open Health Records', 'Upload New Report', 'Book a Consultation'],
        actionLink: {
          type: 'records',
          label: 'Open Health Records',
        },
      };
    }

    // 6. Appointment Status
    if (intent === 'APPOINTMENT_STATUS' || intent === 'APPOINTMENT_HELP') {
      const appt = context.upcomingAppointment;
      if (appt) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `📅 **Upcoming Appointment Details:**\n\n• **Doctor:** ${appt.doctorName} (${appt.doctorSpecialization})\n• **Clinic:** ${appt.clinicName}\n• **Address:** ${appt.clinicAddress}\n• **Date & Time:** ${appt.date} at ${appt.time}\n• **Digital Token:** ${appt.tokenNumber || '#01'}\n• **Live Queue Position:** ${appt.queuePosition || 1} (${appt.patientsAhead ?? 0} patients ahead)\n• **Estimated Wait:** ~${appt.estimatedWait || '5 min'}\n• **Status:** ${appt.status}\n\nWould you like driving directions or appointment details?`,
          timestamp,
          intent,
          quickReplies: ['View Appointment Card', 'Get Driving Directions', 'Reschedule Slot'],
          actionLink: {
            type: 'appointment',
            targetId: appt.id,
            label: 'Open Appointment Card',
          },
        };
      }
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `You do not have any active appointments scheduled right now. Would you like to explore doctors around **${locality}** and book a consultation?`,
        timestamp,
        intent,
        quickReplies: ['Book an appointment', 'Find nearest clinic', 'View past visits'],
        actionLink: {
          type: 'booking',
          label: 'Book Consultation',
        },
      };
    }

    // 7. Booking Guidance
    if (intent === 'BOOK_APPOINTMENT' || intent === 'BOOKING_HELP') {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `📋 **Step-by-step Booking Process:**\n\n1. **Select Department**: Choose the specialty you need (e.g. Ophthalmology, Cardiology, Dermatology).\n2. **Discover Clinics**: Compare road distance, traffic ETA, and doctor availability in ${locality}.\n3. **Select Verified Doctor**: Pick your preferred practitioner or continue with a previous doctor.\n4. **Choose Slot & Confirm**: Add consultation reasons/symptoms to obtain your instant digital queue token.\n\nTap below to start booking!`,
        timestamp,
        intent,
        quickReplies: ['Select Department', 'Check Available Doctors', 'Upcoming Appointment'],
        actionLink: {
          type: 'booking',
          label: 'Start Booking Flow',
        },
      };
    }

    // 8. Reschedule
    if (intent === 'RESCHEDULE_APPOINTMENT') {
      const appt = context.upcomingAppointment;
      if (appt) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `You can reschedule your appointment with **${appt.doctorName}** to any available date and time slot directly from the appointment details screen.`,
          timestamp,
          intent,
          quickReplies: ['Open Appointment Details', 'Check Doctor Availability'],
          actionLink: {
            type: 'appointment',
            targetId: appt.id,
            label: 'Reschedule Appointment',
          },
        };
      }
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `To reschedule a consultation, open the **Appointments Tab**, select your scheduled booking, and tap **Reschedule**. You will be able to select a new date and time slot instantly.`,
        timestamp,
        intent,
        quickReplies: ['View Appointments', 'Book New Consultation'],
      };
    }

    // 9. Cancel
    if (intent === 'CANCEL_APPOINTMENT') {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `To cancel an appointment, open the **Appointments Tab**, select your scheduled booking, and tap **"Cancel Appointment"**. Free cancellation is supported up to 1 hour before the scheduled time slot.`,
        timestamp,
        intent,
        quickReplies: ['Open Appointments Tab', 'Reschedule instead', 'Book new visit'],
      };
    }

    // 10. Clinic Hours
    if (intent === 'CLINIC_HOURS') {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `🕒 **Clinic Operating Timings in ${locality}:**\n\n• **MetroCare Primary Health**: 08:00 AM – 09:00 PM\n• **Apex Cardiology Center**: 09:00 AM – 06:00 PM\n• **ClearVision Eye Institute**: 09:00 AM – 05:00 PM\n• **Dermal Radiance**: 10:00 AM – 07:00 PM\n\n*Emergency walk-in services are accessible 24/7 across affiliated hospital branches.*`,
        timestamp,
        intent,
        quickReplies: ['Latest Announcements', 'Book Consultation', 'Find Clinics'],
      };
    }

    // 11. Location Assistance
    if (intent === 'LOCATION_HELP') {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `📍 Your current active search location is **${locality}**.\n\nYou can switch locations anytime by tapping the **Location Pin in the Home header** or from your **Profile Screen**. All discovery distances, road ETAs, and recommendations update automatically!`,
        timestamp,
        intent,
        quickReplies: ['Mylapore, Chennai', 'T. Nagar, Chennai', 'Adyar, Chennai', 'Use Current GPS'],
      };
    }

    // 12. Doctor Directory
    if (intent === 'FIND_DOCTOR') {
      const count = context.doctors?.length || 8;
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `👨‍⚕️ We have **${count} verified healthcare specialists** registered across partner clinics in ${locality}.\n\nAll verified practitioners display their registration council licenses, experience, consultation duration, and live slot availability.`,
        timestamp,
        intent,
        quickReplies: ['General Physician', 'Cardiologist', 'Eye Specialist', 'Book Appointment'],
        actionLink: {
          type: 'search',
          label: 'Browse Verified Doctors',
        },
      };
    }

    // 13. General Clinic Search
    if (intent === 'FIND_CLINIC' || intent === 'CLINIC_SEARCH') {
      const count = context.clinics?.length || 8;
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `📍 I discovered **${count} verified healthcare clinics and hospitals** near **${locality}**.\n\nYou can view them on the interactive map or filter by specialization, minimum rating, and shortest road distance.`,
        timestamp,
        intent,
        quickReplies: ['Eye Specialist near me', 'Dentist near me', 'Cardiologist near me', 'Open Map View'],
        actionLink: {
          type: 'search',
          label: 'Explore Clinics Near You',
        },
      };
    }

    // 14. App Help / General Greeting
    if (intent === 'APP_HELP') {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `👋 Hello! I am **MedLink Assistant**, your healthcare navigation guide for **${locality}**.\n\nI can help you with:\n• Finding specialized clinics & doctors near you\n• Checking your appointment status & live queue position\n• Reviewing health records & digital prescriptions\n• Navigating clinic operating hours & announcements\n\nHow can I help you today?`,
        timestamp,
        intent,
        quickReplies: [
          'Where is the nearest eye clinic?',
          'Is my appointment tomorrow?',
          'Any announcements today?',
          'Which clinic should I go to?',
        ],
      };
    }

    // 15. Graceful Fallback for Unrecognized Inquiries
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `I can help you find a clinic, choose a department, check an appointment, view health records, or understand common healthcare guidance. What would you like help with?`,
      timestamp,
      intent: 'UNKNOWN',
      quickReplies: [
        'Find Eye Specialists Near Me',
        'Which clinic should I go to?',
        'When is my next appointment?',
        'Show my digital prescriptions',
      ],
    };
  },
};
