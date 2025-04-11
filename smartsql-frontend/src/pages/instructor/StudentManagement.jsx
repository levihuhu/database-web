import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Typography, Table, Spin, Empty, Input, Select, Button, Space, Tag, message,Tooltip,Row,Col, Modal, InputNumber } from 'antd';
import { UserOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import { debounce } from 'lodash';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const StudentManagement = () => {
    const { courseId } = useParams(); // Optional: Get courseId from URL if filtering by course
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]); // For filter dropdown
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        courseId: courseId || null, // Pre-fill if courseId in URL
        status: null,
    });
    const [editingScoreInfo, setEditingScoreInfo] = useState(null); // { student_id, course_id, current_grade }
    const [gradeModalVisible, setGradeModalVisible] = useState(false);
    const [newGrade, setNewGrade] = useState(null);

    // Fetch courses for the filter dropdown
    const fetchCoursesForFilter = async () => {
        try {
            const res = await apiClient.get('/api/instructor/courses/');
            setCourses(res.data?.courses || []);
        } catch (error) {
            console.error('Error loading courses for filter:', error);
        }
    };

    // Fetch students based on filters
    const fetchStudents = useCallback(async (currentSearch, currentFilters) => {
        setLoading(true);
        try {
            const params = {};
            if (currentFilters.courseId) params.course_id = currentFilters.courseId;
            if (currentFilters.status) params.status = currentFilters.status;
            if (currentSearch) params.search = currentSearch;

            const res = await apiClient.get('/api/instructor/students/', { params });
            setStudents(res.data?.students || []);
        } catch (err) {
            console.error('Failed to fetch students:', err);
            message.error('Failed to load students');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoursesForFilter(); // Fetch courses for dropdown on mount
        fetchStudents(searchTerm, filters); // Fetch initial students
    }, [fetchStudents]); // Depend only on fetchStudents (which depends on nothing)

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearchTerm(value);
            fetchStudents(value, filters);
        }, 300),
        [fetchStudents, filters]
    );

    const handleSearchChange = (e) => {
        debouncedSearch(e.target.value);
    };

    // Filter change handler
    const handleFilterChange = (changedFilters) => {
        const newFilters = { ...filters, ...changedFilters };
        // If navigating here via URL param, keep that filter unless explicitly changed
        if (courseId && !changedFilters.hasOwnProperty('courseId')) {
             newFilters.courseId = courseId;
        }
        setFilters(newFilters);
        fetchStudents(searchTerm, newFilters);
    };

    const handleOpenGradeModal = (studentId, course) => {
        setEditingScoreInfo({
            student_id: studentId,
            course_id: course.course_id,
            course_name: course.course_name, // For display in modal
            current_grade: course.grade
        });
        setNewGrade(course.grade); // Pre-fill with current grade
        setGradeModalVisible(true);
    };

    const handleGradeModalCancel = () => {
        setGradeModalVisible(false);
        setEditingScoreInfo(null);
        setNewGrade(null);
    };

    const handleGradeModalOk = async () => {
        if (newGrade === null || newGrade === '' || isNaN(parseFloat(newGrade))) {
            message.error("请输入有效的成绩数字");
            return;
        }
        if (!editingScoreInfo) return;

        const payload = {
            student_id: editingScoreInfo.student_id,
            course_id: editingScoreInfo.course_id,
            grade: parseFloat(newGrade) // Ensure it's a number
        };

        // Add loading state for modal button if desired
        try {
            await apiClient.put('/api/instructor/scores/update/', payload);
            message.success(`成绩更新成功 for Course ID ${editingScoreInfo.course_id}`);
            handleGradeModalCancel();
            // Refresh student data to show the updated grade
            fetchStudents(searchTerm, filters);
        } catch (err) {
            console.error("Failed to update score:", err);
            message.error(err.response?.data?.error || "更新成绩失败");
        } finally {
             // Turn off loading state for modal button
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'user_id', key: 'user_id', width: 80 },
        {
            title: 'Name', key: 'name',
            render: (_, record) => `${record.first_name || ''} ${record.last_name || ''}`.trim() || record.username,
            sorter: (a, b) => (a.last_name || '').localeCompare(b.last_name || ''),
        },
        { title: 'Username', dataIndex: 'username', key: 'username' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Courses Taken (from You)', dataIndex: 'courses', key: 'courses', width: '40%', // Adjust width as needed
            render: (coursesList = [], record) => ( // Pass the whole student record
                <Space direction="vertical" size={2}>
                    {coursesList.map(c => {
                        let courseTagColor = 'default'; // Default grey for completed/archived/dropped etc.
                        if (c.state === 'active' && c.status === 'enrolled') {
                            courseTagColor = 'processing'; // Blue for active & enrolled
                        }

                        return (
                            <Space key={c.course_id} size={4}>
                                <Tag color={courseTagColor}>
                                    {c.course_name} ({c.year} {c.term}) - Status: {c.status} | State: {c.state}
                                </Tag>
                                <Text strong>Grade:</Text>
                                <Text>{c.grade !== null ? c.grade : 'N/A'}</Text>
                                <Tooltip title="Edit Grade">
                                    <Button
                                        icon={<EditOutlined />}
                                        size="small"
                                        type="text"
                                        onClick={() => handleOpenGradeModal(record.user_id, c)}
                                    />
                                </Tooltip>
                            </Space>
                        );
                    })}
                </Space>
            ),
        },
        {
            title: 'Actions', key: 'actions', width: 100, align: 'center',
            render: (_, record) => (
                <Tooltip title="View Profile">
                    <Link to={`/profile/${record.user_id}`}>
                        <Button icon={<EyeOutlined />} size="small" />
                    </Link>
                </Tooltip>
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
                            onChange={handleSearchChange}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Select
                            placeholder="Filter by Course"
                            allowClear
                            style={{ width: 200 }}
                            value={filters.courseId} // Control component value
                            onChange={(value) => handleFilterChange({ courseId: value })}
                            loading={courses.length === 0}
                            disabled={!!courseId} // Disable if courseId came from URL
                            showSearch
                             filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                             <Option value={null}>All My Courses</Option> {/* Add option for all */}
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
                            value={filters.status} // Control component value
                            onChange={(value) => handleFilterChange({ status: value })}
                        >
                            <Option value={null}>All Statuses</Option> {/* Add option for all */}
                            <Option value="enrolled">Enrolled</Option>
                            <Option value="completed">Completed</Option>
                             <Option value="dropped">Dropped</Option> {/* Add other relevant statuses */}
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

            {/* Grade Edit Modal */}
            <Modal
                title={`Edit Grade for ${editingScoreInfo?.course_name || ''}`}
                open={gradeModalVisible}
                onOk={handleGradeModalOk}
                onCancel={handleGradeModalCancel}
                okText="Update Grade"
                // Add confirmLoading prop to Ok button if needed
            >
                <Paragraph>
                    Student ID: {editingScoreInfo?.student_id} <br />
                    Course ID: {editingScoreInfo?.course_id} <br />
                    Current Grade: {editingScoreInfo?.current_grade ?? 'N/A'}
                </Paragraph>
                <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter new grade (e.g., 85.5)"
                    value={newGrade}
                    onChange={setNewGrade} // Directly updates state
                    min={0} // Optional: Set min/max grade
                    max={100} // Optional: Set min/max grade
                    step={0.5} // Optional: Set step
                />
            </Modal>
        </div>
    );
};

export default StudentManagement;
