'use strict';

const { query } = require('../config/database');

/**
 * AI Analytics & Evaluation Service (Module 12)
 */

/**
 * Persists an AI symptom triage prediction log.
 *
 * @param {Object} params
 * @param {string|null} [params.userId]
 * @param {string} params.symptomText
 * @param {Array} params.extractedKeywords
 * @param {string} params.recommendedDepartment
 * @param {number} params.confidenceScore
 * @param {boolean} params.isEmergency
 * @param {string} [params.modelVersion]
 */
const logSymptomPrediction = async ({
  userId = null,
  symptomText,
  extractedKeywords = [],
  recommendedDepartment,
  confidenceScore,
  isEmergency = false,
  modelVersion = 'v0.1.0',
}) => {
  const text = `
    INSERT INTO ai_symptom_logs (
      user_id, symptom_text, extracted_keywords, recommended_department,
      confidence_score, is_emergency, model_version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_id, recommended_department, confidence_score, is_emergency, created_at
  `;
  const values = [
    userId,
    symptomText,
    JSON.stringify(extractedKeywords),
    recommendedDepartment,
    confidenceScore,
    isEmergency,
    modelVersion,
  ];
  const { rows } = await query(text, values);
  return rows[0];
};

/**
 * Records user / practitioner feedback on an AI prediction.
 *
 * @param {Object} params
 * @param {string} params.logId
 * @param {string} params.userId
 * @param {boolean} params.isAccurate
 * @param {string|null} [params.actualDepartment]
 * @param {string|null} [params.userComments]
 */
const recordFeedback = async ({
  logId,
  userId,
  isAccurate,
  actualDepartment = null,
  userComments = null,
}) => {
  const text = `
    INSERT INTO ai_prediction_feedback (log_id, user_id, is_accurate, actual_department, user_comments)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, log_id, user_id, is_accurate, actual_department, user_comments, created_at
  `;
  const values = [logId, userId, isAccurate, actualDepartment, userComments];
  const { rows } = await query(text, values);
  return rows[0];
};

/**
 * Returns model performance metrics and feedback summary.
 */
const getModelPerformanceMetrics = async () => {
  const { rows: stats } = await query(`
    SELECT
      COUNT(l.id)::INTEGER as total_predictions,
      COUNT(f.id)::INTEGER as total_feedback_count,
      COUNT(CASE WHEN f.is_accurate = true THEN 1 END)::INTEGER as accurate_feedback_count,
      ROUND(AVG(l.confidence_score)::NUMERIC, 4) as average_confidence,
      COUNT(CASE WHEN l.is_emergency = true THEN 1 END)::INTEGER as emergency_flag_count
    FROM ai_symptom_logs l
    LEFT JOIN ai_prediction_feedback f ON l.id = f.log_id
  `);

  return stats[0];
};

module.exports = {
  logSymptomPrediction,
  recordFeedback,
  getModelPerformanceMetrics,
};
