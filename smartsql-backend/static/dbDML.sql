
-- Users table
INSERT INTO Users (user_id, username, email, password, user_type, profile_info) VALUES
(1, 'John', '1001@northeastern.edu', 'passJohn', 'Student', 'John is a CS student.'),
(2, 'Mary', '1002@northeastern.edu', 'passMary', 'Student', 'Mary is a CS student.'),
(3, 'Peter', '1003@northeastern.edu', 'passPeter', 'Student', 'Peter is a CS student.'),
(4, 'Linda', '1004@northeastern.edu', 'passLinda', 'Student', 'Linda is a CS student.'),
(5, 'Robert', '1005@northeastern.edu', 'passRobert', 'Student', 'Robert is a a CS student.'),
(6, 'Bmith', '1006@northeastern.edu', 'passSmith', 'Instructor', 'Professor Smith, PhD.'),
(7, 'prof_jones', '1007@northeastern.edu', 'passJones', 'Instructor', 'Instructor Jones.'),
(8, 'Williams', '1008@northeastern.edu', 'passWilliams', 'Instructor', 'Instructor of research projects.'),
(9, 'Brown', '1009@northeastern.edu', 'passBrown', 'Instructor', 'TA in CS5200.'),
(10, 'Emily', '1010@northeastern.edu', 'passEmily', 'Student', 'Emily is a CS student.');


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
(10, 11, 'enrolled');

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
(12, 10, 11, 90.50, 2);

-- Message table
INSERT INTO Message (message_id, sender_id, receiver_id, message_content, timestamp) VALUES
(1, 1, 6, 'Hi Professor Lee!', '2025-01-15 10:00:00'),
(2, 2, 7, 'Dear TA, I have some questions regarding lab exercises.', '2025-01-16 11:15:00'),
(3, 3, 8, 'Hello, can you explain further about the assignment requirements?', '2025-01-17 09:45:00'),
(4, 4, 9, 'When is the next lab session?', '2025-01-18 14:30:00'),
(5, 5, 6, 'Hello, how can I submit the project', '2025-01-19 08:20:00'),
(6, 10, 7, 'sample', '2025-01-20 16:00:00'),
(7, 1, 8, 'Thank you!', '2025-01-21 12:10:00');

INSERT INTO Exercise (module_id, title, description, hint, expected_answer, difficulty, table_schema, tags, created_by)
VALUES (
    2,
    'Simple SELECT Query',
    'Write a SQL query to select all columns from the ''employees'' table.',
    'Use SELECT * FROM employees;',
    'SELECT * FROM employees;',
    'Easy',
    '[{"name": "employees", "columns": ["id", "first_name", "last_name", "department", "salary"]}]',
    'select, basics',
    6
),
(
    1,
    'Average Salary by Department',
    'Write a SQL query to calculate the average salary for each department.',
    'Use GROUP BY on the department column.',
    'SELECT department, AVG(salary) FROM employees GROUP BY department;',
    'Medium',
    '[{"name": "employees", "columns": ["id", "name", "department", "salary"]}]',
    'aggregation, group by',
    6
),
(
    3,
    'Find Students and Their Courses',
    'Write a SQL query to list student names along with the names of courses they are enrolled in.',
    'Use JOIN between students, enrollments, and courses.',
    'SELECT s.name, c.course_name 
            FROM students s
            JOIN enrollments e ON s.id = e.student_id
            JOIN courses c ON e.course_id = c.id;',
    'Medium',
    '[{"name": "students", "columns": ["id", "name"]}, {"name": "enrollments", "columns": ["id", "student_id", "course_id"]}, {"name": "courses", "columns": ["id", "course_name"]}]',
    'join, relational',
    6
);

-- Question table
INSERT INTO Question (question_id, question_text, difficulty_level, tags, created_by) VALUES
(1, 'What is normalization in database design?', 'Medium', 'database, normalization', 6),
(2, 'How does ACID property work?', 'Hard', 'transactions, ACID', 7),
(3, 'Explain the use of foreign keys.', 'Easy', 'keys, constraints', 8),
(4, 'Describe indexing and its benefits.', 'Medium', 'indexing, performance', 9),
(5, 'What is a trigger and how is it used?', 'Hard', 'triggers, procedures', 6),
(6, 'Define stored procedure and its purpose.', 'Medium', 'procedures, functions', 7),
(7, 'How do views help in database abstraction?', 'Easy', 'views, security', 8);

