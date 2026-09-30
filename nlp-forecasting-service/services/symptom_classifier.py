import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional
import joblib
import numpy as np

# Ensure project root is in sys.path so schemas and utils resolve cleanly regardless of execution context
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from schemas.symptoms import SymptomAnalysisRequest, SymptomAnalysisResponse
from utils.emergency_detector import evaluate_emergency_triage

logger = logging.getLogger("nlp-forecasting-service.symptom_classifier")

# Complete clinical specialist mapping covering all 17 target departments
DEPARTMENT_TO_SPECIALIST_MAP: Dict[str, str] = {
    "Cardiology": "Cardiologist",
    "Dentistry": "Dentist",
    "Dermatology": "Dermatologist",
    "ENT": "ENT Specialist",
    "Endocrinology": "Endocrinologist",
    "Gastroenterology": "Gastroenterologist",
    "General Medicine": "General Physician",
    "Gynecology": "Gynecologist",
    "Nephrology": "Nephrologist",
    "Neurology": "Neurologist",
    "Ophthalmology": "Ophthalmologist",
    "Orthopedics": "Orthopedic Surgeon",
    "Pediatrics": "Pediatrician",
    "Physiotherapy": "Physiotherapist",
    "Psychiatry": "Psychiatrist",
    "Pulmonology": "Pulmonologist",
    "Urology": "Urologist",
    # Backward-compatible model labels
    "Hematology": "General Physician",
    "Hepatology": "Gastroenterologist",
}

import re


def normalize_clinical_text(text: str) -> str:
    """
    Robust normalization for clinical intent and specialist routing:
    - Normalizes case, spacing, and punctuation
    - Strips possessives and hyphens ('women's' -> 'womens', 'ob-gyn' -> 'ob gyn')
    - Maps common spelling variations (British/American: gynaecologist -> gynecologist, etc.)
    """
    t = text.lower().strip()
    t = re.sub(r"['’]", "", t)
    t = re.sub(r"[-_/]", " ", t)
    t = re.sub(r"\s+", " ", t)

    # Normalize British and shorthand variants to canonical tokens
    t = re.sub(r"\bgynaecolog\w*", "gynecologist", t)
    t = re.sub(r"\bgynaec\w*", "gynecology", t)
    t = re.sub(r"\bgynae\b", "gynecology", t)
    t = re.sub(r"\bgyno\b", "gynecology", t)
    t = re.sub(r"\bob\s*gyn\b|\bobgyn\b", "gynecologist", t)
    t = re.sub(r"\bpaediatr\w*", "pediatrician", t)
    t = re.sub(r"\borthopaed\w*", "orthopedic", t)
    t = re.sub(r"\bphysiotherap\w*", "physiotherapy", t)
    return t


