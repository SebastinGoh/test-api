const express = require('express');
const router = express.Router();

// Import controllers
const {
    createJob,
    getJob,
    updateJob,
    deleteJob,
    getAllJobs,
    getAllJobsInRadius,
    getStatsByJobTopic,
} = require('../controllers/jobsController');

// Import user login checking function
const { isUserAuthenticated, authorizedRoles } = require('../middleware/auth');

// Set up routing for individual job CRUD
router.route('/job/').post(isUserAuthenticated, authorizedRoles("employer", "admin"), createJob);
router.route('/job/:id')
    .get(getJob)
    .put(isUserAuthenticated, authorizedRoles("employer", "admin"), updateJob)
    .delete(isUserAuthenticated, authorizedRoles("employer", "admin"), deleteJob);

// Set up routing for all jobs routes
router.route('/jobs').get(getAllJobs);
router.route('/jobs/:zipcode/:distance').get(getAllJobsInRadius);
router.route('/jobs/stats/:topic').get(getStatsByJobTopic);



module.exports = router;