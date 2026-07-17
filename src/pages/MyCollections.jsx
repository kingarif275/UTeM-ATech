import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useSeminars } from '../context/SeminarContext';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { MdOutlineLibraryBooks, MdOutlineFileDownload, MdOutlineBook } from 'react-icons/md';

const MyCollections = () => {
    const navigate = useNavigate();
    const { collections, getUserCollections, loadingCollections } = useSeminars();
    const [user, setUser] = useState(null);
    const [myCollections, setMyCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Preview modal state
    const [previewDoc, setPreviewDoc] = useState(null);

    useEffect(() => {
        document.title = "UTeM ATech - My Collections";
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                getUserCollections(currentUser.uid).then(items => {
                    const unlockedMap = new Map(items.map(item => [item.id || item, item]));
                    const filtered = collections
                        .filter(item => unlockedMap.has(item.id) || item.creatorId === currentUser.uid)
                        .map(item => unlockedMap.has(item.id) ? { ...item, ...unlockedMap.get(item.id) } : item);
                    setMyCollections(filtered);
                    setLoading(false);
                }).catch(() => {
                    setLoading(false);
                });
            } else {
                setLoading(false);
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [collections, getUserCollections, navigate]);

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
                <div style={{ textAlign: 'left', marginBottom: '40px', maxWidth: '600px' }}>
                    <h1 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '12px' }}>My Collections</h1>
                    <p style={{ fontSize: '18px', color: '#666666' }}>
                        Your library of academic and technical resources.
                    </p>
                </div>

                {loading || loadingCollections ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                        <div style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #000000', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : myCollections.length === 0 ? (
                    <div style={{ padding: '80px 0', textAlign: 'center', color: '#888', background: '#f9fafb', borderRadius: '24px', maxWidth: '800px', margin: '0 auto' }}>
                        <MdOutlineLibraryBooks size={48} color="#d1d5db" style={{ marginBottom: '12px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>Your library is empty</h3>
                        <p style={{ fontSize: '14px', marginBottom: '20px' }}>Unlock new sources and resources from the Sources tab.</p>
                        <button
                            onClick={() => navigate('/sources')}
                            style={{
                                background: '#000000', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                            }}
                        >
                            Browse Sources
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {myCollections.map(item => (
                            <div
                                key={item.id}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '24px',
                                    border: '1px solid #e5e7eb',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                                }}
                            >
                                {/* Cover Image */}
                                <div style={{ width: '100%', height: '200px', borderRadius: '16px', background: '#f3f4f6', overflow: 'hidden', position: 'relative', marginBottom: '16px' }}>
                                    {item.coverImage ? (
                                        <img src={item.coverImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                                            <MdOutlineBook size={48} />
                                        </div>
                                    )}
                                    <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(255, 255, 255, 0.9)', color: '#000000', padding: '4px 10px', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                                        {item.category}
                                    </span>
                                </div>

                                {/* Title and Creator */}
                                <h3 style={{ fontSize: '17px', fontWeight: '700', margin: '0 0 4px 0', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                                    {item.name}
                                </h3>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>
                                    Uploaded by: <span style={{ fontWeight: '600' }}>{item.creatorName}</span>
                                </p>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                                        {item.creatorId === user?.uid ? "Your Upload" : "Unlocked"}
                                    </span>
                                    
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {/* In App View Preview */}
                                        <button
                                            onClick={() => setPreviewDoc(item)}
                                            style={{ border: 'none', background: '#f3f4f6', color: '#000000', padding: '8px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                                        >
                                            View
                                        </button>
                                        {/* External download */}
                                        {item.isDownloadable && (
                                            <a
                                                href={item.fileUrl}
                                                download={item.fileName}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ background: '#000000', color: '#ffffff', padding: '8px 12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <MdOutlineFileDownload size={18} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Document Preview Modal */}
            {previewDoc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '700px', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: '700', background: '#f3f4f6', color: '#000', padding: '4px 10px', borderRadius: '999px' }}>{previewDoc.category}</span>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', marginTop: '8px', marginBottom: '2px' }}>{previewDoc.name}</h3>
                                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Uploaded by {previewDoc.creatorName}</p>
                            </div>
                            <button onClick={() => setPreviewDoc(null)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9fafb', borderRadius: '16px', border: '1px solid #f3f4f6', marginBottom: '20px', fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                            <p style={{ fontWeight: 'bold' }}>Description:</p>
                            <p style={{ whiteSpace: 'pre-wrap', marginBottom: '24px' }}>{previewDoc.description}</p>
                            
                            <p style={{ fontWeight: 'bold' }}>Document Metadata:</p>
                            <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px' }}>
                                <li>File Name: {previewDoc.fileName}</li>
                                <li>Published: {new Date(previewDoc.postedAt).toLocaleDateString('en-GB')}</li>
                                <li>In-App Viewing: Enabled</li>
                                <li>Direct Download: {previewDoc.isDownloadable ? "Allowed" : "Restricted"}</li>
                            </ul>

                            <div style={{ textAlign: 'center', padding: '24px 16px', background: '#ffffff', borderRadius: '12px', border: '1.5px dashed #e5e7eb' }}>
                                <p style={{ fontWeight: '600', margin: '0 0 12px 0' }}>Preview Document File</p>
                                <a
                                    href={previewDoc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#000000', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: '700'
                                    }}
                                >
                                    <MdOutlineFileDownload size={18} />
                                    Open File Attachment
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => setPreviewDoc(null)}
                            style={{
                                background: '#f3f4f6', color: '#000', border: 'none', padding: '14px', borderRadius: '999px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                            }}
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCollections;
