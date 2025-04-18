DROP VIEW IF EXISTS StudentCourseProgress;
DROP VIEW IF EXISTS UserMessages;
DROP VIEW IF EXISTS CourseAnnouncements;
DROP PROCEDURE IF EXISTS GetStudentAverageScore;
DROP PROCEDURE IF EXISTS GetInstructorCourseCount;
DROP FUNCTION IF EXISTS fn_getErrorCount;
DROP TRIGGER IF EXISTS trg_set_default_rank;
DROP TRIGGER IF EXISTS trg_no_self_message;

DROP TABLE IF EXISTS Student_Progress;
DROP TABLE IF EXISTS Message;
DROP TABLE IF EXISTS Score;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS Enrollment;
DROP TABLE IF EXISTS Module;
DROP TABLE IF EXISTS Exercise;
DROP TABLE IF EXISTS Module_Exercise;
DROP TABLE IF EXISTS Student_Exercise;
DROP TABLE IF EXISTS Instructor;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('Student', 'Instructor') NOT NULL,
    profile_info TEXT
);

-- Student
CREATE TABLE Student (
    student_id INT PRIMARY KEY,
    FOREIGN KEY (student_id)
        REFERENCES Users (user_id)
);

-- Instructor
CREATE TABLE Instructor (
    instructor_id INT PRIMARY KEY,
    FOREIGN KEY (instructor_id)
        REFERENCES Users (user_id)
);

-- Course
CREATE TABLE Course (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) NOT NULL, -- eg.CS5200
    instructor_id INT NOT NULL,
    course_description TEXT,
    year INT,
    term TINYINT, 
    state ENUM('active', 'complete', 'discontinued'), 
    FOREIGN KEY (instructor_id)
        REFERENCES Instructor (instructor_id)
);

-- Create Enrollment Table (Tracks student course registration)
CREATE TABLE Enrollment (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    course_id INT,
    status ENUM('enrolled', 'waitlisted', 'dropped') DEFAULT 'enrolled',
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE
);

-- Create Module Table (Tracks modules within a course)
CREATE TABLE Module (
    module_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT,
    module_name VARCHAR(255) NOT NULL,
    module_description TEXT,
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE SET NULL
);

-- Score
CREATE TABLE Score (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    total_score DECIMAL(10, 2),
    `rank` INT,
    FOREIGN KEY (student_id) REFERENCES Student(student_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

CREATE TABLE Message (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    message_type ENUM('private', 'announcement') NOT NULL,
    message_content TEXT,
    timestamp DATETIME,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);

CREATE TABLE PrivateMessage (
    message_id INT PRIMARY KEY,
    receiver_id INT NOT NULL,
    FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id)
);

CREATE TABLE Announcement (
    message_id INT PRIMARY KEY,
    course_id INT NOT NULL,
    FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

CREATE TABLE Exercise (
    exercise_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    hint TEXT,
    expected_answer TEXT,
    difficulty VARCHAR(20),
    table_schema JSON,
    tags VARCHAR(255),
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES Instructor(instructor_id)
);

CREATE TABLE Module_Exercise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    exercise_id INT NOT NULL,
    display_order INT,
    FOREIGN KEY (module_id) REFERENCES Module(module_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES Exercise(exercise_id) ON DELETE CASCADE
);


CREATE TABLE Student_Exercise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exercise_id INT NOT NULL,
    submitted_answer TEXT,
    is_correct BOOLEAN,
    score DECIMAL(5,2),         -- 例如5.2表示最多5位数字，小数点后2位
    ai_feedback TEXT,           -- 存储AI反馈
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES Exercise(exercise_id) ON DELETE CASCADE
);


-- Student_Progress
CREATE TABLE Student_Progress (
    progress_id INT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    completed_questions INT,
    accuracy_rate DECIMAL(10 , 5),
    learning_goals TEXT,
    FOREIGN KEY (student_id)
        REFERENCES Student (student_id),
    FOREIGN KEY (course_id)
        REFERENCES Course (course_id)
);

-- Trigger
-- Set the rank for Score for new student
DELIMITER //
CREATE TRIGGER trg_set_default_rank
BEFORE INSERT ON Score
FOR EACH ROW
BEGIN
    IF NEW.rank IS NULL THEN
        SET NEW.rank = 1;
    END IF;
END;
//
DELIMITER ;


-- STORED PROCEDURES / FUNCTIONS
-- Get average score
DELIMITER //
CREATE PROCEDURE GetStudentAverageScore(
    IN p_student_id INT,
    OUT avg_score DECIMAL(10,2)
)
BEGIN
    SELECT AVG(total_score) INTO avg_score
    FROM Score
    WHERE student_id = p_student_id;
END;
//
DELIMITER ;

-- Get the total courses for one instructor
DELIMITER //
CREATE PROCEDURE GetInstructorCourseCount(
    IN p_instructor_id INT,
    OUT course_count INT
)
BEGIN
    SELECT COUNT(*) INTO course_count
    FROM Course
    WHERE instructor_id = p_instructor_id;
END;
//
DELIMITER ;
-- Get total errors of a given student
DELIMITER //
CREATE FUNCTION fn_getErrorCount(p_student_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE err_count INT;
    SELECT COUNT(*) INTO err_count
    FROM Error_Log
    WHERE student_id = p_student_id;
    RETURN err_count;
END;
//
DELIMITER ;

-- View
CREATE VIEW StudentCourseProgress AS
SELECT sp.progress_id,
       s.student_id,
       u.username,
       c.course_id,
       c.course_name,
       sp.completed_questions,
       sp.accuracy_rate,
       sp.learning_goals
FROM Student_Progress sp
JOIN Student s ON sp.student_id = s.student_id
JOIN Users u ON s.student_id = u.user_id
JOIN Course c ON sp.course_id = c.course_id;


CREATE VIEW UserMessages AS
SELECT
    m.message_id,
    m.sender_id,
    p.receiver_id,
    m.message_content,
    m.timestamp
FROM Message m
JOIN PrivateMessage p ON m.message_id = p.message_id;

CREATE VIEW CourseAnnouncements AS
SELECT
    m.message_id,
    m.sender_id,
    a.course_id,
    m.message_content,
    m.timestamp
FROM Message m
JOIN Announcement a ON m.message_id = a.message_id;