-- Competition table
INSERT INTO Competition (competition_id, competition_name, start_time, end_time, status, created_by) VALUES
(201, 'Database Design Challenge', '2025-02-01 09:00:00', '2025-02-01 12:00:00', 'Completed', 6),
(202, 'SQL Query Contest', '2025-02-05 10:00:00', '2025-02-05 13:00:00', 'Completed', 7),
(203, 'ER Diagram Competition', '2025-02-10 09:30:00', '2025-02-10 12:30:00', 'Ongoing', 8),
(204, 'Advanced SQL Battle', '2025-02-12 11:00:00', '2025-02-12 12:00:00', 'Completed', 9),
(205, 'Database Optimization Sprint', '2025-02-15 10:00:00', '2025-02-15 11:30:00', 'Ongoing', 6),
(206, 'Stored Procedure Showdown', '2025-02-18 14:00:00', '2025-02-18 16:00:00', 'Upcoming', 7),
(207, 'Trigger and Function Face-off', '2025-02-20 13:00:00', '2025-02-20 16:00:00', 'Upcoming', 8);

-- Competition_Participants table
INSERT INTO Competition_Participants (participant_id, competition_id, student_id, score, `rank`) VALUES
(1, 201, 1, 94.00, 1),
(2, 201, 2, 88.00, 2),
(3, 202, 3, 92.00, 1),
(4, 203, 4, 85.00, 2),
(5, 204, 5, 90.00, 2),
(6, 205, 10, 87.50, 2),
(7, 207, 1, 93.00, 1);

-- Competition_Questions table
INSERT INTO Competition_Questions (entry_id, competition_id, question_id) VALUES
(1, 201, 1),
(2, 202, 2),
(3, 203, 3),
(4, 204, 4),
(5, 205, 5),
(6, 206, 6),
(7, 207, 7);

-- Real_Time_Activity table
INSERT INTO Real_Time_Activity (activity_id, competition_id, student_id, question_id, timestamp, status) VALUES
(1, 201, 1, 1, '2025-02-01 09:15:00', 'Answered'),
(2, 202, 3, 2, '2025-02-05 10:30:00', 'Answered'),
(3, 203, 4, 3, '2025-02-10 09:45:00', 'Pending'),
(4, 204, 5, 4, '2025-02-12 11:15:00', 'Answered'),
(5, 205, 10, 5, '2025-02-15 10:15:00', 'Answered'),
(6, 206, 1, 6, '2025-02-18 14:30:00', 'Pending'),
(7, 207, 1, 7, '2025-02-20 13:30:00', 'Answered');

-- Error_Log table
INSERT INTO Error_Log (error_id, student_id, question_id, error_type, feedback) VALUES
(1, 1, 1, 'Syntax', 'Missing semicolon in query.'),
(2, 2, 2, 'Runtime', 'Null value encountered unexpectedly.'),
(3, 3, 3, 'Logic', 'Incorrect join condition.'),
(4, 4, 4, 'Syntax', 'Typo in column name.'),
(5, 5, 5, 'Runtime', 'Division by zero error.'),
(6, 10, 6, 'Logic', 'Off-by-one error in loop.'),
(7, 1, 7, 'Syntax', 'Unexpected token');

-- Knowledge_Graph table
INSERT INTO Knowledge_Graph (graph_id, student_id, weak_areas, suggestions) VALUES
(1, 1, 'Normalization, Indexing', 'Review textbook chapters on normalization and indexing.'),
(2, 2, 'Foreign Keys', 'joining tables'),
(3, 3, 'Stored Procedures', 'stored procedures.'),
(4, 4, 'Triggers', 'trigger syntax'),
(5, 5, 'Views', 'Explore use cases.'),
(6, 10, 'SQL Optimization', 'query optimization techniques.'),
(7, 1, 'Error Handling', 'triggers and procedures.');

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
