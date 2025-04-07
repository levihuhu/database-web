DROP VIEW IF EXISTS StudentCourseProgress;
DROP VIEW IF EXISTS CompetitionResults;
DROP VIEW IF EXISTS UserMessages;
DROP PROCEDURE IF EXISTS GetStudentAverageScore;
DROP PROCEDURE IF EXISTS GetInstructorCourseCount;
DROP FUNCTION IF EXISTS fn_getErrorCount;
DROP TRIGGER IF EXISTS trg_set_default_rank;
DROP TRIGGER IF EXISTS trg_no_self_message;

DROP TABLE IF EXISTS Student_Progress;
DROP TABLE IF EXISTS Knowledge_Graph;
DROP TABLE IF EXISTS Error_Log;
DROP TABLE IF EXISTS Real_Time_Activity;
DROP TABLE IF EXISTS Competition_Questions;
DROP TABLE IF EXISTS Competition_Participants;
DROP TABLE IF EXISTS Competition;
DROP TABLE IF EXISTS Message;
DROP TABLE IF EXISTS Score;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS Question;
DROP TABLE IF EXISTS Instructor;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS Users;
--  Users 
CREATE TABLE Users (
    user_id INT PRIMARY KEY,
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
    course_id INT PRIMARY KEY,
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
    score_id INT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    total_score DECIMAL(10, 2),
    `rank` INT,
    FOREIGN KEY (student_id) REFERENCES Student(student_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

-- Message
CREATE TABLE Message (
    message_id INT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message_content TEXT,
    timestamp DATETIME,
    FOREIGN KEY (sender_id)
        REFERENCES Users (user_id),
    FOREIGN KEY (receiver_id)
        REFERENCES Users (user_id)
);

CREATE TABLE Exercise (
  exercise_id INT AUTO_INCREMENT PRIMARY KEY,
  module_id VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  hint TEXT,
  expected_answer TEXT,
  difficulty VARCHAR(20),
  table_schema JSON,
  tags VARCHAR(255),
    created_by INT NOT NULL,
    FOREIGN KEY (created_by)
        REFERENCES Instructor (instructor_id)
);


-- Question
CREATE TABLE Question (
    question_id INT PRIMARY KEY,
    question_text TEXT,
    difficulty_level ENUM('Easy', 'Medium', 'Hard'),
    tags VARCHAR(255),
    created_by INT NOT NULL,
    FOREIGN KEY (created_by)
        REFERENCES Instructor (instructor_id)
);

-- Competition
CREATE TABLE Competition (
    competition_id INT PRIMARY KEY,
    competition_name VARCHAR(100) NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    status VARCHAR(50),
    created_by INT NOT NULL,
    FOREIGN KEY (created_by)
        REFERENCES Instructor (instructor_id)
);


-- Real_Time_Activity
CREATE TABLE Real_Time_Activity (
    activity_id INT PRIMARY KEY,
    competition_id INT NOT NULL,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    timestamp DATETIME,
    status VARCHAR(50),
    FOREIGN KEY (competition_id)
        REFERENCES Competition (competition_id),
    FOREIGN KEY (student_id)
        REFERENCES Student (student_id),
    FOREIGN KEY (question_id)
        REFERENCES Question (question_id)
);

-- Error_Log
CREATE TABLE Error_Log (
    error_id INT PRIMARY KEY,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    error_type ENUM('Syntax', 'Runtime', 'Logic'),
    feedback TEXT,
    FOREIGN KEY (student_id)
        REFERENCES Student (student_id),
    FOREIGN KEY (question_id)
        REFERENCES Question (question_id)
);

-- Knowledge_Graph
CREATE TABLE Knowledge_Graph (
    graph_id INT PRIMARY KEY,
    student_id INT NOT NULL,
    weak_areas TEXT,
    suggestions TEXT,
    FOREIGN KEY (student_id)
        REFERENCES Student (student_id)
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
SELECT m.message_id,
       m.sender_id,
       m.receiver_id,
       m.message_content,
       m.timestamp
FROM Message m;