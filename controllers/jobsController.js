// Get database schema modals
const Job = require('../models/jobSchema');

// Get utility functions
const geoCoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const APIFilter = require('../utils/filterHandler');

// Get all jobs 
// /api/v1/jobs/
exports.getAllJobs = catchAsyncErrors( async (req, res, next) => {
    
    let jobs;
    if (req.query) {
        const apiFilter = new APIFilter(Job.find(), req.query)
            .filter()
            .limitFields()
            .searchByQuery();
        jobs = await apiFilter.query;
    } else {
        jobs = await Job.find();
    }

    res.status(200).json({
        success : true,
        results : jobs.length,
        data : jobs
    });
});

// Create new job
// /api/v1/job/new
exports.createNewJob = catchAsyncErrors( async (req, res, next) => {
    const job = await Job.create(req.body);

    res.status(200).json({
        success : true,
        message : 'Job created',
        data : job
    });
});

// Get job by Id
// /api/v1/job/:id
exports.getJobById = catchAsyncErrors(async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        res.status(200).json({
            success : true,
            data : job
        });
        return;
    }
    catch(e) {
        return next(new ErrorHandler('Error: Job not found', 404));
    }
});

// Get all jobs within specified distance of zipcode
// /api/v1/jobs/:zipcode/:distance
exports.getAllJobsInRadius = catchAsyncErrors( async (req, res, next) => {
    const { zipcode , distance } = req.params;

    if (!zipcode || !distance) {
        return next(new ErrorHandler('Error: Invalid search parameters', 404));
    }

    const loc = await geoCoder.geocode(zipcode);
    const longitude = loc[0].longitude;
    const latitude = loc[0].latitude;

    // get radius by dividing specified distance by radius of the earth (in miles)
    const radius = distance / 3963;

    const jobs = await Job.find({
        location : {
            $geoWithin : {
                $centerSphere : [
                    [ longitude , latitude ], 
                    radius
                ]
            }
         }
    });

    res.status(200).json({
        success : true,
        results : jobs.length,
        data : jobs
    });
});

// Update job based on job ID 
// /api/v1/job/:id
exports.updateJobById = catchAsyncErrors(async (req, res, next) => {
    try {
        let job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new : true,
            runValidators : true
        })
    
        res.status(200).json({
            success : true,
            message : 'Job updated',
            data : job
        });
    } catch(e) {
        return next(new ErrorHandler('Error: Job not found', 404));
    }
});

// Delete job based on job ID 
// /api/v1/job/:id
exports.deleteJobById = catchAsyncErrors( async (req, res, next) => {
    try {
        await Job.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success : true,
            message : 'Job deleted',
        });
    } catch(e) {
        return next(new ErrorHandler('Error: Job not found', 404));
    }
});

// Get statistics about all jobs (Not working)
// api/v1/jobs/stats/:topic
exports.getStatsByJobTopic = catchAsyncErrors( async(req, res, next) => {
    const topic = req.params.topic;
    
    if (!topic) {
        return next(new ErrorHandler('Invalid topic', 404));
    }
    
    try {
        const stats = await Job.aggregate([
            {
                $match : {$text : {$search : "\"" + topic + "\"" }}
            },
            {
                $group : {
                    _id : null,
                    totalJobs : {$sum : 1},
                    avgPosition : {$avg : '$positions'},
                    avgSalary : {$avg : '$salary'},
                    minSalary : {$min : '$salary'},
                    maxSalary : {$max : '$salary'}
                }
            }
        ]);
        
        if (stats.length === 0) {
            return next(new ErrorHandler(`Error: No stats found for ${topic}`, 404))
        }

        res.status(200).json({
            success : true,
            data : stats
        })
    } catch(e) {
        return next(new ErrorHandler('Error: Problem getting stats', 404));
    }
});
