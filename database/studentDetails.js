const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    phoneNumber: String,
    age: Number,
    gender: String,
    emailAddress: String,
    password: String,
    coursesEnrolled: Array
});

module.exports = studentSchema;
