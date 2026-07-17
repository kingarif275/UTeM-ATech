import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSeminars } from '../context/SeminarContext';
import { auth, storage } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ensureUserProfile } from '../utils/userProfiles';

const FilePicker = ({ file, onChange }) => {
    const inputRef = useRef(null);

    return (
        <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
                width: '100%',
                minHeight: '96px',
                border: '2px dashed #e5e7eb',
                borderRadius: '16px',
                padding: '18px',
                textAlign: 'left',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '6px',
                fontFamily: 'inherit',
            }}
        >
            <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={event => onChange(event.target.files?.[0] || null)}
            />
            <span style={{ fontSize: '14px', color: '#111827', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file?.name || 'Choose resource file'}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>
                Supports any standard file format
            </span>
        </button>
    );
};

const PostCollection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addCollection } = useSeminars();
    
    // Parse category from query param
    const queryParams = new URLSearchParams(location.search);
    const initialCategory = queryParams.get('category') || 'Books';

    const [userAuthChecked, setUserAuthChecked] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [resourceFile, setResourceFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: initialCategory,
        priceType: 'Free',
        price: '',
        isDownloadable: true,
        onlyViewInApp: false
    });

    const coverInputRef = useRef(null);

    useEffect(() => {
        document.title = "UTeM ATech - Add Source Collection";
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/login');
            } else {
                ensureUserProfile(currentUser).then((profile) => {
                    if (profile?.isVerified === true || profile?.isAdmin === true) {
                        setUserAuthChecked(true);
                    } else {
                        alert("Only verified trainers/organizers can upload collection sources.");
                        navigate('/create');
                    }
                }).catch(() => {
                    navigate('/create');
                });
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!coverFile || !resourceFile) {
            alert("Please pick both cover image and resource file.");
            return;
        }

        setUploading(true);

        try {
            const ownerId = auth.currentUser.uid;
            // Upload Cover Image
            const coverRef = ref(storage, `collection_covers/${ownerId}/${Date.now()}_${coverFile.name}`);
            const coverSnap = await uploadBytes(coverRef, coverFile);
            const coverUrl = await getDownloadURL(coverSnap.ref);

            // Upload Resource File
            const fileRef = ref(storage, `collection_files/${ownerId}/${Date.now()}_${resourceFile.name}`);
            const fileSnap = await uploadBytes(fileRef, resourceFile);
            const fileUrl = await getDownloadURL(fileSnap.ref);

            const payload = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                coverImage: coverUrl,
                fileUrl: fileUrl,
                fileName: resourceFile.name,
                priceType: formData.priceType,
                price: formData.priceType === 'Free' ? 0 : Number(formData.price),
                isDownloadable: formData.isDownloadable,
                onlyViewInApp: formData.onlyViewInApp
            };

            await addCollection(payload);
            setUploading(false);
            alert("Source collection uploaded successfully!");
            navigate('/sources');
        } catch (err) {
            console.error("Error uploading collection:", err);
            setUploading(false);
            alert("Failed to upload collection: " + err.message);
        }
    };

    if (!userAuthChecked) return null;

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
                <div style={{ textAlign: 'left', marginBottom: '40px', maxWidth: '800px' }}>
                    <h1 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '12px' }}>Upload Collection Source</h1>
                    <p style={{ fontSize: '18px', color: '#666666' }}>
                        Publish textbooks, past papers, notes or presentation slides.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '0', background: 'transparent', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Source Name */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Source / Collection Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Advanced Operating Systems Guide"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Category</label>
                        <select
                            className="form-input"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Books">Books</option>
                            <option value="Document">Document</option>
                            <option value="Notes">Notes</option>
                            <option value="Slides">Slides</option>
                            <option value="References">References</option>
                            <option value="Past Year Papers">Past Year Papers</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            placeholder="Provide a detailed summary of what this document contains."
                            required
                            rows="4"
                            style={{ height: 'auto', resize: 'vertical' }}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Pricing */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Pricing</label>
                        <div style={{ display: 'inline-flex', background: '#f3f4f6', padding: '4px', borderRadius: '12px', border: '1px solid #e5e7eb', width: '100%', maxWidth: '240px', marginBottom: '16px', position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                top: '4px', bottom: '4px',
                                left: formData.priceType === 'Free' ? '4px' : 'calc(50%)',
                                width: 'calc(50% - 4px)',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                                transition: 'left 0.2s ease',
                                zIndex: 1
                            }} />
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, priceType: 'Free', price: '' })}
                                style={{ position: 'relative', zIndex: 2, background: 'transparent', border: 'none', width: '50%', padding: '8px 0', fontSize: '14px', fontWeight: '600', color: formData.priceType === 'Free' ? '#111827' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Free
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, priceType: 'Paid', price: '' })}
                                style={{ position: 'relative', zIndex: 2, background: 'transparent', border: 'none', width: '50%', padding: '8px 0', fontSize: '14px', fontWeight: '600', color: formData.priceType === 'Paid' ? '#111827' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Paid
                            </button>
                        </div>
                        {formData.priceType === 'Paid' && (
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>RM</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0.00"
                                    style={{ paddingLeft: '44px' }}
                                    required
                                    min="0.10"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {/* Upload Cover Art */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div>
                            <label className="form-label">Cover Image</label>
                            <div
                                onClick={() => coverInputRef.current.click()}
                                style={{
                                    border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'center', background: '#ffffff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={coverInputRef}
                                    style={{ display: 'none' }}
                                    onChange={e => { if (e.target.files?.[0]) setCoverFile(e.target.files[0]); }}
                                />
                                {coverFile ? (
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#000' }}>{coverFile.name}</span>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '14px', color: '#666' }}>Click to upload Cover Art</span>
                                        <span style={{ fontSize: '11px', color: '#999' }}>PNG, JPG or JPEG</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Upload Resource File */}
                        <div>
                            <label className="form-label">Resource File (PDF, DOCX, ZIP, etc.)</label>
                            <FilePicker file={resourceFile} onChange={setResourceFile} />
                        </div>
                    </div>

                    {/* Permissions Settings */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0' }}>Security and Permission Settings</h4>
                        
                        {/* Downloadable Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h5 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Allow External Downloads</h5>
                                <p style={{ fontSize: '12px', color: '#666666', margin: '2px 0 0 0' }}>Participants can download the file to their device storage</p>
                            </div>
                            <div 
                                onClick={() => setFormData({ ...formData, isDownloadable: !formData.isDownloadable })}
                                style={{ width: '50px', height: '26px', background: formData.isDownloadable ? '#000000' : '#e5e7eb', borderRadius: '999px', padding: '3px', cursor: 'pointer', transition: 'background-color 0.2s', position: 'relative' }}
                            >
                                <div style={{ width: '20px', height: '20px', background: '#ffffff', borderRadius: '50%', transition: 'left 0.2s', position: 'absolute', left: formData.isDownloadable ? '27px' : '3px' }} />
                            </div>
                        </div>

                        {/* View in App Only Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                            <div>
                                <h5 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>View in App Only</h5>
                                <p style={{ fontSize: '12px', color: '#666666', margin: '2px 0 0 0' }}>Restricts viewing/downloads only within mobile/web app</p>
                            </div>
                            <div 
                                onClick={() => setFormData({ ...formData, onlyViewInApp: !formData.onlyViewInApp })}
                                style={{ width: '50px', height: '26px', background: formData.onlyViewInApp ? '#000000' : '#e5e7eb', borderRadius: '999px', padding: '3px', cursor: 'pointer', transition: 'background-color 0.2s', position: 'relative' }}
                            >
                                <div style={{ width: '20px', height: '20px', background: '#ffffff', borderRadius: '50%', transition: 'left 0.2s', position: 'absolute', left: formData.onlyViewInApp ? '27px' : '3px' }} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        style={{
                            background: '#000000', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '999px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '54px', marginTop: '12px'
                        }}
                    >
                        {uploading ? (
                            <div style={{ border: '2px solid #ffffff', borderTop: '2px solid #000000', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                        ) : "Upload Collection Source"}
                    </button>
                </form>
            </div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default PostCollection;
