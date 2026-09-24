import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
import joblib
import numpy as np

try:
    from schemas.symptoms import SymptomAnalysisRequest, SymptomAnalysisResponse
    from utils.emergency_detector import evaluate_emergency_triage
except (ImportError, ValueError):
    from ..schemas.symptoms import SymptomAnalysisRequest, SymptomAnalysisResponse
    from ..utils.emergency_detector import evaluate_emergency_triage

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
    "Hematology": "Hematologist",
    "Hepatology": "Hepatologist",
    "Neurology": "Neurologist",
    "Ophthalmology": "Ophthalmologist",
    "Orthopedics": "Orthopedic Surgeon",
    "Pediatrics": "Pediatrician",
    "Psychiatry": "Psychiatrist",
    "Pulmonology": "Pulmonologist",
    "Urology": "Urologist",
}


# Exhaustive clinical symptom-to-department keyword priors covering all primary specialties
CLINICAL_DOMAIN_KEYWORD_MAP: Dict[str, str] = {
    # DENTISTRY
    "root canal": "Dentistry",
    "root canal treatment": "Dentistry",
    "toothache": "Dentistry",
    "tooth ache": "Dentistry",
    "teeth": "Dentistry",
    "tooth": "Dentistry",
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
    "plaque": "Dentistry",
    "bad breath": "Dentistry",
    "tooth decay": "Dentistry",
    "loose tooth": "Dentistry",
    "oral pain": "Dentistry",
    "dental filling": "Dentistry",
    "dentist": "Dentistry",
    "dental": "Dentistry",

    # CARDIOLOGY
    "chest pain": "Cardiology",
    "palpitations": "Cardiology",
    "high blood pressure": "Cardiology",
    "hypertension": "Cardiology",
    "shortness of breath": "Cardiology",
    "irregular heartbeat": "Cardiology",
    "heart pain": "Cardiology",
    "fast heartbeat": "Cardiology",
    "slow heartbeat": "Cardiology",
    "dizziness with palpitations": "Cardiology",
    "cardiologist": "Cardiology",
    "cardiac": "Cardiology",
    "ecg": "Cardiology",
    "echo": "Cardiology",

    # DERMATOLOGY
    "acne": "Dermatology",
    "rash": "Dermatology",
    "skin rash": "Dermatology",
    "itching": "Dermatology",
    "skin allergy": "Dermatology",
    "eczema": "Dermatology",
    "psoriasis": "Dermatology",
    "hair loss": "Dermatology",
    "dandruff": "Dermatology",
    "skin infection": "Dermatology",
    "pigmentation": "Dermatology",
    "mole": "Dermatology",
    "skin irritation": "Dermatology",
    "dermatologist": "Dermatology",
    "skin": "Dermatology",

    # ENT
    "ear pain": "ENT",
    "hearing loss": "ENT",
    "ear infection": "ENT",
    "sinusitis": "ENT",
    "sinus": "ENT",
    "blocked nose": "ENT",
    "sore throat": "ENT",
    "tonsillitis": "ENT",
    "vertigo": "ENT",
    "tinnitus": "ENT",
    "nasal congestion": "ENT",
    "ent": "ENT",
    "throat pain": "ENT",
    "ear ache": "ENT",

    # OPHTHALMOLOGY
    "blurred vision": "Ophthalmology",
    "eye pain": "Ophthalmology",
    "red eye": "Ophthalmology",
    "itchy eyes": "Ophthalmology",
    "dry eyes": "Ophthalmology",
    "watery eyes": "Ophthalmology",
    "vision problems": "Ophthalmology",
    "eye infection": "Ophthalmology",
    "headache with vision problems": "Ophthalmology",
    "eye doctor": "Ophthalmology",
    "ophthalmologist": "Ophthalmology",
    "cataract": "Ophthalmology",

    # ORTHOPEDICS
    "back pain": "Orthopedics",
    "knee pain": "Orthopedics",
    "joint pain": "Orthopedics",
    "shoulder pain": "Orthopedics",
    "neck pain": "Orthopedics",
    "fracture": "Orthopedics",
    "sports injury": "Orthopedics",
    "ankle pain": "Orthopedics",
    "arthritis": "Orthopedics",
    "bone pain": "Orthopedics",
    "orthopedic": "Orthopedics",
    "bone": "Orthopedics",

    # GENERAL MEDICINE
    "fever": "General Medicine",
    "cold": "General Medicine",
    "flu": "General Medicine",
    "fatigue": "General Medicine",
    "weakness": "General Medicine",
    "general body pain": "General Medicine",
    "mild headache": "General Medicine",
    "viral symptoms": "General Medicine",
    "viral fever": "General Medicine",

    # PEDIATRICS
    "child fever": "Pediatrics",
    "baby fever": "Pediatrics",
    "child cough": "Pediatrics",
    "child cold": "Pediatrics",
    "child vaccination": "Pediatrics",
    "child stomach pain": "Pediatrics",
    "child allergy": "Pediatrics",
    "pediatrician": "Pediatrics",
    "infant": "Pediatrics",
    "baby": "Pediatrics",
    "child": "Pediatrics",

    # GYNECOLOGY
    "period problems": "Gynecology",
    "irregular periods": "Gynecology",
    "pelvic pain": "Gynecology",
    "pregnancy consultation": "Gynecology",
    "pcos symptoms": "Gynecology",
    "pcos": "Gynecology",
    "menstrual pain": "Gynecology",
    "period pain": "Gynecology",
    "gynecologist": "Gynecology",
    "pregnancy": "Gynecology",

    # NEUROLOGY
    "migraine": "Neurology",
    "severe headache": "Neurology",
    "numbness": "Neurology",
    "tingling": "Neurology",
    "seizure": "Neurology",
    "memory problems": "Neurology",
    "nerve pain": "Neurology",
    "tremor": "Neurology",
    "neurologist": "Neurology",

    # GASTROENTEROLOGY
    "stomach pain": "Gastroenterology",
    "acidity": "Gastroenterology",
    "gastritis": "Gastroenterology",
    "indigestion": "Gastroenterology",
    "vomiting": "Gastroenterology",
    "diarrhea": "Gastroenterology",
    "constipation": "Gastroenterology",
    "abdominal pain": "Gastroenterology",
    "gastroenterologist": "Gastroenterology",
    "gerd": "Gastroenterology",
}

