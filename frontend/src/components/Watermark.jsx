import React from 'react';

const Watermark = ({ text }) => {
    // Create a diagonal repeating pattern
    const styles = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks to pass through
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        opacity: 0.15, // Faint but visible
    };

    const itemStyle = {
        transform: 'rotate(-45deg)',
        fontSize: '24px',
        width: '400px', // Wider spacing
        height: '200px', // Taller spacing
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        fontWeight: 'bold',
    };

    // Generate fewer items to cover screen without obstructing
    const items = Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={itemStyle}>
            {text}
        </div>
    ));

    return <div style={styles}>{items}</div>;
};

export default Watermark;