# Exhaustive clinical symptom & specialist intent keyword priors covering all 17 departments
CLINICAL_DOMAIN_KEYWORD_MAP: Dict[str, str] = {
    # 1. GYNECOLOGY / WOMEN'S HEALTH
    "gynaecologist": "Gynecology",
    "gynecologist": "Gynecology",
    "gynaecology": "Gynecology",
    "gynecology": "Gynecology",
    "obstetrician": "Gynecology",
    "ob gyn": "Gynecology",
    "obgyn": "Gynecology",
    "womens health": "Gynecology",
    "women health": "Gynecology",
    "pregnancy specialist": "Gynecology",
    "pregnancy doctor": "Gynecology",
    "pregnancy consultation": "Gynecology",
    "pregnancy checkup": "Gynecology",
    "period problems": "Gynecology",
    "irregular periods": "Gynecology",
    "menstrual pain": "Gynecology",
    "period pain": "Gynecology",
    "missed period": "Gynecology",
    "heavy period": "Gynecology",
    "pelvic pain": "Gynecology",
    "pcos symptoms": "Gynecology",
    "pcos": "Gynecology",
    "pcod": "Gynecology",
    "antenatal checkup": "Gynecology",
    "pregnancy": "Gynecology",
    "maternity": "Gynecology",
    "gynae": "Gynecology",
    "gyno": "Gynecology",

    # 2. DENTISTRY
    "root canal treatment": "Dentistry",
    "root canal": "Dentistry",
    "toothache": "Dentistry",
    "tooth ache": "Dentistry",
    "tooth pain": "Dentistry",
    "teeth pain": "Dentistry",
    "teeth": "Dentistry",
    "tooth": "Dentistry",
    "dentist": "Dentistry",
    "dental": "Dentistry",
    "cavity": "Dentistry",
    "gum bleeding": "Dentistry",
    "gum swelling": "Dentistry",
    "bleeding gum": "Dentistry",
    "swollen gum": "Dentistry",
    "tooth sensitivity": "Dentistry",
    "jaw pain": "Dentistry",
    "wisdom tooth": "Dentistry",
    "broken tooth": "Dentistry",
    "dental cleaning": "Dentistry",
    "dental filling": "Dentistry",
    "tooth extraction": "Dentistry",
    "plaque": "Dentistry",
    "bad breath": "Dentistry",
    "tooth decay": "Dentistry",
    "loose tooth": "Dentistry",
    "oral pain": "Dentistry",
    "orthodontist": "Dentistry",

    # 3. CARDIOLOGY
    "cardiologist": "Cardiology",
    "heart specialist": "Cardiology",
    "heart doctor": "Cardiology",
    "cardiac specialist": "Cardiology",
    "chest pain": "Cardiology",
    "chest tightness": "Cardiology",
    "chest pressure": "Cardiology",
    "palpitations": "Cardiology",
    "irregular heartbeat": "Cardiology",
    "fast heartbeat": "Cardiology",
    "slow heartbeat": "Cardiology",
    "heart pain": "Cardiology",
    "high blood pressure": "Cardiology",
    "hypertension": "Cardiology",
    "cardiac": "Cardiology",
    "ecg": "Cardiology",
    "echo": "Cardiology",
    "heart attack": "Cardiology",

    # 4. DERMATOLOGY
    "dermatologist": "Dermatology",
    "skin specialist": "Dermatology",
    "skin doctor": "Dermatology",
    "skin rash": "Dermatology",
    "itchy skin": "Dermatology",
    "itching skin": "Dermatology",
    "itchy rash": "Dermatology",
    "acne": "Dermatology",
    "rash": "Dermatology",
    "itching": "Dermatology",
    "skin allergy": "Dermatology",
    "eczema": "Dermatology",
    "psoriasis": "Dermatology",
    "hair loss": "Dermatology",
    "hair fall": "Dermatology",
    "dandruff": "Dermatology",
    "skin infection": "Dermatology",
    "pigmentation": "Dermatology",
    "mole": "Dermatology",
    "skin irritation": "Dermatology",
    "skin lesion": "Dermatology",
    "skin": "Dermatology",

    # 5. ENT
    "ent specialist": "ENT",
    "ent doctor": "ENT",
    "ear nose throat": "ENT",
    "ear doctor": "ENT",
    "throat doctor": "ENT",
    "ear pain": "ENT",
    "ear ache": "ENT",
    "ear infection": "ENT",
    "hearing loss": "ENT",
    "sinusitis": "ENT",
    "sinus": "ENT",
    "sinus pressure": "ENT",
    "blocked nose": "ENT",
    "nasal congestion": "ENT",
    "sore throat": "ENT",
    "throat pain": "ENT",
    "tonsillitis": "ENT",
    "tonsil": "ENT",
    "vertigo": "ENT",
    "tinnitus": "ENT",
    "ringing in ear": "ENT",
    "ent": "ENT",

    # 6. OPHTHALMOLOGY
    "ophthalmologist": "Ophthalmology",
    "eye specialist": "Ophthalmology",
    "eye doctor": "Ophthalmology",
    "optometrist": "Ophthalmology",
    "blurred vision": "Ophthalmology",
    "blurry vision": "Ophthalmology",
    "eye pain": "Ophthalmology",
    "red eye": "Ophthalmology",
    "itchy eyes": "Ophthalmology",
    "dry eyes": "Ophthalmology",
    "watery eyes": "Ophthalmology",
    "vision problems": "Ophthalmology",
    "vision problem": "Ophthalmology",
    "trouble seeing": "Ophthalmology",
    "difficulty seeing": "Ophthalmology",
    "trouble with vision": "Ophthalmology",
    "vision": "Ophthalmology",
    "eye infection": "Ophthalmology",
    "cataract": "Ophthalmology",
    "glaucoma": "Ophthalmology",
    "eye strain": "Ophthalmology",
    "eye irritation": "Ophthalmology",

    # 7. ORTHOPEDICS
    "orthopedic surgeon": "Orthopedics",
    "orthopaedic surgeon": "Orthopedics",
    "orthopedic specialist": "Orthopedics",
    "orthopedic doctor": "Orthopedics",
    "orthopedist": "Orthopedics",
    "bone specialist": "Orthopedics",
    "joint specialist": "Orthopedics",
    "joint doctor": "Orthopedics",
    "knee specialist": "Orthopedics",
    "spine doctor": "Orthopedics",
    "back pain": "Orthopedics",
    "lower back pain": "Orthopedics",
    "knee pain": "Orthopedics",
    "joint pain": "Orthopedics",
    "shoulder pain": "Orthopedics",
    "neck pain": "Orthopedics",
    "hip pain": "Orthopedics",
    "ankle pain": "Orthopedics",
    "fracture": "Orthopedics",
    "bone fracture": "Orthopedics",
    "sports injury": "Orthopedics",
    "arthritis": "Orthopedics",
    "bone pain": "Orthopedics",
    "joint swelling": "Orthopedics",
    "orthopedic": "Orthopedics",
    "ortho": "Orthopedics",
    "bone": "Orthopedics",

    # 8. PEDIATRICS
    "pediatrician": "Pediatrics",
    "paediatrician": "Pediatrics",
    "child specialist": "Pediatrics",
    "child doctor": "Pediatrics",
    "baby doctor": "Pediatrics",
    "child fever": "Pediatrics",
    "baby fever": "Pediatrics",
    "infant fever": "Pediatrics",
    "child cough": "Pediatrics",
    "child cold": "Pediatrics",
    "child vaccination": "Pediatrics",
    "baby vaccination": "Pediatrics",
    "child stomach pain": "Pediatrics",
    "child allergy": "Pediatrics",
    "infant": "Pediatrics",
    "baby": "Pediatrics",
    "child": "Pediatrics",

    # 9. NEUROLOGY
    "neurologist": "Neurology",
    "nerve specialist": "Neurology",
    "nerve doctor": "Neurology",
    "brain doctor": "Neurology",
    "brain specialist": "Neurology",
    "migraine": "Neurology",
    "severe headache": "Neurology",
    "chronic headache": "Neurology",
    "headache": "Neurology",
    "headaches": "Neurology",
    "numbness and tingling": "Neurology",
    "numbness": "Neurology",
    "tingling": "Neurology",
    "seizure": "Neurology",
    "seizures": "Neurology",
    "epilepsy": "Neurology",
    "memory problems": "Neurology",
    "nerve pain": "Neurology",
    "neuropathy": "Neurology",
    "tremor": "Neurology",
    "tremors": "Neurology",

    # 10. GASTROENTEROLOGY
    "gastroenterologist": "Gastroenterology",
    "stomach specialist": "Gastroenterology",
    "stomach doctor": "Gastroenterology",
    "digestive specialist": "Gastroenterology",
    "liver specialist": "Gastroenterology",
    "stomach pain": "Gastroenterology",
    "severe stomach pain": "Gastroenterology",
    "acid reflux": "Gastroenterology",
    "gerd": "Gastroenterology",
    "gastritis": "Gastroenterology",
    "acidity": "Gastroenterology",
    "indigestion": "Gastroenterology",
    "heartburn": "Gastroenterology",
    "vomiting": "Gastroenterology",
    "chronic diarrhea": "Gastroenterology",
    "constipation": "Gastroenterology",
    "abdominal pain": "Gastroenterology",
    "gastro": "Gastroenterology",

    # 11. PULMONOLOGY
    "pulmonologist": "Pulmonology",
    "chest specialist": "Pulmonology",
    "lung specialist": "Pulmonology",
    "respiratory specialist": "Pulmonology",
    "lung doctor": "Pulmonology",
    "chest doctor": "Pulmonology",
    "breathing problem": "Pulmonology",
    "breathing problems": "Pulmonology",
    "trouble breathing": "Pulmonology",
    "difficulty breathing": "Pulmonology",
    "shortness of breath": "Pulmonology",
    "chronic cough": "Pulmonology",
    "persistent cough": "Pulmonology",
    "asthma attack": "Pulmonology",
    "asthma": "Pulmonology",
    "wheezing": "Pulmonology",
    "bronchitis": "Pulmonology",
    "copd": "Pulmonology",
    "chest congestion": "Pulmonology",
    "lung infection": "Pulmonology",

    # 12. NEPHROLOGY
    "nephrologist": "Nephrology",
    "kidney specialist": "Nephrology",
    "renal specialist": "Nephrology",
    "kidney doctor": "Nephrology",
    "renal doctor": "Nephrology",
    "kidney problem": "Nephrology",
    "kidney failure": "Nephrology",
    "renal failure": "Nephrology",
    "foamy urine": "Nephrology",
    "high creatinine": "Nephrology",
    "proteinuria": "Nephrology",
    "dialysis": "Nephrology",
    "swollen ankles": "Nephrology",
    "chronic kidney disease": "Nephrology",

    # 13. ENDOCRINOLOGY
    "endocrinology": "Endocrinology",
    "endocrinologist": "Endocrinology",
    "diabetologist": "Endocrinology",
    "diabetes specialist": "Endocrinology",
    "thyroid specialist": "Endocrinology",
    "hormone specialist": "Endocrinology",
    "hormone doctor": "Endocrinology",
    "high blood sugar": "Endocrinology",
    "uncontrolled diabetes": "Endocrinology",
    "diabetes checkup": "Endocrinology",
    "diabetes": "Endocrinology",
    "hypothyroidism": "Endocrinology",
    "hyperthyroidism": "Endocrinology",
    "thyroid problem": "Endocrinology",
    "thyroid swelling": "Endocrinology",
    "thyroid": "Endocrinology",
    "hormonal imbalance": "Endocrinology",

    # 14. UROLOGY
    "urologist": "Urology",
    "urinary specialist": "Urology",
    "kidney stone specialist": "Urology",
    "prostate specialist": "Urology",
    "kidney stone pain": "Urology",
    "kidney stone": "Urology",
    "kidney stones": "Urology",
    "burning urination": "Urology",
    "painful urination": "Urology",
    "urine problem": "Urology",
    "urine problems": "Urology",
    "urinary problem": "Urology",
    "urinary problems": "Urology",
    "urinary infection": "Urology",
    "blood in urine": "Urology",
    "prostate problem": "Urology",
    "enlarged prostate": "Urology",
    "dysuria": "Urology",

    # 15. PHYSIOTHERAPY
    "physiotherapist": "Physiotherapy",
    "physical therapist": "Physiotherapy",
    "physiotherapy": "Physiotherapy",
    "physical therapy": "Physiotherapy",
    "sports physio": "Physiotherapy",
    "rehab specialist": "Physiotherapy",
    "back pain physiotherapy": "Physiotherapy",
    "post surgery rehab": "Physiotherapy",
    "frozen shoulder": "Physiotherapy",
    "mobility therapy": "Physiotherapy",
    "rehabilitation": "Physiotherapy",

    # 16. PSYCHIATRY
    "psychiatrist": "Psychiatry",
    "mental health doctor": "Psychiatry",
    "mental health specialist": "Psychiatry",
    "psychotherapist": "Psychiatry",
    "severe anxiety": "Psychiatry",
    "panic attack": "Psychiatry",
    "panic attacks": "Psychiatry",
    "clinical depression": "Psychiatry",
    "depression": "Psychiatry",
    "chronic stress": "Psychiatry",
    "severe insomnia": "Psychiatry",
    "insomnia": "Psychiatry",
    "sleep disorder": "Psychiatry",
    "cannot sleep": "Psychiatry",
    "anxiety": "Psychiatry",
    "mental health": "Psychiatry",

    # 17. GENERAL MEDICINE
    "general medicine": "General Medicine",
    "general physician": "General Medicine",
    "family doctor": "General Medicine",
    "general practitioner": "General Medicine",
    "primary care doctor": "General Medicine",
    "viral fever": "General Medicine",
    "viral symptoms": "General Medicine",
    "fever": "General Medicine",
    "cold": "General Medicine",
    "flu": "General Medicine",
    "fatigue": "General Medicine",
    "weakness": "General Medicine",
    "general body pain": "General Medicine",
    "mild headache": "General Medicine",
    "general checkup": "General Medicine",
    "cancer treatment": "General Medicine",
    "cancer care": "General Medicine",
    "cancer": "General Medicine",
    "oncology": "General Medicine",
    "oncologist": "General Medicine",
    "chemotherapy": "General Medicine",
}

