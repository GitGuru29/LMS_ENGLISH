import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import api from '../api';
import './Login.css';

// Desktop (landscape) background images
const DESKTOP_IMAGES = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592280771800-1c3a6772859d?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1510531704581-5b2870972060?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1920&auto=format&fit=crop"
];

// Mobile (portrait) background images
const MOBILE_IMAGES = [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1080&auto=format&fit=crop"
];

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Detect mobile/desktop on mount and resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Preload images
    useEffect(() => {
        const images = isMobile ? MOBILE_IMAGES : DESKTOP_IMAGES;
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, [isMobile]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData);
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);
            const userRes = await api.get('/users/me');
            onLogin(userRes.data);

        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            {/* Robust Background Image Handling */}
            <img
                src={(isMobile ? MOBILE_IMAGES : DESKTOP_IMAGES)[bgIndex]}
                alt="Background"
                className={`login-bg-image ${isImageLoaded ? 'loaded' : ''}`}
                onLoad={() => setIsImageLoaded(true)}
                onError={(e) => {
                    console.error("Image failed to load:", e.target.src);
                    e.target.style.display = 'none';
                }}
            />

            {/* Fallback Gradient (visible if image fails or loading) */}
            <div className="login-bg-fallback" />

            <div className="login-overlay" />

            <div className="login-card">
                <div className="brand-header">
                    <GraduationCap size={48} className="brand-icon" />
                    <h2>ENGLISH<br />Vijaya Dangalla</h2>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Username or Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="login-btn">
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <div className="login-footer">
                <p>© 2026 · Developed by Siluna Nusal</p>
                <span className="version">v1.0</span>
            </div>
        </div>
    );
};

export default Login;
