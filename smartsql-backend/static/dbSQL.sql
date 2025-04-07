-- ==========================
-- 1️⃣ Retrieve each student's total score, ranking, and their enrolled course details
--    This is a JOIN query that involves `Users`, `Student`, `Score`, and `Course` tables
-- ==========================
SELECT 
    u.user_id, 
    u.username, 
    c.course_name, 
    s.total_score, 
    s.rank
FROM Users u
JOIN Student st ON u.user_id = st.student_id
JOIN Score s ON st.student_id = s.student_id
JOIN Course c ON s.course_id = c.course_id
ORDER BY c.course_name, s.total_score DESC;

-- Expected Output:
-- +---------+-----------+-------------------+-------------+------+
-- | user_id | username  | course_name       | total_score | rank |
-- +---------+-----------+-------------------+-------------+------+
-- |   1     | Alice     | Database Systems  | 95.00       | 1    |
-- |   2     | Bob       | Database Systems  | 87.50       | 2    |
-- +---------+-----------+-------------------+-------------+------+

-- ==========================
-- 2️⃣ Calculate the average score for each course and display only courses with an average score > 80
--    This is a GROUP BY + HAVING query, including ORDER BY clause
-- ==========================
SELECT 
    c.course_name, 
    AVG(s.total_score) AS avg_score
FROM Score s
JOIN Course c ON s.course_id = c.course_id
GROUP BY c.course_name
HAVING AVG(s.total_score) > 80
ORDER BY avg_score DESC;

-- Expected Output:
-- +-------------------+------------+
-- | course_name       | avg_score  |
-- +-------------------+------------+
-- | Database Systems  | 91.25      |
-- | Computer Science  | 85.00      |
-- +-------------------+------------+

-- ==========================
-- 3️⃣ Retrieve students who have error logs, displaying their username, question ID, and error type
--    This is a JOIN query involving `Users`, `Student`, and `Error_Log` tables
-- ==========================
SELECT 
    u.username, 
    e.question_id, 
    e.error_type, 
    e.feedback
FROM Error_Log e
JOIN Student s ON e.student_id = s.student_id
JOIN Users u ON s.student_id = u.user_id
ORDER BY u.username, e.error_type;

-- Expected Output:
-- +-----------+-------------+------------+--------------------+
-- | username  | question_id | error_type | feedback           |
-- +-----------+-------------+------------+--------------------+
-- | Alice     | 101         | Syntax     | Missing semicolon  |
-- | Bob       | 102         | Logic      | Infinite loop      |
-- +-----------+-------------+------------+--------------------+

-- ==========================
-- 4️⃣ Count the number of students participating in each competition and list competitions with more than 3 participants
--    This is a GROUP BY + HAVING query, including ORDER BY clause
-- ==========================
SELECT 
    c.competition_name, 
    COUNT(cp.student_id) AS participants
FROM Competition_Participants cp
JOIN Competition c ON cp.competition_id = c.competition_id
GROUP BY c.competition_name
HAVING COUNT(cp.student_id) > 3
ORDER BY participants DESC;

-- Expected Output:
-- +------------------+--------------+
-- | competition_name | participants |
-- +------------------+--------------+
-- | Hackathon 2024   | 10           |
-- | Coding Battle    | 5            |
-- +------------------+--------------+

-- ==========================
-- 5️⃣ Retrieve each student's competition participation details, displaying their ranking
--    This query includes a subquery
-- ==========================
SELECT 
    u.username, 
    c.competition_name, 
    cp.score, 
    cp.rank
FROM Competition_Participants cp
JOIN Competition c ON cp.competition_id = c.competition_id
JOIN Student s ON cp.student_id = s.student_id
JOIN Users u ON s.student_id = u.user_id
WHERE cp.score = (
    SELECT MAX(cp2.score) 
    FROM Competition_Participants cp2 
    WHERE cp2.competition_id = cp.competition_id
);

-- Expected Output:
-- +-----------+------------------+-------+------+
-- | username  | competition_name | score | rank |
-- +-----------+------------------+-------+------+
-- | Alice     | Hackathon 2024    | 98.00 | 1    |
-- | Bob       | Coding Battle     | 90.00 | 1    |
-- +-----------+------------------+-------+------+