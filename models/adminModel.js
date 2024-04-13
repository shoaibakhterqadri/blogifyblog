const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminName : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true,
        select : false
    },
    role : {
        type : String,
        required : true
    },
    image : {
        type : String,
        required : true
    }
},{timeseries : true});

const adminModel = mongoose.model('admins', adminSchema);
module.exports = adminModel;