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
            console.log(foundStudent.coursesEnrolled)
            res.render('courses', {
                id: '123',
                courses: allCourses,
                enrolled: foundStudent.coursesEnrolled
            });
        })
    })
})

app.get('/teacher', (req, res) => {
    res.render('teacherPage', {
        query: req.query.q
    });
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

app.get('/quiz', (req, res) => {
    const courseId = req.query.cid
    AllCourse.findOne({_id: courseId}, (err, allCourses) => {
        res.render('quiz', {
            quiz: allCourses.quiz,
            id: courseId
        })
    } )
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

app.post('/quiz', (req, res) => {
    AllCourse.findOne({_id: req.body.id}, (err, foundCourse) => {
        let mark = 0;
        const ansObj = foundCourse.quiz;
        if(ansObj.q1co === req.body.q1){
            mark++;
        }
        if(ansObj.q2co === req.body.q2){
            mark++;
        }
        if(ansObj.q3co === req.body.q3){
            mark++;
        }
        StudentDetail.findOne({_id: req.cookies.studentId}, async (err, foundStudent) =>{
            for(var i=0; i<foundStudent.coursesEnrolled.length; i++){
                var narr = [];
               if(foundStudent.coursesEnrolled[i]._id == req.query.id){
                   foundStudent.coursesEnrolled[i]= { quizMark: mark, ...foundStudent.coursesEnrolled[i]};
                   console.log(foundStudent.coursesEnrolled[i])

                   await foundStudent.save();
                   break;
               } 
            }
            
            })
            res.render('results', {
                mark: mark
            }) 
        
    }) 
})

app.post('/addCourse', async (req, res) => {
    
    TeacherDetail.findOne({_id: req.cookies.teacherId}, (err, foundTeacher) => {
        if (err) {
            console.log('some err')
        } else {
            console.log(foundTeacher)
            const quiz = {
                q1: req.body.q1,
                q1o1: req.body.q1o1,
                q1o2: req.body.q1o2,
                q1o3: req.body.q1o3,
                q1o4: req.body.q1o4,
                q1co: req.body.q1co,

                q2: req.body.q2,
                q2o1: req.body.q2o1,
                q2o2: req.body.q2o2,
                q2o3: req.body.q2o3,
                q2o4: req.body.q2o4,
                q2co: req.body.q2co,

                q3: req.body.q3,
                q3o1: req.body.q3o1,
                q3o2: req.body.q3o2,
                q3o3: req.body.q3o3,
                q3o4: req.body.q3o4,
                q3co: req.body.q3co,

            }
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
                quiz: quiz,
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
    let q = ""
    if (req.cookies.isTeacherAuth) {
        if (req.cookies.isTeacherAuth == 'true') {
            AllCourse.find({teacherId: req.cookies.teacherId}, (err, foundCourses) => {
                if(req.query.q != undefined){
                    q = req.query.q
                }
                else{
                    q = "addcourse"
                }
                res.render('teacherPage',{
                    query: q,
                    courses: foundCourses
                });
            })
            
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
                res.render('teacherPage',{
                    query: 'addcourse'
                });
            } else {
                console.log('incorrect password');
            }
        })
    })
})

app.get('/tcourses', (req, res) => {

    AllCourse.find({teacherId: req.cookies.teacherId}, (err, foundCourses) => {
        res.render('tcourses', {
            courses: foundCourses
        })
    })
})

app.get('/b', (req, res) => {
    AllCourse.findOne({title: 'anegan'}, (err, course) => {{
        res.render('d', {
            id: course._id
        })
    }})
})

app.get('/marks', (req, res)=> {
    const markDetail = [];
    let cname, cnos=0, cavg, fmarks=0;
    StudentDetail.find({}, (err, foundStudents) => {
        foundStudents.forEach(student => {
            
            student.coursesEnrolled.forEach(course => {
    
               
                if(course._id == req.query.id){

                    cname = course.title;
                    cnos += 1;

                    const newObj = {
                        name: student.firstName,
                        mark: course.quizMark
                    }
                    markDetail.push(newObj);
                    fmarks += parseInt(course.quizMark)
                }
            })
        })

        cavg = fmarks/cnos
        
        res.render('marks', {
            cname: cname,
            cnos: cnos,
            cavg: cavg,
            marksObj: markDetail,
        })
    })
    
})

app.post('/enrollCourse', async (req, res) => {
    StudentDetail.findOne({_id: req.cookies.studentId}, (err, foundStudent) => {
        AllCourse.findOne({_id: req.body.courseId}, async (err, foundCourse) => {
            const enrollArr = [...foundStudent.coursesEnrolled, {title: 'hi'}];
            enrollArr.push(foundCourse);
            
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

app.get('/:url', (req, res) => {
    res.render('404')
})