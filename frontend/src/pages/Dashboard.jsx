import React from 'react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';

const Dashboard = ({ user, onLogout }) => {
    // Redirect to Admin Dashboard
    if (user.role === 'admin') {
        return <AdminDashboard user={user} onLogout={onLogout} />;
    }

    // Student View
    return <StudentDashboard user={user} onLogout={onLogout} />;
};

export default Dashboard;
