-- 1️⃣ 删除触发器（Triggers）
DROP TRIGGER IF EXISTS trg_set_default_rank;
DROP TRIGGER IF EXISTS trg_no_self_message;

-- 2️⃣ 删除存储过程和函数（Stored Procedures & Functions）
DROP PROCEDURE IF EXISTS GetStudentAverageScore;
DROP PROCEDURE IF EXISTS GetInstructorCourseCount;
DROP FUNCTION IF EXISTS fn_getErrorCount;

-- 3️⃣ 删除视图（Views）
DROP VIEW IF EXISTS StudentCourseProgress;
DROP VIEW IF EXISTS CompetitionResults;
DROP VIEW IF EXISTS UserMessages;

-- 4️⃣ 删除所有表（先删依赖表，后删主表）
DROP TABLE IF EXISTS Student_Progress;
DROP TABLE IF EXISTS Knowledge_Graph;
DROP TABLE IF EXISTS Error_Log;
DROP TABLE IF EXISTS PrivateMessage;
DROP TABLE IF EXISTS Announcement;
DROP TABLE IF EXISTS Message;
DROP TABLE IF EXISTS Score;
DROP TABLE IF EXISTS Enrollment;
DROP TABLE IF EXISTS Student_Exercise;
DROP TABLE IF EXISTS Module_Exercise;
DROP TABLE IF EXISTS Exercise;
DROP TABLE IF EXISTS Module;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS Question;
DROP TABLE IF EXISTS Instructor;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS Users;