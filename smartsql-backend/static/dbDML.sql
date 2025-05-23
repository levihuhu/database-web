
-- Users table
INSERT INTO Users (user_id, first_name, last_name, username, email, password, user_type, profile_info) VALUES
(1, 'John', 'Doe', 'John', '1001@northeastern.edu', 'passJohn', 'Student', 'John is a CS student.'),
(2, 'Mary', 'Smith', 'Mary', '1002@northeastern.edu', 'passMary', 'Student', 'Mary is a CS student.'),
(3, 'Peter', 'Johnson', 'Peter', '1003@northeastern.edu', 'passPeter', 'Student', 'Peter is a CS student.'),
(4, 'Linda', 'Lee', 'Linda', '1004@northeastern.edu', 'passLinda', 'Student', 'Linda is a CS student.'),
(5, 'Robert', 'Kim', 'Robert', '1005@northeastern.edu', 'passRobert', 'Student', 'Robert is a CS student.'),
(6, 'Smith', 'Brown', 'Bmith', '1006@northeastern.edu', 'passSmith', 'Instructor', 'Professor Smith, PhD.'),
(7, 'James', 'Jones', 'prof_jones', '1007@northeastern.edu', 'passJones', 'Instructor', 'Instructor Jones.'),
(8, 'William', 'Williams', 'Williams', '1008@northeastern.edu', 'passWilliams', 'Instructor', 'Instructor of research projects.'),
(9, 'Brian', 'Brown', 'Brown', '1009@northeastern.edu', 'passBrown', 'Instructor', 'TA in CS5200.'),
(10, 'Emily', 'Taylor', 'Emily', '1010@northeastern.edu', 'passEmily', 'Student', 'Emily is a CS student.');



-- Student table (from student users)
INSERT INTO Student (student_id) VALUES
(1),
(2),
(3),
(4),
(5),
(10);

-- Instructor table (from instructor users)
INSERT INTO Instructor (instructor_id) VALUES
(6),
(7),
(8),
(9);

-- Course table (SQL-related courses with term, year, and course_code in CSxxxx format)
INSERT INTO Course (course_id, course_name, course_code, instructor_id, course_description, year, term, state) VALUES
(1, 'Database Management Systems', 'CS5200', 6, 'Fundamentals of database design and SQL.', 2023, 1, 'complete'),
(2, 'Database Management Systems', 'CS5200', 6, 'Fundamentals of database design and SQL.', 2024, 3, 'active'),
(3, 'Advanced SQL and Query Optimization', 'CS5300', 7, 'Techniques for writing efficient and optimized SQL queries.', 2023, 2, 'complete'),
(4, 'Relational Database Systems', 'CS5100', 8, 'Study of relational models and database normalization.', 2024, 1, 'active'),
(5, 'NoSQL and Modern Data Models', 'CS5400', 9, 'Overview of NoSQL databases and their use cases.', 2023, 3, 'complete'),
(6, 'SQL for Data Analysis', 'CS5500', 7, 'Using SQL to analyze and extract insights from data.', 2024, 2, 'active'),
(7, 'Database Management Systems', 'CS5200', 6, 'Fundamentals of database design and SQL.', 2025, 1, 'active'),
(8, 'Database Security and Access Control', 'CS5600', 6, 'Covers data protection, user privileges, and secure database practices.', 2024, 1, 'active'),
(9, 'Data Warehousing and OLAP', 'CS5700', 7, 'Design and use of data warehouses and online analytical processing.', 2023, 3, 'complete'),
(10, 'Transaction Management', 'CS5800', 8, 'Concurrency, atomicity, and recovery in database systems.', 2024, 2, 'active'),
(11, 'Database Systems for Big Data', 'CS5900', 9, 'Scalable database systems in the era of big data.', 2025, 1, 'active'),
(12, 'Practical SQL Projects', 'CS6000', 7, 'Hands-on SQL assignments with real-world data.', 2025, 2, 'active'),
(13, 'Cloud Databases', 'CS6100', 8, 'Study of cloud-based database solutions and deployment.', 2023, 2, 'complete'),
(14, 'Data Modeling Techniques', 'CS6200', 6, 'ER modeling, UML diagrams, and schema design practices.', 2024, 3, 'active'),
(15, 'Temporal and Spatial Databases', 'CS6300', 9, 'Specialized databases for time-series and location-based data.', 2025, 3, 'active');

