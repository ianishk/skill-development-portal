const mongoose = require('mongoose')

const teacherSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    phoneNo: String,
    age: String,
    gender: String,
    email: String,
    password: String
})

module.exports = teacherSchema;