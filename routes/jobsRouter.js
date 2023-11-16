const express = require('express');
const router = express.Router();

// Import controllers
const {
    createNewJob,
    getJobById,
    updateJobById,
    deleteJobById,
    getAllJobs,
    getAllJobsInRadius,
    getStatsByJobTopic,
} = require('../controllers/jobsController');

// Import user login checking function
const { isUserAuthenticated, authorizedRoles } = require('../middleware/auth');

// Set up routing for individual job CRUD
router.route('/job/create').post(isUserAuthenticated, authorizedRoles("employer", "admin"), createNewJob);
router.route('/job/:id')
    .get(getJobById)
    .put(isUserAuthenticated, authorizedRoles("employer", "admin"), updateJobById)
    .delete(isUserAuthenticated, authorizedRoles("employer", "admin"), deleteJobById);

// Set up routing for all jobs routes
router.route('/jobs').get(getAllJobs);
router.route('/jobs/:zipcode/:distance').get(getAllJobsInRadius);
router.route('/jobs/stats/:topic').get(getStatsByJobTopic);



module.exports = router;