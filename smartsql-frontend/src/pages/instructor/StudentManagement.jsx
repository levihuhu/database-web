import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Typography, Table, Spin, Empty, Input, Select, Button, Space, Tag, message,Tooltip,Row,Col, Modal, InputNumber, Form } from 'antd';
import { UserOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import { debounce } from 'lodash';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const StudentManagement = () => {
    const { courseId: paramCourseId } = useParams(); // Get courseId from URL params
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]); // For filter dropdown
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filterCourseId, setFilterCourseId] = useState(paramCourseId || 'all'); // Default to URL param or 'all'
    const [filterStatus, setFilterStatus] = useState('all');
    const [editingRecord, setEditingRecord] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Fetch courses for the filter dropdown
    const fetchCourses = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/instructor/courses/');
            setCourses(res.data?.courses || []);
        } catch (error) {
            console.error('Error loading courses for filter:', error);
        }
    }, []);

    // Fetch students based on filters
    const fetchStudents = useCallback(async (search = '', courseId = 'all', status = 'all') => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (courseId !== 'all') params.append('course_id', courseId);
            if (status !== 'all') params.append('status', status);

            const url = `/api/instructor/students/?${params.toString()}`;
            console.log("Fetching students from:", url); // Log the URL with params
            const res = await apiClient.get(url);
            
            // Log the raw response data here!
            console.log("Raw API response data for students:", res.data);

            if (res.data && res.data.students) {
                const studentsWithKeys = res.data.students.map(student => ({
                    ...student,
                    key: student.user_id // Use user_id as the unique key
                }));
                setStudents(studentsWithKeys);
            } else {
                setStudents([]); // Clear students if response format is unexpected
                console.error("Unexpected response format:", res.data);
            }
        } catch (err) {
            console.error('Failed to fetch students:', err);
            message.error('Failed to load students');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
        fetchStudents(searchText, filterCourseId, filterStatus);
    }, [fetchCourses, fetchStudents, searchText, filterCourseId, filterStatus]);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearchText(value);
            fetchStudents(value, filterCourseId, filterStatus);
        }, 300),
        [fetchStudents, filterCourseId, filterStatus]
    );

    const handleSearch = (value) => {
        debouncedSearch(value);
    };

    const handleCourseFilterChange = (value) => {
        setFilterCourseId(value);
    };

    const handleStatusFilterChange = (value) => {
        setFilterStatus(value);
    };

    const showEditModal = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({ grade: record.grade });
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true); // Indicate loading state
            console.log("Updating grade for enrollment:", editingRecord.enrollment_id, "with grade:", values.grade);
            await apiClient.put(`/api/instructor/enrollments/${editingRecord.enrollment_id}/grade/`, {
                grade: values.grade,
            });
            message.success('Grade updated successfully!');
            setIsModalVisible(false);
            setEditingRecord(null);
            fetchStudents(searchText, filterCourseId, filterStatus);
        } catch (error) {
            console.error('Failed to update grade:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Failed to update grade.');
        } finally {
            setLoading(false); // Finish loading state
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingRecord(null);
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'user_id',
            key: 'user_id',
            sorter: (a, b) => a.user_id - b.user_id,
        },
        {
            title: 'Name',
            dataIndex: 'name', // Assuming the API returns 'name' (first_name + last_name)
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text, record) => `${record.first_name} ${record.last_name}` // Combine first and last name
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            sorter: (a, b) => a.username.localeCompare(b.username),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Courses Taken (from You)',
            key: 'enrollments',
            dataIndex: 'enrollments',
            render: (enrollments, record) => {
                console.log(`Enrollment data for student ${record.user_id}:`, enrollments);
                return (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {Array.isArray(enrollments) && enrollments.length > 0 ? enrollments.map((enrollment) => (
                            <div key={enrollment.enrollment_id} style={{ border: '1px solid #e8e8e8', padding: '5px', borderRadius: '4px', width: '100%' }}>
                                {/* Line 1: Course Details */}
                                <div style={{ marginBottom: '4px' }}>
                                    <Link to={`/teacher/courses/${enrollment.course_id}/modules`}>
                                        <Tag color="blue">{enrollment.course_name} ({enrollment.year} {enrollment.term === 1 ? 'Spring' : enrollment.term === 2 ? 'Summer' : 'Fall'})</Tag>
                                    </Link>
                                    <Tag>Status: {enrollment.status}</Tag>
                                    <Tag>State: {enrollment.course_state}</Tag>
                                </div>
                                {/* Line 2: Grade and Edit */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>Grade: {enrollment.grade !== null ? enrollment.grade : 'N/A'}</Text>
                                    <Tooltip title="Edit Grade">
                                        <Button
                                            icon={<EditOutlined />}
                                            size="small"
                                            onClick={() => showEditModal(enrollment)} // Pass the specific enrollment record
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        )) : <Text type="secondary">No courses enrolled.</Text>}
                    </Space>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <Space size="middle">
                    {/* Link to view student's profile or detailed progress */}
                    <Tooltip title="View Student Details">
                        <Link to={`/profile/?user_id=${record.user_id}`}>
                            <Button icon={<EyeOutlined />} size="small" />
                        </Link>
                    </Tooltip>
                    {/* Add other actions like message student if needed */}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={3}>Student Management</Title>
            <Paragraph>View students enrolled in your courses and manage grades.</Paragraph>

            {/* Toolbar: Search, Filters */}
            <Row justify="end" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Space>
                        <Input
                            placeholder="Search Students..."
                            prefix={<SearchOutlined />}
                            onSearch={handleSearch}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Select
                            placeholder="Filter by Course"
                            allowClear
                            style={{ width: 200 }}
                            value={filterCourseId}
                            onChange={handleCourseFilterChange}
                            loading={courses.length === 0}
                            disabled={!!paramCourseId}
                            showSearch
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            <Option value="all">All My Courses</Option>
                            {courses.map(course => (
                                <Option key={course.course_id} value={course.course_id}>
                                    {course.course_name} ({course.course_code})
                                </Option>
                            ))}
                        </Select>
                        <Select
                            placeholder="Filter by Status"
                            allowClear
                            style={{ width: 140 }}
                            value={filterStatus}
                            onChange={handleStatusFilterChange}
                        >
                            <Option value="all">All Statuses</Option>
                            <Option value="enrolled">Enrolled</Option>
                            <Option value="waitlisted">Waitlisted</Option>
                            <Option value="dropped">Dropped</Option>
                        </Select>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={students}
                rowKey="user_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={`Edit Grade for ${editingRecord?.course_name}`}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" name="editGradeForm">
                    <Form.Item
                        name="grade"
                        label="Grade"
                        rules={[{ required: true, message: 'Please input the grade!' }]}
                    >
                        <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default StudentManagement;
