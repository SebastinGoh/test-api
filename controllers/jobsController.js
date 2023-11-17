// Get database schema modals
const Job = require('../models/jobSchema');

// Get utility functions
const geoCoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const APIFilter = require('../utils/filterHandler');
const path = require('path');

// Create new job (POST)
// /api/v1/job/
exports.createJob = catchAsyncErrors( async (req, res, next) => {
    req.body.user = req.user.id;
    
    const job = await Job.create(req.body);

    res.status(200).json({
        success : true,
        message : 'Job created',
        data : job
    });
});

// Read job by Id (GET)
// /api/v1/job/:id
exports.getJob = catchAsyncErrors(async (req, res, next) => {
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

// Update job based on job ID (PUT)
// /api/v1/job/:id
exports.updateJob = catchAsyncErrors(async (req, res, next) => {
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

// Delete job based on job ID (DELETE)
// /api/v1/job/:id
exports.deleteJob = catchAsyncErrors( async (req, res, next) => {
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

// Get all jobs 
// /api/v1/jobs/
exports.getAllJobs = catchAsyncErrors( async (req, res, next) => {
    
    let jobs;
    if (req.query) {
        const apiFilter = new APIFilter(Job.find(), req.query)
            .filter()
            .limitFields();
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

// Apply for job based on job ID (PUT)
// /api/v1/job/:id/apply
exports.applyJob = catchAsyncErrors( async(req, res, next) => {
    let job = await Job.findById(req.params.id).select('+applicantsApplied');

    if (!job) {
        return next(new ErrorHandler('Error: Job not found', 404));
    }

    // Check job last date
    if (job.lastDate < new Date(Date.now())) {
        return next(new ErrorHandler('Error: Job application date is over', 400));
    }

    // Check if user has applied for job already
    for (let i=0; i < job.applicantsApplied.length; i++) {
        if (job.applicantsApplied[i].id === req.user.id) {
            return next(new ErrorHandler('Error: Job has been applied to already', 400))
        }
    }

    // Check for file upload
    if (!req.files) {
        return next(new ErrorHandler('Error: File required', 400));
    }

    const file = req.files.file;

    // Check file type
    const supportedFileTypes = /.docx|.pdf/;
    if (!supportedFileTypes.test(path.extname(file.name))) {
        return next(new ErrorHandler('Error: File type not supported', 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler('Error: File size exceeded', 400));
    }

    // Renaming file
    file.name = `${req.user.name.replace(' ','_')}_${job._id}${path.parse(file.name).ext}`;

    // Upload file
    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err);
            return next(new ErrorHandler('Error: Resume upload failed', 500));
        }

        await Job.findByIdAndUpdate(req.params.id, {$push : {
            applicantsApplied : {
                id : req.user.id,
                resume : file.name
            }
        }}), {
            new : true,
            runValidators : true,
            useFindAndModify : false
        }
    });
    
    res.status(200).json({
        success : true,
        message : 'Job application successful',
        data : file.name
    })
})