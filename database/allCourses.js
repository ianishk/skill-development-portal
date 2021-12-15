const mongoose = require('mongoose')

const allCoursesSchema = new mongoose.Schema({
    teacherId: String,
    teacherName: String,
    title: String,
    subject: String,
    videoLink: String,
    videoId: String,
    shortDesc: String,
    longDesc: String,
    quiz: Object,
    average: String,
    tags: Array,
    rating: String,
    enrollNo: Number
})

module.exports = allCoursesSchema;