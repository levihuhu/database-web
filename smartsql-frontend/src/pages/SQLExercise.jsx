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
  message
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
import apiClient from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const SQLExercise = () => {
  const { moduleId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const fetchAndSetExercises = async () => {
      if (!exerciseId) return;

      setLoading(true);
      try {
        const response = await apiClient.get(`/api/instructorexercises/?exercise_id=${exerciseId}`);
        let fetchedExercises = response.data?.exercises || response.data || [];

        fetchedExercises = fetchedExercises.map(ex => {
          let parsedSchema = [];
          if (ex.tableSchema && typeof ex.tableSchema === 'string') {
            try {
              parsedSchema = JSON.parse(ex.tableSchema);
              if (!Array.isArray(parsedSchema)) {
                console.warn(`Parsed schema for exercise ${ex.id} is not an array:`, parsedSchema);
                parsedSchema = [];
              }
            } catch (e) {
              console.error(`Failed to parse tableSchema for exercise ${ex.id}:`, e);
              parsedSchema = [];
            }
          } else if (Array.isArray(ex.tableSchema)) {
            parsedSchema = ex.tableSchema;
          }
          return { ...ex, tableSchema: parsedSchema };
        });

        if (fetchedExercises.length > 0) {
          setExercises(fetchedExercises);
          
          let exerciseToShow = null;
          let stepIndex = 0;

          if (exerciseId) {
            const foundIndex = fetchedExercises.findIndex(ex => String(ex.id) === exerciseId);
            if (foundIndex !== -1) {
              exerciseToShow = fetchedExercises[foundIndex];
              stepIndex = foundIndex;
            }
          } 
          
          if (!exerciseToShow) {
            exerciseToShow = fetchedExercises[0];
            stepIndex = 0;
          }

          setCurrentExercise(exerciseToShow);
          setCurrentStep(stepIndex);
          setUserAnswer('');
          setFeedback(null);

        } else {
          setExercises([]);
          setCurrentExercise(null);
          setCurrentStep(0);
          message.info('该模块下暂无练习');
        }

      } catch (error) {
        console.error('Failed to fetch exercises:', error);
        message.error('加载练习失败，请稍后重试');
        setExercises([]);
        setCurrentExercise(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetExercises();
  }, [moduleId, exerciseId, navigate]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;
    
    setLoading(true);
    setFeedback(null);
    
    try {
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
      
      try {
        let jsonResponse;
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

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!currentExercise) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>该模块下暂无练习或加载失败。</div>;
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
            title: ex.title ? `Exercise ${index + 1}: ${ex.title.substring(0,15)}...` : `Exercise ${index + 1}`,
            key: ex.id
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
          {Array.isArray(currentExercise.tableSchema) && currentExercise.tableSchema.map((table, index) => (
            <Col span={12} key={index}>
              <Card 
                size="small" 
                title={<Text strong>{table.name}</Text>}
                style={{ marginBottom: 16 }}
              >
                {Array.isArray(table.columns) ? (
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {table.columns.map((column, idx) => (
                      <li key={idx}>{column}</li>
                    ))}
                  </ul>
                ) : <Text type="secondary">No columns defined.</Text> }
              </Card>
            </Col>
          ))}
          {(!Array.isArray(currentExercise.tableSchema) || currentExercise.tableSchema.length === 0) && (
            <Col span={24}><Text type="secondary">No schema information available for this exercise.</Text></Col>
          )}
        </Row>

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