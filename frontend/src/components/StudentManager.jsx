import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit, TrendingUp } from 'lucide-react';
import api from '../api';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';
import '../pages/Dashboard.css';

const StudentManager = ({ grade }) => {
    const [students, setStudents] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, [grade]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/users', { params: { grade } });
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching students:", err);
        }
    };

    const handleRemove = async (studentId) => {
        if (window.confirm("Are you sure you want to remove this student?")) {
            try {
                await api.delete(`/admin/users/${studentId}`); // Ensure backend supports Delete if not already
                fetchStudents();
                alert("Student removed successfully!");
            } catch (err) {
                // If the delete endpoint isn't fully implemented or named differently, this might fail, 
                // but we keep the UI logic consistent.
                console.error(err);
                alert("Error removing student.");
            }
        }
    };

    const handlePromote = async () => {
        const confirmMsg = "Are you sure you want to promote ALL students to the next grade?\n\nThis will:\n- Move Grade 6 → Grade 7\n- Move Grade 7 → Grade 8\n- ... and so on up to Grade 10 → Grade 11\n- DELETE all Grade 11 students (they have graduated)\n\nThis action cannot be undone!";

        if (window.confirm(confirmMsg)) {
            try {
                const res = await api.post('/admin/promote-students');
                alert(res.data.message);
                fetchStudents(); // Refresh the list
            } catch (err) {
                console.error(err);
                alert("Error promoting students.");
            }
        }
    };

    return (
        <div>
            <div className="student-header">
                <h2 style={{ color: '#333' }}>Students (Grade {grade})</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handlePromote}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '14px',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        <TrendingUp size={18} /> Promote All Students
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="add-student-btn">
                        <UserPlus size={18} /> Add Student
                    </button>
                </div>
            </div>

            <div className="student-table-container">
                <table className="student-table">
                    <thead>
                        <tr>
                            <th>Student ID / Username</th>
                            <th>Full Name</th>
                            <th>Password</th>
                            <th>Email (Google Account)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.id} style={{ color: '#333' }}>
                                <td>{student.username}</td>
                                <td>{student.full_name}</td>
                                <td>{student.plain_password || '********'}</td>
                                <td>{student.email || '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => setEditingStudent(student)}
                                            style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
                                        >
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button onClick={() => handleRemove(student.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Trash2 size={16} /> Remove
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {students.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No students added yet.</p>}
            </div>

            {showAddModal && <AddStudentModal grade={grade} onClose={() => setShowAddModal(false)} onAdd={fetchStudents} />}

            {editingStudent && (
                <EditStudentModal
                    student={editingStudent}
                    onClose={() => setEditingStudent(null)}
                    onUpdate={fetchStudents}
                />
            )}
        </div>
    );
};

export default StudentManager;
