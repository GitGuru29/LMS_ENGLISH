import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { RotateCw, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api';
import Watermark from './Watermark';

// Set worker source for react-pdf v9
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Vite-specific: Import worker as a URL
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFViewer = ({ materialId, user }) => {
    const [pdfData, setPdfData] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isBlurred, setIsBlurred] = useState(false);

    useEffect(() => {
        let active = true;
        let objectUrl = null;

        const fetchPDF = async () => {
            try {
                setLoading(true);
                setError(null);
                setPdfData(null); // Clear previous

                // Fetch as blob to prevent direct URL access
                const response = await api.get(`/materials/${materialId}/stream`, {
                    responseType: 'blob',
                });

                if (!active) return;

                // Validate Content Type
                if (response.data.type !== 'application/pdf') {
                    throw new Error(`Server returned non-PDF data (${response.data.type})`);
                }

                objectUrl = URL.createObjectURL(response.data);
                console.log("PDF Blob URL created:", objectUrl);
                setPdfData(objectUrl);
            } catch (err) {
                if (!active) return;
                console.error("Failed to load PDF", err);
                setError(err.message || "Failed to load document.");
            } finally {
                if (active) setLoading(false);
            }
        };

        if (materialId) fetchPDF();

        // Privacy Blur Listeners
        const handleWindowBlur = () => setIsBlurred(true);
        const handleWindowFocus = () => setIsBlurred(false);

        // Anti-Screenshot: Detect PrintScreen Key
        const handleKeyUp = (e) => {
            // Debugging: Log key to see what browser receives
            console.log("Key Pressed:", e.key);

            if (e.key === 'PrintScreen' || e.key === 'Snapshot' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.shiftKey)) {
                e.preventDefault();
                e.stopPropagation();

                setIsBlurred(true);
                alert("Security Alert: Screenshots are disabled.");

                setTimeout(() => setIsBlurred(false), 2000);
                navigator.clipboard.writeText('');
            }
        };

        // Use capture: true to intercept before other handlers
        document.addEventListener('keyup', handleKeyUp, { capture: true });
        document.addEventListener('keydown', handleKeyUp, { capture: true });
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);

        // Cleanup
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            document.removeEventListener('keyup', handleKeyUp, { capture: true });
            document.removeEventListener('keydown', handleKeyUp, { capture: true });
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [materialId, retryCount]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    // Deterrent: Disable Right Click
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', gap: '15px' }}>
                <Loader2 className="spin" size={48} />
                <p>Loading secure document...</p>
                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', gap: '15px', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" />
                <p style={{ maxWidth: '300px' }}>{error}</p>
                <button
                    onClick={() => setRetryCount(c => c + 1)}
                    style={{ padding: '8px 16px', background: 'white', color: '#1a1a2e', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                >
                    <RotateCw size={16} /> Retry
                </button>
            </div>
        );
    }

    const watermarkText = `${user.full_name} (${user.username})`;

    return (
        <div
            className="pdf-container"
            onContextMenu={handleContextMenu}
            style={{ position: 'relative', userSelect: 'none', WebkitUserSelect: 'none' }} // Disable text selection
        >
            {/* Privacy Blur Overlay */}
            {isBlurred && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backdropFilter: 'blur(15px)', background: 'rgba(0,0,0,0.8)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', flexDirection: 'column', textAlign: 'center'
                }}>
                    <AlertCircle size={64} />
                    <h3>Security Mode Active</h3>
                    <p>Content is hidden while window is out of focus.</p>
                </div>
            )}

            <Watermark text={watermarkText} />

            <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => setError("Failed to render PDF: " + err.message)}
                loading={<div style={{ color: 'white' }}>Rendering pages...</div>}
                error={<div style={{ color: 'white' }}>Render error.</div>}
            >
                {Array.from(new Array(numPages), (el, index) => (
                    <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        renderTextLayer={false} // Disable text layer to prevent selection
                        renderAnnotationLayer={false} // Disable links
                        width={window.innerWidth > 1200 ? 1000 : window.innerWidth - 80}
                    />
                ))}
            </Document>
        </div>
    );

};

export default PDFViewer;
