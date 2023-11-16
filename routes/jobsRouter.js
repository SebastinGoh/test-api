const express = require('express');
const router = express.Router();

// Import controllers
const {
    getAllJobs,
    createNewJob,
    getAllJobsInRadius,
    getJobById,
    updateJobById,
    deleteJobById,
    getStatsByJobTopic,
} = require('../controllers/jobsController');

// Import authentication check
const { isUserAuthenticated, authorizedRoles } = require('../middleware/auth');

// Set up routing for requests to be handled by controller
router.route('/jobs').get(getAllJobs);
router.route('/jobs/:zipcode/:distance').get(getAllJobsInRadius);
router.route('/jobs/stats/:topic').get(getStatsByJobTopic);

router.route('/job/create').post(isUserAuthenticated, authorizedRoles("employer", "admin"), createNewJob);
router.route('/job/:id')
    .get(getJobById)
    .put(isUserAuthenticated, authorizedRoles("employer", "admin"), updateJobById)
    .delete(isUserAuthenticated, authorizedRoles("employer", "admin"), deleteJobById);

module.exports = router;