const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const geoCoder = require('../utils/geocoder');

const jobSchema = new mongoose.Schema({
    title: {
        type : String,
        required : [true, 'Please enter job title.'],
        trim : true,
        maxlength : [100, 'Job title cannot exceed 100 characters.']
    },
    slug : String,
    description : {
        type : String,
        required : [true, 'Please enter job description.']
    },
    email : {
        type : String,
        validate : [validator.isEmail, 'Please enter a valid email address.'] 
    },
    address : {
        type : String,
        required : [true, 'Please add an address.']
    },
    location : {
        type : {
            type : String,
            enum : ['Point']
        },
        coordinates : {
            type : [Number],
            index : '2dsphere'
        },
        formattedAddress : String,
        city : String,
        state : String,
        zipcode : String,
        country : String
    },
    company : {
        type : String,
        required: [true, 'Please add a company name.']
    },
    industry : {
        type : [String],
        required : true,
        enum : {
            values : [
                'Business',
                'Information Technology',
                'Banking',
                'Education/Training',
                'Telecommunication',
                'Others'
            ],
            message : 'Please select an industry.'
        }
    },
    jobType : {
        type : String,
        required : true,
        enum : {
            values : [
                'Permanent',
                'Contract',
                'Internship'
            ],
            message : 'Please select a job type.'
        }
    },
    minEducation : {
        type : String,
        required : true,
        enum : {
            values : [
                'Secondary School',
                'Diploma',
                'Bacholars',
                'Masters',
                'Phd'
            ],
            message : 'Please select the minimum education required.'
        }
    },
    positions : {
        type : Number,
        default : 1
    },
    experience : {
        type : String,
        required : true,
        enum : {
            values : [
                'No Experience',
                '1-2 Years',
                '2-3 Years',
                '4-5 Years',
                '5 Years+'
            ],
            message : 'Please select the minimum years of experience'
        }
    },
    salary : {
        type : Number,
        required : [true, 'Please enter the expected salary']
    },
    postingDate : {
        type : Date,
        default : Date.now
    },
    lastDate : {
        type : Date,
        // default puts last date of job posting to 7 days after posting
        default : new Date().setDate(new Date().getDate() + 7)
    },
    applicantsApplied : {
        type : [Object],
        // will not show this when normal user gets job posting information
        select : false
    },
    user : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    }
});

// Middleware to add URL friendly version of job title before adding to database
jobSchema.pre('save', function(next){
    this.slug = slugify(this.title, {lower : true});

    next();
})

// Middleware to add location details based on address before adding to database
jobSchema.pre('save', async function(next){
    const loc = await geoCoder.geocode(this.address);

    this.location = {
        type : 'Point',
        coordinates : [loc[0].longitude, loc[0].latitude],
        formattedAddress : loc[0].formattedAddress,
        city : loc[0].city,
        state : loc[0].stateCode,
        zipcode : loc[0].zipcode,
        country : loc[0].countryCode
    }

    next();
})



module.exports = mongoose.model('Job', jobSchema);