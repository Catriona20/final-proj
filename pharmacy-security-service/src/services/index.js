'use strict';

const authService = require('./authService');
const pharmacyService = require('./pharmacyService');
const analyticsService = require('./analyticsService');
const notificationClient = require('./notificationClient');

module.exports = {
  authService,
  pharmacyService,
  analyticsService,
  notificationClient,
};
