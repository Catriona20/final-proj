import re
from typing import Tuple, Optional

# Rule-based red-flag emergency symptoms dictionary
EMERGENCY_PATTERNS = [
    (r"(chest pain|chest tightness|pressure in chest|heart attack|radiating.*left arm)", "Potential acute cardiovascular emergency"),
    (r"(cannot breathe|severe shortness of breath|gasping|suffocating|choking)", "Potential severe respiratory distress"),
    (r"(unconscious|fainting|passed out|loss of consciousness|seizure|convulsions)", "Neurological emergency / altered consciousness"),
    (r"(sudden weakness|facial drooping|slurred speech|stroke)", "Potential acute stroke symptoms"),
    (r"(coughing blood|vomiting blood|severe bleeding|hemorrhage)", "Critical hemorrhagic state"),
    (r"(anaphylaxis|swelling of throat|swelling of lips.*breathing)", "Severe allergic reaction / anaphylaxis"),
]


def evaluate_emergency_triage(symptoms_text: str) -> Tuple[bool, Optional[str]]:
    """
    Scans patient narrative for critical red-flag keywords and emergency indicators.
    Returns (is_emergency, reason).
    """
    text_lower = symptoms_text.lower()
    for pattern, reason in EMERGENCY_PATTERNS:
        if re.search(pattern, text_lower):
            return True, reason
    return False, None
