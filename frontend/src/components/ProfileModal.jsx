import React, { useState } from 'react';
import { User, Lock, Save, X } from 'lucide-react';
import api from '../api';

const ProfileModal = ({ user, onClose, onLogout }) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            await api.put('/users/me', {
                username: formData.username,
                password: formData.password
            });
            alert("Profile updated successfully! Please log in again.");
            onLogout(); // Force re-login
        } catch (err) {
            console.error(err);
            alert(err.response?.data || "Update failed");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Admin Profile</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Username</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginTop: '5px', background: 'white' }}>
                            <User size={18} color="#666" />
                            <input
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: '#333' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>New Password (Optional)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginTop: '5px', background: 'white' }}>
                            <Lock size={18} color="#666" />
                            <input
                                type="password"
                                placeholder="Leave blank to keep current"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: '#333' }}
                            />
                        </div>
                    </div>

                    {formData.password && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Confirm Password</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginTop: '5px', background: 'white' }}>
                                <Lock size={18} color="#666" />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: '#333' }}
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                        <Save size={18} /> Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