class SymptomClassificationService:
    """
    Module 10: Clinical Department Recommendation & Triage Engine.
    
    Uses normalized feature processing, clinical domain keyword priors, and
    serialized ML Pipeline to route patient requests to one of 17 canonical departments.
    """

    def __init__(self):
        base_dir = Path(__file__).resolve().parent.parent
        self.model_path = base_dir / "models" / "department_classifier.joblib"
        self.metadata_path = base_dir / "models" / "department_classifier_metadata.json"

        logger.info("Initializing SymptomClassificationService...")

        if not self.model_path.exists():
            error_msg = f"Critical Error: Model artifact not found at {self.model_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        try:
            self.pipeline = joblib.load(self.model_path)
            logger.info("Successfully loaded ML pipeline artifact: %s", self.model_path)
        except Exception as e:
            error_msg = f"Failed to load model pipeline artifact from {self.model_path}: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e

        if not self.metadata_path.exists():
            error_msg = f"Critical Error: Metadata file not found at {self.metadata_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        try:
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            raw_version = self.metadata.get("model_version", "1.0.0")
            self.model_version = f"nlp-dept-clf-v{raw_version}"
            logger.info("Loaded model metadata: version=%s, departments=%d", self.model_version, self.metadata.get("number_of_departments", 0))
        except Exception as e:
            error_msg = f"Failed to parse metadata from {self.metadata_path}: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e

        if "features" in self.pipeline.named_steps:
            feature_union = self.pipeline.named_steps["features"]
            word_vectorizer = feature_union.transformer_list[0][1]
            self.vectorizer = word_vectorizer
        elif "tfidf" in self.pipeline.named_steps:
            self.vectorizer = self.pipeline.named_steps["tfidf"]
        else:
            self.vectorizer = self.pipeline.steps[0][1]

        self.analyzer = self.vectorizer.build_analyzer()
        self.vocabulary = self.vectorizer.vocabulary_

    def analyze_symptoms(self, payload: SymptomAnalysisRequest) -> SymptomAnalysisResponse:
        """
        Executes independent emergency triage and department routing with
        clinical domain keyword priority and normalized ML classification.
        """
        raw_text = payload.symptoms.strip()
        lower_raw = raw_text.lower()
        normalized_text = normalize_clinical_text(raw_text)

        # 1. Independent Emergency Safety Evaluation
        is_emergency, emergency_reason = evaluate_emergency_triage(raw_text)

        # 2. Clinical Domain Keyword Priority Match
        matched_prior_dept: Optional[str] = None
        matched_keyword: Optional[str] = None
        for keyword, dept in sorted(CLINICAL_DOMAIN_KEYWORD_MAP.items(), key=lambda x: len(x[0]), reverse=True):
            kw_pattern = r"(?:\b|^)" + re.escape(keyword) + r"(?:\b|$)"
            if re.search(kw_pattern, normalized_text) or re.search(kw_pattern, lower_raw):
                matched_prior_dept = dept
                matched_keyword = keyword
                break

        # 3. ML Probability Distribution & Margin Calculation
        # Predict on normalized text to benefit from normalized vocabulary tokens
        probabilities: np.ndarray = self.pipeline.predict_proba([normalized_text])[0]
        sorted_indices = np.argsort(probabilities)[::-1]

        top1_idx = sorted_indices[0]
        top2_idx = sorted_indices[1]

        top1_prob = float(probabilities[top1_idx])
        top2_prob = float(probabilities[top2_idx])
        top1_department: str = str(self.pipeline.classes_[top1_idx])

        margin = top1_prob - top2_prob
        confidence_score: float = round(top1_prob, 2)
        confidence_margin: float = round(margin, 2)

        if matched_prior_dept:
            routing_status = "recommended"
            recommended_department: Optional[str] = matched_prior_dept
            recommended_specialist: Optional[str] = DEPARTMENT_TO_SPECIALIST_MAP.get(
                matched_prior_dept, "Specialist"
            )
            confidence_score = 0.96
            confidence_margin = 0.85
        elif (top1_prob >= 0.25 and margin >= 0.08) or top1_prob >= 0.30:
            routing_status = "recommended"
            recommended_department = top1_department
            recommended_specialist = DEPARTMENT_TO_SPECIALIST_MAP.get(
                top1_department, "General Physician"
            )
        else:
            routing_status = "requires_further_assessment"
            recommended_department = top1_department if top1_prob >= 0.20 else None
            recommended_specialist = DEPARTMENT_TO_SPECIALIST_MAP.get(top1_department, "General Physician") if recommended_department else None

        # 4. Keyword Extraction from Fitted Model Feature Vocabulary
        candidate_ngrams: List[str] = self.analyzer(normalized_text)
        extracted_keywords: List[str] = list(
            dict.fromkeys([ngram for ngram in candidate_ngrams if ngram in self.vocabulary])
        )
        if matched_keyword and matched_keyword not in extracted_keywords:
            extracted_keywords.insert(0, matched_keyword)

        return SymptomAnalysisResponse(
            routing_status=routing_status,
            extracted_keywords=extracted_keywords,
            recommended_department=recommended_department,
            recommended_specialist=recommended_specialist,
            confidence_score=confidence_score,
            confidence_margin=confidence_margin,
            is_emergency=is_emergency,
            emergency_reason=emergency_reason,
            model_version=self.model_version,
        )


# Singleton service instance initialized at module load
symptom_service = SymptomClassificationService()


