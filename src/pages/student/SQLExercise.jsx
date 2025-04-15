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
  Col,
  message,
  Empty,
  Result,
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
  TrophyOutlined,
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import apiClient from '../../services/api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const SQLExercise = () => {
  const { courseId, moduleId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [exerciseData, setExerciseData] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Define fetchExerciseDetails within the component scope
  const fetchExerciseDetails = async () => {
    if (!exerciseId) return; 

    setLoading(true);
    setUserAnswer('');

    try {
      const response = await apiClient.get(`/api/student/exercises/${exerciseId}/`);
      
      if (response.data.status === 'success') {
        let fetchedExercise = response.data.data;

        let parsedSchema = [];
        if (fetchedExercise.table_schema && typeof fetchedExercise.table_schema === 'string') {
          try {
            parsedSchema = JSON.parse(fetchedExercise.table_schema);
            if (!Array.isArray(parsedSchema)) {
              console.warn(`Parsed schema for exercise ${fetchedExercise.exercise_id} is not an array:`, parsedSchema);
              parsedSchema = [];
            }
          } catch (e) {
            console.error(`Failed to parse tableSchema for exercise ${fetchedExercise.exercise_id}:`, e);
            parsedSchema = [];
          }
        } else if (Array.isArray(fetchedExercise.table_schema)) {
          parsedSchema = fetchedExercise.table_schema;
        }
        fetchedExercise.tableSchema = parsedSchema;

        setExerciseData(fetchedExercise);
        setLastSubmission({
          completed: fetchedExercise.completed,
          is_correct: fetchedExercise.is_correct,
          score: fetchedExercise.score,
          ai_feedback: fetchedExercise.ai_feedback
        });
      } else {
        message.error(response.data.message || 'Failed to fetch exercise details');
        setExerciseData(null);
      }
    } catch (error) {
      console.error('Error fetching exercise details:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load exercise. Please check your network or try again later';
      setError(errorMsg);
      setExerciseData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Call the defined function
    fetchExerciseDetails();
  }, [exerciseId]); // Dependency array remains

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      message.warning('Please enter your SQL answer');
      return;
    }
    
    setLoading(true);
    setAiFeedback(null);
    
    try {
      const response = await apiClient.post(
        `/api/student/exercises/${exerciseId}/submit/`,
        { answer: userAnswer }
      );

      // Log the exact response data received by the frontend
      console.log('Response data received from submit API:', response.data);

      if (response.data.status === 'success') {
        const result = response.data.data;
        setAiFeedback(result);
        message.success(result.message || 'Answer submitted and evaluated by AI.');
        fetchExerciseDetails();
      } else {
        const errorMsg = response.data.message || 'Submission failed, please try again later';
        setAiFeedback({ feedback: errorMsg, is_correct: false, score: 0 });
        message.error(errorMsg);
      }
    } catch (error) {
      console.error('Error submitting SQL:', error);
      const errorMsg = error.response?.data?.message || 'An error occurred during submission. Please check your network or contact the administrator';
      setAiFeedback({ feedback: errorMsg, is_correct: false, score: 0 });
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!exerciseData) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={(
          <span>
            {error || 'Could not load exercise details.'}
          </span>
        )}
      >
        <Button type="primary" onClick={() => navigate(-1)}>Go Back</Button>
      </Empty>
    );
  }

  const { 
    title, 
    description, 
    hint, 
    difficulty, 
    tableSchema,
    module_name, 
    course_name 
  } = exerciseData;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<LeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      <Card title={
        <Space>
          <DatabaseOutlined />
          <span>{title}</span>
          <Tag color={
            difficulty === 'Easy' ? 'green' : 
            difficulty === 'Medium' ? 'blue' : 'red'
          }>
            {difficulty}
          </Tag>
          {course_name && module_name && (
            <Text type="secondary">{course_name} / {module_name}</Text>
          )}
        </Space>
      }>
        <Paragraph>{description}</Paragraph>
        
        {hint && (
          <Tooltip title="View Hint">
            <Button 
              icon={<InfoCircleOutlined />} 
              style={{ marginBottom: 16 }}
              onClick={() => {
                message.info(hint, 5);
              }}
            >
              Hint
            </Button>
          </Tooltip>
        )}

        <Divider orientation="left">Database Schema</Divider>
        <Row gutter={[16, 16]}>
          {Array.isArray(tableSchema) && tableSchema.length > 0 ? (
            tableSchema.map((table, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card 
                  size="small" 
                  title={<Text strong>{table.name}</Text>}
                  style={{ marginBottom: 16, height: '100%' }}
                  styles={{ body: { padding: '8px 12px' } }}
                >
                  {Array.isArray(table.columns) ? (
                    <ul style={{ paddingLeft: 16, margin: 0, listStyle: 'none' }}>
                      {table.columns.map((col, colIndex) => {
                        const colName = typeof col === 'string' ? col : col.name;
                        const colType = typeof col === 'string' ? '' : col.type || '';
                        return (
                          <li key={colIndex}>
                            <Space>
                              <Text code>{colName}</Text>
                              {colType && <Text type="secondary">({colType})</Text>}
                            </Space>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <Text type="secondary">No columns defined.</Text>
                  )}
                </Card>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Text type="secondary">No schema information available.</Text>
            </Col>
          )}
        </Row>

        <Divider orientation="left">Your Answer</Divider>
        <TextArea
          rows={6}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Write your SQL query here..."
          style={{ marginBottom: 16, fontFamily: 'monospace' }} 
        />
        <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSubmit} 
            loading={loading}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>
        </Space>

        {aiFeedback && (
          <Alert 
            message={<strong>Submission Result:</strong>}
            description={
              <>
                <p>Status: {aiFeedback.is_correct ? 'Correct' : 'Incorrect'} (Score: {aiFeedback.score ?? 'N/A'})</p>
                <p>Feedback: {aiFeedback.feedback}</p>
              </>
            }
            type={aiFeedback.is_correct ? 'success' : 'error'}
            showIcon
            closable
            onClose={() => setAiFeedback(null)}
            style={{ marginBottom: '15px' }}
          />
        )}
        
        {!aiFeedback && lastSubmission && lastSubmission.completed > 0 && (
          <Alert 
            message={<strong>Last Submission Status:</strong>}
            description={
              <>
                <p>Status: {lastSubmission.is_correct ? 'Correct' : 'Incorrect'} (Score: {lastSubmission.score ?? 'N/A'})</p>
                <p>Feedback: {lastSubmission.ai_feedback || 'N/A'}</p>
              </>
            }
            type={lastSubmission.is_correct ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: '15px' }}
          />
        )}

        {exerciseData.can_view_answer && (
          <div style={{ marginTop: '20px' }}>
            <Button onClick={() => setShowAnswer(!showAnswer)}>
              {showAnswer ? 'Hide Answer' : 'View Expected Answer'}
            </Button>
            {showAnswer && (
              <Card title="Expected Answer" size="small" style={{ marginTop: '10px' }}>
                {console.log('Rendering expected answer. Value:', exerciseData?.expected_answer)}
                <SyntaxHighlighter language="sql" style={oneDark}>
                  {exerciseData.expected_answer || 'No answer provided.'}
                </SyntaxHighlighter>
              </Card>
            )}
          </div>
        )}

        {submitResult && (
          <Result
            status={submitResult.correct ? "success" : "error"}
            title={submitResult.correct ? "Correct Answer" : "Incorrect Answer"}
            subTitle={submitResult.feedback}
            extra={[
              !submitResult.correct && (
                <Button type="primary" key="retry" onClick={() => setSubmitResult(null)}>
                  Try Again
                </Button>
              ),
              <Button key="back" onClick={() => navigate(-1)}>Go Back to Modules</Button>
            ]}
          />
        )}

      </Card>
    </div>
  );
};

export default SQLExercise;