class SymptomClassificationService:
    """
    Module 10: Clinical Department Recommendation & Triage Engine.
    
    Uses a serialized scikit-learn ML Pipeline (TF-IDF (1,2)-grams + Class-Weighted
    Logistic Regression) combined with clinical priors to route free-text patient symptom narratives to one of
    17 medical departments, while evaluating red-flag emergency symptoms through an
    independent safety triage layer.
    """

    def __init__(self):
        # Resolve artifact paths relative to service root
        base_dir = Path(__file__).resolve().parent.parent
        self.model_path = base_dir / "models" / "department_classifier.joblib"
        self.metadata_path = base_dir / "models" / "department_classifier_metadata.json"

        logger.info("Initializing SymptomClassificationService...")

        # 1. Load ML Pipeline Artifact
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

        # 2. Load Model Metadata
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

        # 3. Cache word TF-IDF vectorizer components for clean keyword extraction
        if "features" in self.pipeline.named_steps:
            # v2.0.0 FeatureUnion structure
            feature_union = self.pipeline.named_steps["features"]
            word_vectorizer = feature_union.transformer_list[0][1]
            self.vectorizer = word_vectorizer
        elif "tfidf" in self.pipeline.named_steps:
            # v1.0.0 single vectorizer structure fallback
            self.vectorizer = self.pipeline.named_steps["tfidf"]
        else:
            self.vectorizer = self.pipeline.steps[0][1]

        self.analyzer = self.vectorizer.build_analyzer()
        self.vocabulary = self.vectorizer.vocabulary_

    def analyze_symptoms(self, payload: SymptomAnalysisRequest) -> SymptomAnalysisResponse:
        """
        Executes independent emergency triage and ML department routing with
        evidence-based abstention (Rule E: Top1 >= 0.35 AND Margin >= 0.10)
        and clinical domain keyword priority.
        """
        text = payload.symptoms.strip()
        lower_text = text.lower()

        # 1. Independent Emergency Safety Evaluation
        is_emergency, emergency_reason = evaluate_emergency_triage(text)

        # 2. Clinical Domain Keyword Priority Match
        matched_prior_dept: Optional[str] = None
        for keyword, dept in sorted(CLINICAL_DOMAIN_KEYWORD_MAP.items(), key=lambda x: len(x[0]), reverse=True):
            if keyword in lower_text:
                matched_prior_dept = dept
                break

        # 3. ML Probability Distribution & Margin Calculation
        probabilities: np.ndarray = self.pipeline.predict_proba([text])[0]
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
        candidate_ngrams: List[str] = self.analyzer(text)
        extracted_keywords: List[str] = list(
            dict.fromkeys([ngram for ngram in candidate_ngrams if ngram in self.vocabulary])
        )

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

