//--------------------------------require--------------------------------//
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const studentSchema = require('./database/studentDetails')
const teacherSchema = require('./database/teacherDetails')
const allCoursesSchema = require('./database/allCourses')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const bodyParser = require('body-parser')

const app = express()
const port = 3000

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(cookieParser())

// app.use(session({
//     secret: 'this is a secret key',
//     cookie: { maxAge: 60000 }
// }));

app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());

//--------------------------------database connection--------------------------------//

mongoose.connect(`mongodb+srv://skilldev:${process.env.DB_PASS}@cluster0.n2ldc.mongodb.net/skilldev?retryWrites=true&w=majority`, (err) => {

    app.listen(port, () => {
        console.log("listening on port 3000");
    });
    console.log("connected to the database");
});

const StudentDetail = mongoose.model('StudentDetail', studentSchema);
const TeacherDetail = mongoose.model('TeacherDetail', teacherSchema);
const AllCourse = mongoose.model('AllCourse', allCoursesSchema);

//--------------------------------get and post--------------------------------//

app.get('/', (req, res) => {
    res.render('mainpage.ejs')
})

app.get('/coursePage', (req, res) => {
    StudentDetail.findOne({_id: req.cookies.studentId}, (err, foundStudent) => {
        AllCourse.findOne({_id: req.query.id}, (err, foundCourse) => {
            let i, flag= 0;
            for(i=0; i<foundStudent.coursesEnrolled.length; i++){
                if(req.query.id == foundStudent.coursesEnrolled[i]._id){
                    flag = 1;
                }
            }
            if(flag == 1){
                res.render('coursePage', {
                    course: foundCourse,
                    isEnrolled: true
                });
            }
            else{
                res.render('coursePage', {
                    course: foundCourse,
                    isEnrolled: false
                });
            }
        })
    })
})

app.get('/courses', (req, res) => {
    StudentDetail.findOne({_id: req.cookies.studentId}, (err, foundStudent) => {
        AllCourse.find({}, (err, allCourses) => {
            res.render('courses', {
                id: '123',
                courses: allCourses,
                enrolled: foundStudent.coursesEnrolled
            });
        })
    })
})

app.get('/teacher', (req, res) => {
    res.render('teacherPage');
})

app.get('/studentSignup', (req, res) => {
    res.render('studentSignup');
})

app.post('/studentSignup', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        const student = new StudentDetail({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            age: req.body.age,
            gender: req.body.gender,
            emailAddress: req.body.emailAddress,
            password: hash
        });
        student.save().then(savedDoc => {
            console.log(savedDoc);
        }).catch(e => {
            console.log(e);
        })
    })
    res.redirect('/studentLogin')
})

app.get('/studentLogin', (req, res) => {
    if (req.cookies.isStudentAuth) {
        if (req.cookies.isStudentAuth == 'true') {
            res.redirect('/courses');
        } else {
            res.send('no');
        }
    } else {
        res.render('studentLogin')
    }
})

app.post('/studentLogin', (req, res) => {
    StudentDetail.findOne({
        emailAddress: req.body.emailAddress
    }, (err, foundStudent) => {
        bcrypt.compare(req.body.password, foundStudent.password, (err, result) => {
            if (result == true) {
                res.cookie('isStudentAuth', true);
                res.cookie('studentId', foundStudent._id);
                res.redirect('/courses');
            } else {
                console.log('incorrect password');
            }
        })
    })

})

app.post('/teacherSignup', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        const teacher = new TeacherDetail({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            age: req.body.age,
            gender: req.body.gender,
            emailAddress: req.body.emailAddress,
            password: hash
        });
        teacher.save().then(savedDoc => {
            console.log(savedDoc);
        }).catch(e => {
            console.log(e);
        })
    })
    res.redirect('/teacherLogin');
})

app.get('/teacherSignup', (req, res) => {
    res.render('teacherSignup');
})

app.post('/addCourse', async (req, res) => {
    
    TeacherDetail.findOne({_id: req.cookies.teacherId}, (err, foundTeacher) => {
        if (err) {
            console.log('some err')
        } else {
            console.log(foundTeacher)
            const teacherName = foundTeacher.firstName
            const course = new AllCourse({
                teacherId: req.cookies.teacherId,
                teacherName: teacherName,
                title: req.body.title,
                subject: req.body.subject,
                videoLink: req.body.videoLink,
                videoId: req.body.videoId,
                shortDesc: req.body.shortDesc,
                longDesc: req.body.longDesc,
                assignment: req.body.quiz,
                tags: req.body.tags,
                enrollNo: 0
            })
            course.save().then(savedDoc => {}).catch(err => {
                console.log(err);
            })
        }
    })
    res.sendStatus('200');

})

app.get('/teacherLogin', (req, res) => {
    if (req.cookies.isTeacherAuth) {
        if (req.cookies.isTeacherAuth == 'true') {
            res.render('teacherPage');
        } else {
            res.send('no');
        }
    } else {
        res.render('teacherLogin')
    }
})

app.post('/teacherLogin', (req, res) => {
    TeacherDetail.findOne({
        emailAddress: req.body.emailAddress
    }, (err, foundTeacher) => {
        bcrypt.compare(req.body.password, foundTeacher.password, (err, result) => {
            if (result == true) {
                res.cookie('isTeacherAuth', true);
                res.cookie('teacherId', foundTeacher._id);
                res.render('teacherPage');
            } else {
                console.log('incorrect password');
            }
        })
    })
})

app.post('/enrollCourse', async (req, res) => {
    StudentDetail.findOne({_id: req.cookies.studentId}, (err, foundStudent) => {
        AllCourse.findOne({_id: req.body.courseId}, async (err, foundCourse) => {
            const enrollArr = [...foundStudent.coursesEnrolled, {title: 'hi'}];
            enrollArr.push(foundCourse);
            console.log(enrollArr);
            foundStudent.coursesEnrolled = [...foundStudent.coursesEnrolled, foundCourse];
            foundCourse.enrollNo += 1;
            await foundStudent.save();
            await foundCourse.save();
            res.redirect('back')
        })
    })
})


app.get('/allCourses', (req, res) => {
    AllCourse.find({}, (err, foundCourses) => {
        let musicCourses = [], artCourses = [], danceCourses = [], scienceCourses = [], mathCourses = [];
        for(let i=0; i<foundCourses.length; i++){
            if(foundCourses[i].subject == 'music'){
                musicCourses.push(foundCourses[i]);
            }
            else if(foundCourses[i].subject == 'art'){
                artCourses.push(foundCourses[i]);
            }
            else if(foundCourses[i].subject == 'dance'){
                danceCourses.push(foundCourses[i]);
            }
            else if(foundCourses[i].subject == 'science'){
                scienceCourses.push(foundCourses[i]);
            }
            else if(foundCourses[i].subject == 'math'){
                mathCourses.push(foundCourses[i]);
            }
        }
        res.render('allCourses', {
            musicCourses: musicCourses,
            artCourses: artCourses,
            danceCourses: danceCourses,
            scienceCourses: scienceCourses,
            mathCourses: mathCourses
        })

    })
})