INSERT INTO Enrollment (student_id, course_id, status) VALUES
(1, 1, 'enrolled'),
(1, 2, 'enrolled'),
(2, 3, 'enrolled'),
(3, 5, 'waitlisted'),
(4, 4, 'dropped'),
(5, 2, 'enrolled'),
(5, 6, 'enrolled'),
(10, 1, 'enrolled'),
(10, 11, 'enrolled'),
(1, 7, 'enrolled'),
(1, 8, 'enrolled'),
(1, 14, 'enrolled');

INSERT INTO Module (module_id, course_id, module_name, module_description) VALUES
-- course_id: 1 - Database Management Systems (CS5200)
(1, 1, 'Introduction to Databases', 'Overview of database systems and architecture.'),
(2, 1, 'SQL Fundamentals', 'Basic SQL syntax including SELECT, INSERT, UPDATE, DELETE.'),
(3, 1, 'Relational Design', 'Understanding relational models and schema design.'),


-- course_id: 3 - Advanced SQL and Query Optimization (CS5300)
(4, 3, 'Query Optimization', 'Strategies for optimizing complex SQL queries.'),
(5, 3, 'Advanced Joins', 'Techniques like self joins, outer joins, and cross joins.'),
(6, 3, 'Window Functions', 'Use of window functions for advanced analytics.'),

-- course_id: 5 - NoSQL and Modern Data Models (CS5400)
(7, 5, 'Document Databases', 'Introduction to MongoDB and JSON-style databases.'),
(8, 5, 'Key-Value and Column Stores', 'Overview of DynamoDB and Cassandra.'),
(9, 5, 'Graph Databases', 'Concepts of graph DBs like Neo4j.'),

-- course_id: 6 - SQL for Data Analysis (CS5500)
(10, 6, 'Aggregations & Grouping', 'GROUP BY, HAVING, and aggregate functions.'),
(11, 6, 'Data Cleaning in SQL', 'Filtering and transforming data.'),
(12, 6, 'Subqueries & Common Table Expressions', 'Using subqueries and CTEs for analysis.'),

-- course_id: 8 - Database Security and Access Control (CS5600)
(13, 8, 'User Access Management', 'GRANT, REVOKE, and managing permissions.'),
(14, 8, 'Database Encryption', 'Securing data at rest and in transit.'),
(15, 8, 'Vulnerability Mitigation', 'Avoiding SQL injection and security holes.'),

-- course_id: 10 - Transaction Management (CS5800)
(16, 10, 'ACID Properties', 'Atomicity, Consistency, Isolation, Durability.'),
(17, 10, 'Locking Mechanisms', 'Row-level, table-level locking strategies.'),
(18, 10, 'Recovery & Logging', 'Techniques for data recovery and rollback.'),

-- course_id: 11 - Database Systems for Big Data (CS5900)
(19, 11, 'Distributed Query Engines', 'Hive, Presto, and query federation.'),
(20, 11, 'Sharding and Replication', 'Scalability in big data environments.'),

-- course_id: 12 - Practical SQL Projects (CS6000)
(21, 12, 'Real-World Case Study', 'Modeling for e-commerce or healthcare system.'),
(22, 12, 'Team Project Module', 'Group work to build, test, and analyze a database.');


