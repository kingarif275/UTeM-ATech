import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useSeminars } from '../context/SeminarContext';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { MdOutlineLibraryBooks, MdOutlineSearch, MdOutlineFileDownload, MdOutlineLockOpen, MdOutlineBook } from 'react-icons/md';

const Sources = () => {
    const location = useLocation();
    const { collections, unlockCollection, getUserCollections, loadingCollections } = useSeminars();
    const query = new URLSearchParams(location.search).get('search') || '';
    const [user, setUser] = useState(null);
    const [unlockedIds, setUnlockedIds] = useState(new Set());
    const [unlockedItems, setUnlockedItems] = useState(new Map());
    const [searchQuery, setSearchQuery] = useState(query);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [priceFilter, setPriceFilter] = useState('All');
    
    // Preview modal state
    const [previewDoc, setPreviewDoc] = useState(null);

    useEffect(() => {
        document.title = "UTeM ATech - Sources & Collections";
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                getUserCollections(currentUser.uid).then(items => {
                    setUnlockedIds(new Set(items.map(item => item.id || item)));
                    setUnlockedItems(new Map(items.map(item => [item.id || item, item])));
                });
            }
        });
        return () => unsubscribe();
    }, [getUserCollections]);

    useEffect(() => {
        setSearchQuery(query);
    }, [query]);

    const handleUnlock = async (id, name, price) => {
        if (!user) {
            alert("Please log in to unlock sources.");
            return;
        }
        if (price > 0) {
            const confirmBuy = window.confirm(`Unlock "${name}" for RM ${price.toFixed(2)}?`);
            if (!confirmBuy) return;
        }
        try {
            await unlockCollection(id);
            const items = await getUserCollections(user.uid);
            setUnlockedIds(prev => {
                const next = new Set(prev);
                items.forEach(item => next.add(item.id || item));
                return next;
            });
            setUnlockedItems(new Map(items.map(item => [item.id || item, item])));
            alert(`"${name}" unlocked successfully!`);
        } catch (err) {
            alert("Failed to unlock collection: " + err.message);
        }
    };

    const categories = ["All", "Books", "Document", "Notes", "Slides", "References", "Past Year Papers"];

    // Filter collection
    const filteredCollections = collections.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesPrice = priceFilter === 'All' || 
                             (priceFilter === 'Free' && item.priceType === 'Free') || 
                             (priceFilter === 'Paid' && item.priceType === 'Paid');
        return matchesSearch && matchesCategory && matchesPrice;
    });

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ textAlign: 'left', maxWidth: '600px' }}>
                        <h1 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '12px' }}>Sources & Documents</h1>
                        <p style={{ fontSize: '18px', color: '#666666' }}>
                            Explore academic and technical resources shared by certified trainers.
                        </p>
                    </div>
                </div>

                {/* Filters Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                            <input
                                type="text"
                                placeholder="Search books, docs, notes..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '15px', fontFamily: 'inherit', outline: 'none'
                                }}
                            />
                            <MdOutlineSearch size={22} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>

                        {/* Price Filter Toggle */}
                        <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            {["All", "Free", "Paid"].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriceFilter(p)}
                                    style={{
                                        border: 'none', background: priceFilter === p ? '#ffffff' : 'transparent', color: '#111827', fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease'
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Horizontal Categories Row */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    border: 'none',
                                    background: selectedCategory === cat ? '#000000' : '#f3f4f6',
                                    color: selectedCategory === cat ? '#ffffff' : '#4b5563',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Listing Grid */}
                {loadingCollections ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                        <div style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #000000', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : filteredCollections.length === 0 ? (
                    <div style={{ padding: '80px 0', textAlign: 'center', color: '#888', background: '#f9fafb', borderRadius: '24px' }}>
                        <MdOutlineLibraryBooks size={48} color="#d1d5db" style={{ marginBottom: '12px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>No sources found</h3>
                        <p style={{ fontSize: '14px', margin: 0 }}>Try checking a different category or search term.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {filteredCollections.map(item => {
                            const isUnlocked = unlockedIds.has(item.id);
                            const unlockedItem = unlockedItems.get(item.id);
                            const displayItem = unlockedItem ? { ...item, ...unlockedItem } : item;
                            return (
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

                                    {/* Description */}
                                    <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px 0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', lineHeight: '1.5' }}>
                                        {item.description}
                                    </p>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginTop: 'auto' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>
                                            {item.price === 0 ? "Free" : `RM ${item.price.toFixed(2)}`}
                                        </span>
                                        
                                        {isUnlocked ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {/* In App View Preview */}
                                                <button
                                                    onClick={async () => {
                                                        const items = await getUserCollections(user.uid);
                                                        const unlocked = items.find(entry => (entry.id || entry) === item.id);
                                                        setPreviewDoc(unlocked ? { ...item, ...unlocked } : item);
                                                    }}
                                                    style={{ border: 'none', background: '#f3f4f6', color: '#000000', padding: '8px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                                                >
                                                    View
                                                </button>
                                                {/* External download */}
                                                {displayItem.isDownloadable && displayItem.fileUrl && (
                                                    <a
                                                        href={displayItem.fileUrl}
                                                        download={displayItem.fileName}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ background: '#000000', color: '#ffffff', padding: '8px 12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <MdOutlineFileDownload size={18} />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleUnlock(item.id, item.name, item.price)}
                                                style={{
                                                    border: 'none',
                                                    background: '#000000',
                                                    color: '#ffffff',
                                                    padding: '8px 16px',
                                                    borderRadius: '999px',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                <MdOutlineLockOpen size={16} />
                                                Unlock
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                                <li>Pricing: {previewDoc.price === 0 ? "Free" : `Paid (RM ${previewDoc.price.toFixed(2)})`}</li>
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

export default Sources;
