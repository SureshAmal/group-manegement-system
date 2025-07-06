import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ThemeToggle } from './ThemeProvider';
import { useTableScrollIndicator } from './TableScrollIndicator';
import './shadcn-modern.css';

export default function MemberPage() {
  const { user, logout } = useAuth();
  const tableScrollRef = useTableScrollIndicator();
  const [userData, setUserData] = useState(null);
  const [marks, setMarks] = useState({ t1: '-', t2: '-', t3: '-' });
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [markTasks, setMarkTasks] = useState(['t1', 't2', 't3']);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  // Custom alert function
  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch mark tasks config
        const configRef = doc(db, "config", "markTasks");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists() && Array.isArray(configSnap.data().tasks)) {
          setMarkTasks(configSnap.data().tasks);
        }
        
        // Transform email to match document ID format
        const transformedEmail = user.email.replace(/[@.]/g, "_");
        
        // Get user data using transformed email
        const userDoc = await getDoc(doc(db, 'users', transformedEmail));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }
        
        const data = userDoc.data();
        setUserData(data);
        setEditName(data.name || '');
        
        // Get group name
        if (data.groupId) {
          const groupDoc = await getDoc(doc(db, 'groups', data.groupId));
          setGroupName(groupDoc.exists() ? groupDoc.data().name : data.groupId);
        }
        
        // Get marks using transformed email
        const marksDoc = await getDoc(doc(db, 'tasks', transformedEmail));
        setMarks(marksDoc.exists() ? marksDoc.data() : { t1: '-', t2: '-', t3: '-' });
      } catch (error) {
        // Handle error silently
      }
      
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSaveName = async () => {
    try {
      if (!editName.trim()) {
        showCustomAlert("Name cannot be empty", 'error');
        return;
      }
      
      const transformedEmail = user.email.replace(/[@.]/g, "_");
      await updateDoc(doc(db, 'users', transformedEmail), { name: editName.trim() });
      setUserData(prev => ({ ...prev, name: editName.trim() }));
      setIsEditing(false);
      showCustomAlert("Name updated successfully", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="modern-root">
        <div className="modern-container">
          <div className="modern-loading">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-root">
      <div className="modern-container">
        {/* Custom Alert */}
        {showAlert && (
          <div className={`modern-alert ${alertType === 'success' ? 'modern-alert-success' : 'modern-alert-error'}`}>
            {alertMessage}
          </div>
        )}
        
        {/* Member Header */}
        <div className="modern-header">
          <div className="modern-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="modern-title">Member Dashboard</h1>
              <p className="modern-subtitle">View your information and marks</p>
            </div>
            <div className="modern-flex modern-gap-2">
              <ThemeToggle />
              <button 
                className="modern-btn modern-btn-outline" 
                onClick={logout}
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="modern-card">
          <div className="modern-card-header">
            <h2 className="modern-card-title">Your Information</h2>
          </div>
          <div className="modern-card-content">
            <div className="modern-space-y-4">
              <div>
                <label className="modern-text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Name
                </label>
                <input
                  className="modern-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="modern-text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Email
                </label>
                <div className="modern-text-muted" style={{ padding: '0.75rem', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                  {user.email}
                </div>
              </div>

              <div>
                <label className="modern-text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Roll Number
                </label>
                <div className="modern-text-muted" style={{ padding: '0.75rem', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                  {userData?.rollNumber || 'Not set'}
                </div>
              </div>

              <div>
                <label className="modern-text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Batch
                </label>
                <div className="modern-text-muted" style={{ padding: '0.75rem', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                  {userData?.batch || 'Not set'}
                </div>
              </div>

              <div>
                <label className="modern-text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Group
                </label>
                <div className="modern-text-muted" style={{ padding: '0.75rem', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                  {groupName || 'Not assigned'}
                </div>
              </div>
              
              <button 
                className="modern-btn modern-btn-primary" 
                onClick={handleSaveName}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </div>
        </div>

        {/* Marks Section */}
        <div className="modern-card">
          <div className="modern-card-header">
            <h2 className="modern-card-title">Your Marks</h2>
          </div>
          <div className="modern-marks-grid">
            {markTasks.map((task) => {
              const mark = marks[task];
              const hasMark = mark && mark !== '-' && mark !== null;
              
              return (
                <div key={task} className="modern-mark-card">
                  <div className="modern-mark-header">
                    <h3 className="modern-mark-title">{task.toUpperCase()}</h3>
                    <div className="modern-mark-score">
                      <span className="modern-mark-value">
                        {hasMark ? mark : '-'}
                      </span>
                      <span className="modern-mark-max">/10</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 