-- Score table (course_id: 1~15, student_id in 1,2,3,4,5,10)
INSERT INTO Score (score_id, student_id, course_id, total_score, `rank`) VALUES
(1, 1, 1, 92.50, 1),
(2, 2, 1, 88.75, 2),
(3, 3, 2, 95.00, 1),
(4, 4, 3, 85.25, 3),
(5, 5, 4, 90.00, 2),
(6, 10, 5, 87.50, 2),
(7, 1, 6, 93.00, 1),
(8, 2, 7, 91.20, 2),
(9, 3, 8, 89.40, 3),
(10, 4, 9, 96.00, 1),
(11, 5, 10, 84.75, 3),
(12, 10, 11, 90.50, 2),
(13, 1, 2, 90.00, 1),
(14, 2, 3, 88.50, 2),
(15, 3, 5, 85.75, 3),
(16, 4, 4, 89.00, 2),
(17, 5, 2, 91.00, 1),
(18, 5, 6, 86.50, 2),
(19, 10, 1, 88.00, 3),
(20, 1, 7, 92.00, 1),
(21, 1, 8, 87.00, 2),
(22, 1, 14, 90.50, 1);


INSERT INTO Message (message_id, sender_id, message_type, message_content, timestamp) VALUES
(1, 1, 'private', 'Hi Professor Lee!', '2025-01-15 10:00:00'),
(2, 2, 'private', 'Dear TA, I have some questions regarding lab exercises.', '2025-01-16 11:15:00'),
(3, 3, 'private', 'Hello, can you explain further about the assignment requirements?', '2025-01-17 09:45:00'),
(4, 4, 'private', 'When is the next lab session?', '2025-01-18 14:30:00'),
(5, 5, 'private', 'Hello, how can I submit the project?', '2025-01-19 08:20:00'),
(6, 10, 'private', 'sample', '2025-01-20 16:00:00'),
(7, 1, 'private', 'Thank you!', '2025-01-21 12:10:00'),
(8, 6, 'announcement', 'Reminder: Project 1 is due this Friday.', '2025-01-22 09:00:00'),
(9, 7, 'announcement', 'Quiz 2 will be next Monday during class.', '2025-01-23 14:30:00'),
(10, 8, 'announcement', 'Don''t forget to submit Assignment 2 by tonight.', '2025-01-24 10:00:00'),
(11, 9, 'announcement', 'The lecture slides have been uploaded to the portal.', '2025-01-25 11:00:00'),
(12, 6, 'announcement', 'Office hours are extended to 6pm this week.', '2025-01-26 15:30:00'),
(13, 7, 'announcement', 'Midterm grades are released.', '2025-01-27 13:20:00'),
(14, 9, 'announcement', 'Class will be online tomorrow.', '2025-01-28 16:00:00');


INSERT INTO PrivateMessage (message_id, receiver_id) VALUES
(1, 6),
(2, 7),
(3, 8),
(4, 9),
(5, 6),
(6, 7),
(7, 8);


INSERT INTO Announcement (message_id, course_id) VALUES
(8, 1),
(9, 3),
(10, 4),
(11, 5),
(12, 2),
(13, 6),
(14, 15);


