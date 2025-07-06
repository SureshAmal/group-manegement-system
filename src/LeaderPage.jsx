import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { ThemeToggle } from './ThemeProvider';
import { useTableScrollIndicator } from './TableScrollIndicator';
import './shadcn-modern.css';

export default function LeaderPage() {
  const { user, logout } = useAuth();
  const tableScrollRef = useTableScrollIndicator();
  const [groupMembers, setGroupMembers] = useState([]);
  const [leaderMarks, setLeaderMarks] = useState({ t1: '-', t2: '-', t3: '-' });
  const [memberMarks, setMemberMarks] = useState({});
  const [editMemberMarks, setEditMemberMarks] = useState({});
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [markTasks, setMarkTasks] = useState(['t1', 't2', 't3']);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [leaderData, setLeaderData] = useState(null);

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
        
        // Get leader data using transformed email
        const leaderDoc = await getDoc(doc(db, 'users', transformedEmail));
        if (!leaderDoc.exists()) {
          setLoading(false);
          return;
        }
        
        const leaderData = leaderDoc.data();
        setLeaderData(leaderData); // Store leader data in state
        
        if (!leaderData.groupId) {
          setLoading(false);
          return;
        }
        
        const groupDoc = await getDoc(doc(db, 'groups', leaderData.groupId));
        setGroupName(groupDoc.exists() ? groupDoc.data().name : leaderData.groupId);
        
        const usersSnap = await getDocs(collection(db, 'users'));
        const members = [];
        for (const u of usersSnap.docs) {
          const d = u.data();
          if (d.groupId === leaderData.groupId && u.id !== transformedEmail) {
            members.push({ id: u.id, ...d });
          }
        }
        setGroupMembers(members);
        
        // Get leader marks using transformed email
        const leaderMarksSnap = await getDoc(doc(db, 'tasks', transformedEmail));
        setLeaderMarks(leaderMarksSnap.exists() ? leaderMarksSnap.data() : { t1: '-', t2: '-', t3: '-' });
        
        const marksObj = {};
        const editMarksObj = {};
        for (const m of members) {
          const markSnap = await getDoc(doc(db, 'tasks', m.id));
          const memberMarks = markSnap.exists() ? markSnap.data() : { t1: '-', t2: '-', t3: '-' };
          marksObj[m.id] = memberMarks;
          editMarksObj[m.id] = memberMarks;
        }
        setMemberMarks(marksObj);
        setEditMemberMarks(editMarksObj);
      } catch (error) {
        // Handle error silently
      }
      
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Handle mark changes for members
  const handleMemberMarkChange = (memberId, task, value) => {
    setEditMemberMarks(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [task]: value
      }
    }));
  };

  // Save member marks
  const handleSaveMemberMarks = async (memberId) => {
    try {
      const markData = editMemberMarks[memberId];
      if (!markData) return;

      // Validate marks (0-10 or empty)
      for (const task of markTasks) {
        const value = markData[task];
        if (value !== "" && value !== null && value !== undefined) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            showCustomAlert(`Invalid mark for ${task.toUpperCase()}. Please enter a valid number.`, 'error');
            return;
          }
          if (numValue < 0 || numValue > 10) {
            showCustomAlert(`Marks for ${task.toUpperCase()} must be between 0 and 10.`, 'error');
            return;
          }
          // Check if it's a whole number
          if (!Number.isInteger(numValue)) {
            showCustomAlert(`Marks for ${task.toUpperCase()} must be a whole number (0-10).`, 'error');
            return;
          }
        }
      }

      // Prepare mark data
      const marksToSave = {};
      markTasks.forEach(task => {
        const value = markData[task];
        marksToSave[task] = value === "" ? null : Number(value);
      });

      // Save to Firestore
      await setDoc(doc(db, "tasks", memberId), marksToSave);
      
      // Update local state
      setMemberMarks(prev => ({
        ...prev,
        [memberId]: markData
      }));

      showCustomAlert("Member marks updated successfully", 'success');
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
        
        {/* Leader Header */}
        <div className="modern-header">
          <div className="modern-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="modern-title">Leader Dashboard</h1>
              <p className="modern-subtitle">Manage your group members and their progress</p>
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
          
          <div className="modern-card">
            <div className="modern-card-content">
              <div className="modern-text-muted" style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {user.displayName || user.email}
              </div>
              <div className="modern-text-muted">{user.email}</div>
              <div className="modern-flex modern-gap-4" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <div className="modern-badge modern-badge-primary">
                  Group: {groupName}
                </div>
                <div className="modern-badge modern-badge-secondary">
                  Roll No: {leaderData?.rollNumber || '-'}
                </div>
                <div className="modern-badge modern-badge-secondary">
                  Batch: {leaderData?.batch || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leader's Own Marks */}
        <div className="modern-card">
          <div className="modern-card-header">
            <h2 className="modern-card-title">Your Marks</h2>
          </div>
          <div className="modern-marks-grid">
            {markTasks.map((task) => (
              <div key={task} className="modern-mark-card">
                <div className="modern-mark-header">
                  <div className="modern-mark-title">{task.toUpperCase()}</div>
                  <div className="modern-mark-score">
                    <span className="modern-mark-value">{leaderMarks[task] || '-'}</span>
                    <span className="modern-mark-max">/ 10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group Members Section */}
        <div className="modern-card">
          <div className="modern-card-header">
            <h2 className="modern-card-title">Group Members & Marks</h2>
          </div>
          {groupMembers.length === 0 ? (
            <div className="modern-text-center modern-text-muted" style={{ padding: '2rem' }}>
              No group members found.
            </div>
          ) : (
            <div className="modern-table-container" ref={tableScrollRef}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roll No.</th>
                    <th>Batch</th>
                    {markTasks.map((task) => (
                      <th key={task} style={{ textAlign: 'center' }}>{task.toUpperCase()}</th>
                    ))}
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                          {member.name || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="modern-text-muted">{member.email}</div>
                      </td>
                      <td>
                        <div className="modern-text-muted">{member.rollNumber || '-'}</div>
                      </td>
                      <td>
                        <div className="modern-text-muted">{member.batch || '-'}</div>
                      </td>
                      {markTasks.map((task) => (
                        <td key={task} style={{ textAlign: 'center' }}>
                          <input
                            className="modern-input"
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            placeholder="0-10"
                            value={editMemberMarks[member.id]?.[task] !== undefined ? editMemberMarks[member.id]?.[task] : ''}
                            onChange={e => {
                              const value = e.target.value;
                              // Only allow numbers 0-10
                              if (value === '' || (Number(value) >= 0 && Number(value) <= 10 && Number.isInteger(Number(value)))) {
                                handleMemberMarkChange(member.id, task, value);
                              }
                            }}
                            onBlur={e => {
                              const value = e.target.value;
                              if (value !== '' && (Number(value) < 0 || Number(value) > 10)) {
                                e.target.value = '';
                                handleMemberMarkChange(member.id, task, '');
                              }
                            }}
                            style={{ width: '70px', textAlign: 'center' }}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="modern-btn modern-btn-success modern-btn-sm" 
                          onClick={() => handleSaveMemberMarks(member.id)}
                          title="Save marks for this member"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 