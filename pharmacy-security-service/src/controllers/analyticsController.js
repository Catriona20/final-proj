'use strict';

const analyticsService = require('../services/analyticsService');

/**
 * Controller for AI symptom predictions logging, feedback, and performance metrics (Module 12).
 */

const logPrediction = async (req, res, next) => {
  try {
    const {
      symptomText,
      extractedKeywords,
      recommendedDepartment,
      confidenceScore,
      isEmergency,
      modelVersion,
    } = req.body;

    if (!symptomText || !recommendedDepartment || confidenceScore === undefined) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'symptomText, recommendedDepartment, and confidenceScore are required.',
      });
    }

    const log = await analyticsService.logSymptomPrediction({
      userId: req.user ? req.user.id : null,
      symptomText,
      extractedKeywords,
      recommendedDepartment,
      confidenceScore: parseFloat(confidenceScore),
      isEmergency: Boolean(isEmergency),
      modelVersion,
    });

    return res.status(201).json({
      message: 'Prediction logged successfully.',
      log,
    });
  } catch (error) {
    next(error);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { logId, isAccurate, actualDepartment, userComments } = req.body;

    if (!logId || isAccurate === undefined) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'logId and isAccurate (boolean) are required.',
      });
    }

    const feedback = await analyticsService.recordFeedback({
      logId,
      userId: req.user.id,
      isAccurate: Boolean(isAccurate),
      actualDepartment,
      userComments,
    });

    return res.status(201).json({
      message: 'Feedback recorded successfully.',
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

const getMetrics = async (req, res, next) => {
  try {
    const metrics = await analyticsService.getModelPerformanceMetrics();
    return res.status(200).json({
      metrics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logPrediction,
  submitFeedback,
  getMetrics,
};