INSERT INTO Exercise (exercise_id, title, description, hint, expected_answer, difficulty, table_schema, tags, created_by)
VALUES
(1, 'Simple SELECT Query', 'Write a SQL query to select all columns from the ''employees'' table.', 'Use SELECT * FROM employees;', 'SELECT * FROM employees;', 'Easy', '[{"name": "employees", "columns": ["id", "first_name", "last_name", "department", "salary"]}]', 'select, basics', 6),
(2, 'Average Salary by Department', 'Write a SQL query to calculate the average salary for each department.', 'Use GROUP BY on the department column.', 'SELECT department, AVG(salary) FROM employees GROUP BY department;', 'Medium', '[{"name": "employees", "columns": ["id", "name", "department", "salary"]}]', 'aggregation, group by', 6),
(3, 'Find Students and Their Courses', 'Write a SQL query to list student names along with the names of courses they are enrolled in.', 'Use JOIN between students, enrollments, and courses.', 'SELECT s.name, c.course_name \n        FROM students s\n        JOIN enrollments e ON s.id = e.student_id\n        JOIN courses c ON e.course_id = c.id;', 'Medium', '[{"name": "students", "columns": ["id", "name"]}, {"name": "enrollments", "columns": ["id", "student_id", "course_id"]}, {"name": "courses", "columns": ["id", "course_name"]}]', 'join, relational', 6),
(4, 'Retrieve All Students', 'Retrieve all columns from the students table.', 'Use the SELECT * statement.', 'SELECT * FROM students;', 'Easy', '[{"name": "students", "columns": ["id", "name", "age", "major"]}]', 'basics, select', 6),
(5, 'Retrieve Unique Departments', 'Retrieve distinct department names from the departments table.', 'Use the DISTINCT keyword.', 'SELECT DISTINCT department_name FROM departments;', 'Easy', '[{"name": "departments", "columns": ["department_id", "department_name"]}]', 'basics, distinct', 6),
(6, 'Count Total Courses', 'Count the total number of courses in the courses table.', 'Use the COUNT function.', 'SELECT COUNT(*) FROM courses;', 'Easy', '[{"name": "courses", "columns": ["course_id", "course_name", "course_code"]}]', 'aggregation, count', 6),
(7, 'Find Maximum Salary', 'Find the maximum salary from the employees table.', 'Use the MAX function.', 'SELECT MAX(salary) FROM employees;', 'Easy', '[{"name": "employees", "columns": ["employee_id", "name", "salary"]}]', 'aggregation, max', 6),
(8, 'List Courses Starting with CS', 'List all courses where the course code starts with CS.', 'Use the LIKE operator with a wildcard.', 'SELECT * FROM courses WHERE course_code LIKE ''CS%'';', 'Medium', '[{"name": "courses", "columns": ["course_id", "course_name", "course_code"]}]', 'filtering, like', 6),
(9, 'Retrieve Students Enrolled in CS101', 'Retrieve names of students enrolled in the course CS101.', 'Use a JOIN between students and enrollments tables.', 'SELECT s.name FROM students s JOIN enrollments e ON s.id = e.student_id WHERE e.course_code = ''CS101'';', 'Medium', '[{"name": "students", "columns": ["id", "name"]}, {"name": "enrollments", "columns": ["student_id", "course_code"]}]', 'join, filtering', 6),
(10, 'Calculate Average Salary by Department', 'Calculate the average salary for each department.', 'Use GROUP BY and AVG functions.', 'SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id;', 'Medium', '[{"name": "employees", "columns": ["employee_id", "department_id", "salary"]}]', 'aggregation, group by', 6),
(11, 'Find Employees Without Managers', 'Find names of employees who do not have a manager.', 'Use WHERE clause to filter NULL values.', 'SELECT name FROM employees WHERE manager_id IS NULL;', 'Medium', '[{"name": "employees", "columns": ["employee_id", "name", "manager_id"]}]', 'filtering, null', 6),
(12, 'Insert a New Student', 'Insert a new student named Alice into the students table.', 'Use the INSERT INTO statement.', 'INSERT INTO students (name) VALUES (''Alice'');', 'Easy', '[{"name": "students", "columns": ["id", "name"]}]', 'insert, basics', 6),
(13, 'Update Course Name', 'Update the name of the course with code CS101 to Introduction to Computer Science.', 'Use the UPDATE statement with a WHERE clause.', 'UPDATE courses SET course_name = ''Introduction to Computer Science'' WHERE course_code = ''CS101'';', 'Easy', '[{"name": "courses", "columns": ["course_id", "course_name", "course_code"]}]', 'update, basics', 6),
(14, 'Delete a Student Record', 'Delete the student record with ID 10 from the students table.', 'Use the DELETE FROM statement with a WHERE clause.', 'DELETE FROM students WHERE id = 10;', 'Easy', '[{"name": "students", "columns": ["id", "name"]}]', 'delete, basics', 6),
(15, 'Retrieve Courses with No Enrollments', 'Retrieve courses that have no students enrolled.', 'Use a LEFT JOIN and filter for NULL values.', 'SELECT c.course_name FROM courses c LEFT JOIN enrollments e ON c.course_code = e.course_code WHERE e.student_id IS NULL;', 'Medium', '[{"name": "courses", "columns": ["course_code", "course_name"]}, {"name": "enrollments", "columns": ["student_id", "course_code"]}]', 'join, null', 6),
(16, 'List Students Enrolled in Multiple Courses', 'List students who are enrolled in more than one course.', 'Use GROUP BY and HAVING clauses.', 'SELECT student_id FROM enrollments GROUP BY student_id HAVING COUNT(course_code) > 1;', 'Medium', '[{"name": "enrollments", "columns": ["student_id", "course_code"]}]', 'aggregation, group by, having', 6),
(17, 'Retrieve Top 5 Highest Paid Employees', 'Retrieve the top 5 highest paid employees.', 'Use ORDER BY and LIMIT clauses.', 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 5;', 'Medium', '[{"name": "employees", "columns": ["employee_id", "name", "salary"]}]', 'sorting, limit', 6);

INSERT INTO Module_Exercise (module_id, exercise_id, display_order) VALUES
-- Course 1 (Modules 1,2,3)
(1, 1, 1), (1, 4, 2), (1, 5, 3), (1, 6, 4), (1, 7, 5), (1, 8, 6), (1, 9, 7), (1, 10, 8),
(2, 2, 1), (2, 11, 2), (2, 12, 3), (2, 13, 4), (2, 14, 5), (2, 15, 6), (2, 16, 7), (2, 17, 8),
(3, 3, 1), (3, 4, 2), (3, 5, 3), (3, 6, 4), (3, 7, 5), (3, 8, 6), (3, 9, 7), (3, 10, 8),

-- Course 8 (Modules 13,14,15)
(13, 1, 1), (13, 2, 2), (13, 3, 3), (13, 4, 4), (13, 5, 5), (13, 6, 6), (13, 7, 7), (13, 8, 8),
(14, 9, 1), (14, 10, 2), (14, 11, 3), (14, 12, 4), (14, 13, 5), (14, 14, 6), (14, 15, 7), (14, 16, 8),
(15, 17, 1), (15, 1, 2), (15, 2, 3), (15, 3, 4), (15, 4, 5), (15, 5, 6), (15, 6, 7), (15, 7, 8);

INSERT INTO Student_Exercise (id, student_id, exercise_id, submitted_answer, is_correct, completed_at) VALUES
(1, 1, 1, 'SELECT * FROM employees;', TRUE, '2025-04-01 10:00:00'),
(2, 1, 2, 'SELECT department, AVG(salary) FROM employees GROUP BY department;', TRUE, '2025-04-02 11:00:00'),
(3, 1, 3, 'SELECT s.name, c.course_name FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON e.course_id = c.id;', FALSE, '2025-04-03 09:30:00'),
-- 为课程2的练习添加提交记录
(4, 1, 4, 'SELECT * FROM students;', TRUE, '2025-04-04 14:00:00'),
(5, 1, 5, 'SELECT DISTINCT department_name FROM departments;', TRUE, '2025-04-05 15:00:00'),
(6, 1, 6, 'SELECT COUNT(*) FROM courses;', TRUE, '2025-04-06 16:00:00');


-- Student_Progress table
INSERT INTO Student_Progress (progress_id, student_id, course_id, completed_questions, accuracy_rate, learning_goals) VALUES
(1, 1, 1, 18, 95.50, 'normalization and indexing'),
(2, 2, 1, 15, 88.00, 'optimization'),
(3, 3, 2, 20, 92.75, 'Understand core programming concepts'),
(4, 4, 3, 12, 85.00, 'data structures'),
(5, 5, 4, 16, 90.25, 'operating systems'),
(6, 10, 5, 14, 87.50, 'principles'),
(7, 1, 7, 22, 93.00, 'computer networks');


-- Change User's profile
UPDATE Users
SET profile_info = 'Student paticipated in CS5200'
WHERE user_id = 1;

-- Remove message
DELETE FROM Message
WHERE message_id = 7;
