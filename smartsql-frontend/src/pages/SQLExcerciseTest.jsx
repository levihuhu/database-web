import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Input,
  Button,
  Space,
  Divider,
  Table,
  Alert,
  Spin,
  Steps,
  Tooltip,
  Tag,
  Row,
  Col
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  CodeOutlined,
  SendOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { sendMessageToGPT } from '../services/getService';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

// Mock data for exercises
const exercisesData = {
  basics: [
    {
      id: 1,
      title: 'SELECT Statement Basics',
      description: 'Write a SQL query to select all columns from the "students" table.',
      hint: 'Use the * wildcard to select all columns.',
      expectedAnswer: 'SELECT * FROM students;',
      difficulty: 'Easy',
      tableSchema: [
        { name: 'students', columns: ['id', 'name', 'age', 'grade', 'email'] }
      ],
      sampleData: {
        students: [
          { id: 1, name: 'John Doe', age: 20, grade: 'A', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', age: 22, grade: 'B', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', age: 21, grade: 'A', email: 'bob@example.com' }
        ]
      }
    },
    {
      id: 2,
      title: 'Filtering with WHERE',
      description: 'Write a SQL query to select all students who have a grade of "A".',
      hint: 'Use the WHERE clause to filter results.',
      expectedAnswer: 'SELECT * FROM students WHERE grade = "A";',
      difficulty: 'Easy',
      tableSchema: [
        { name: 'students', columns: ['id', 'name', 'age', 'grade', 'email'] }
      ],
      sampleData: {
        students: [
          { id: 1, name: 'John Doe', age: 20, grade: 'A', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', age: 22, grade: 'B', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', age: 21, grade: 'A', email: 'bob@example.com' }
        ]
      }
    }
  ],
  joins: [
    {
      id: 1,
      title: 'Basic INNER JOIN',
      description: 'Write a SQL query to join the "students" and "courses" tables to show which courses each student is enrolled in.',
      hint: 'Use INNER JOIN with the enrollment_id as the common column.',
      expectedAnswer: 'SELECT students.name, courses.course_name FROM students INNER JOIN courses ON students.id = courses.student_id;',
      difficulty: 'Medium',
      tableSchema: [
        { name: 'students', columns: ['id', 'name', 'age', 'grade', 'email'] },
        { name: 'courses', columns: ['id', 'course_name', 'student_id', 'instructor'] }
      ],
      sampleData: {
        students: [
          { id: 1, name: 'John Doe', age: 20, grade: 'A', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', age: 22, grade: 'B', email: 'jane@example.com' }
        ],
        courses: [
          { id: 101, course_name: 'Database Systems', student_id: 1, instructor: 'Dr. Smith' },
          { id: 102, course_name: 'Web Development', student_id: 1, instructor: 'Prof. Johnson' },
          { id: 103, course_name: 'Data Structures', student_id: 2, instructor: 'Dr. Williams' }
        ]
      }
    }
  ]
};

const SQLExercise = () => {
  const { moduleId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (moduleId && exercisesData[moduleId]) {
      setExercises(exercisesData[moduleId]);

      // If exerciseId is provided, find that exercise
      if (exerciseId) {
        const exercise = exercisesData[moduleId].find(ex => ex.id === parseInt(exerciseId));
        if (exercise) {
          setCurrentExercise(exercise);
          setCurrentStep(exercise.id - 1);
        }
      } else if (exercisesData[moduleId].length > 0) {
        // Otherwise, use the first exercise
        setCurrentExercise(exercisesData[moduleId][0]);
        setCurrentStep(0);
      }
    }
  }, [moduleId, exerciseId]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      // Prepare the message for GPT
      const messages = [
        {
          role: 'system',
          content: `You are a SQL teacher evaluating student answers. 
                   The correct SQL query is: ${currentExercise.expectedAnswer}
                   Evaluate if the student's answer is correct. Consider variations that would produce the same result.
                   Provide feedback in JSON format with properties: "correct" (boolean), "feedback" (string), "explanation" (string).`
        },
        {
          role: 'user',
          content: `Student's SQL query: ${userAnswer}`
        }
      ];

      const response = await sendMessageToGPT(messages);

      // Parse the JSON response
      try {
        let jsonResponse;
        // Extract JSON from the response if it's wrapped in text
        const jsonMatch = response.content.match(/```json\n([\s\S]*)\n```/) ||
                         response.content.match(/{[\s\S]*}/);

        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          jsonResponse = JSON.parse(response.content);
        }

        setFeedback(jsonResponse);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        setFeedback({
          correct: false,
          feedback: 'Error evaluating your answer. Please try again.',
          explanation: 'The system encountered an error while processing your submission.'
        });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback({
        correct: false,
        feedback: 'Error communicating with the server. Please try again.',
        explanation: 'The system encountered an error while processing your submission.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const nextIndex = currentStep + 1;
    if (nextIndex < exercises.length) {
      setCurrentStep(nextIndex);
      setCurrentExercise(exercises[nextIndex]);
      setUserAnswer('');
      setFeedback(null);
      navigate(`/student/sql/${moduleId}/${exercises[nextIndex].id}`);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStep - 1;
    if (prevIndex >= 0) {
      setCurrentStep(prevIndex);
      setCurrentExercise(exercises[prevIndex]);
      setUserAnswer('');
      setFeedback(null);
      navigate(`/student/sql/${moduleId}/${exercises[prevIndex].id}`);
    }
  };

  if (!currentExercise) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          icon={<LeftOutlined />}
          onClick={() => navigate('/student/sql')}
        >
          Back to Modules
        </Button>
        <Steps
          current={currentStep}
          size="small"
          style={{ maxWidth: 600, margin: '0 auto' }}
          items={exercises.map((ex, index) => ({
            title: `Exercise ${index + 1}`,
          }))}
        />
        <div style={{ width: 100 }}></div>
      </div>

      <Card title={
        <Space>
          <DatabaseOutlined />
          <span>{currentExercise.title}</span>
          <Tag color={
            currentExercise.difficulty === 'Easy' ? 'green' :
            currentExercise.difficulty === 'Medium' ? 'blue' : 'red'
          }>
            {currentExercise.difficulty}
          </Tag>
        </Space>
      }>
        <Paragraph>{currentExercise.description}</Paragraph>

        <Tooltip title="View Hint">
          <Button
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
            onClick={() => {
              alert(currentExercise.hint);
            }}
          >
            Hint
          </Button>
        </Tooltip>

        <Divider orientation="left">Database Schema</Divider>
        <Row gutter={[16, 16]}>
          {currentExercise.tableSchema.map((table, index) => (
            <Col span={12} key={index}>
              <Card
                size="small"
                title={<Text strong>{table.name}</Text>}
                style={{ marginBottom: 16 }}
              >
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {table.columns.map((column, idx) => (
                    <li key={idx}>{column}</li>
                  ))}
                </ul>
              </Card>
            </Col>
          ))}
        </Row>

        <Divider orientation="left">Sample Data</Divider>
        {Object.entries(currentExercise.sampleData).map(([tableName, data]) => (
          <div key={tableName} style={{ marginBottom: 16 }}>
            <Text strong>{tableName}</Text>
            <Table
              dataSource={data}
              columns={
                Object.keys(data[0]).map(key => ({
                  title: key,
                  dataIndex: key,
                  key: key
                }))
              }
              size="small"
              pagination={false}
              style={{ marginTop: 8 }}
            />
          </div>
        ))}

        <Divider orientation="left">Your SQL Query</Divider>
        <TextArea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Write your SQL query here..."
          autoSize={{ minRows: 4, maxRows: 8 }}
          style={{ fontFamily: 'monospace' }}
        />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>

          <Space>
            <Button
              icon={<LeftOutlined />}
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              icon={<RightOutlined />}
              onClick={handleNext}
              disabled={currentStep === exercises.length - 1}
            >
              Next
            </Button>
          </Space>
        </div>

        {feedback && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message={
                feedback.correct ?
                <Space><TrophyOutlined /> Correct!</Space> :
                <Space><CloseCircleOutlined /> Incorrect</Space>
              }
              description={
                <div>
                  <Paragraph>{feedback.feedback}</Paragraph>
                  <Divider />
                  <Paragraph><Text strong>Explanation:</Text> {feedback.explanation}</Paragraph>
                </div>
              }
              type={feedback.correct ? "success" : "error"}
              showIcon
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default SQLExercise;