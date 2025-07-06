// src/AdminPanel.js
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { ThemeToggle } from "./ThemeProvider";
import { useTableScrollIndicator } from "./TableScrollIndicator";
import './shadcn-modern.css';

function AdminPanel() {
  const { user, logout } = useAuth();
  const tableScrollRef = useTableScrollIndicator();
  const [users, setUsers] = useState([]);
  const [marks, setMarks] = useState({});
  const [editMarks, setEditMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [groups, setGroups] = useState([]);
  const [editGroupNames, setEditGroupNames] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editGroups, setEditGroups] = useState({});
  const [editNames, setEditNames] = useState({});
  const [editRoles, setEditRoles] = useState({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [groupName, setGroupName] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [tasks, setTasks] = useState([]);
  const [markTasks, setMarkTasks] = useState(["t1", "t2", "t3"]);
  const [newMarkTask, setNewMarkTask] = useState("");
  const [editRollNumbers, setEditRollNumbers] = useState({});
  const [editBatches, setEditBatches] = useState({});
  const [rollNumber, setRollNumber] = useState("");
  const [batch, setBatch] = useState("");

  // Custom alert function
  const showCustomAlert = (message, type = "success") => {
    setMessage(message);
    setAlertType(type);
    setShowAlert(true);

    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch mark tasks config
      const configRef = doc(db, "config", "markTasks");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists() && Array.isArray(configSnap.data().tasks)) {
        setMarkTasks(configSnap.data().tasks);
      }
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = [];
      for (const userDoc of usersSnap.docs) {
        const user = { id: userDoc.id, ...userDoc.data() };
        usersList.push(user);
      }
      setUsers(usersList);

      // Initialize edit names and roles
      const editNamesObj = {};
      const editRolesObj = {};
      const editRollNumbers = {};
      const editBatches = {};
      usersList.forEach(user => {
        editNamesObj[user.id] = user.name || '';
        editRolesObj[user.id] = user.role || 'member';
        // Add roll number and batch
        editRollNumbers[user.id] = user.rollNumber || '';
        editBatches[user.id] = user.batch || '';
      });
      setEditNames(editNamesObj);
      setEditRoles(editRolesObj);
      setEditRollNumbers(editRollNumbers);
      setEditBatches(editBatches);

      const marksObj = {};
      for (const user of usersList) {
        const markSnap = await getDoc(doc(db, "tasks", user.id));
        marksObj[user.id] = markSnap.exists()
          ? markSnap.data()
          : { t1: "", t2: "", t3: "" };
      }
      setMarks(marksObj);
      setEditMarks(marksObj);
      const groupsSnap = await getDocs(collection(db, "groups"));
      const groupsList = [];
      const editNames = {};
      const editGroupsObj = {};
      for (const groupDoc of groupsSnap.docs) {
        const group = { id: groupDoc.id, ...groupDoc.data() };
        groupsList.push(group);
        editNames[group.id] = group.name;
        editGroupsObj[group.id] = group.name;
      }
      setGroups(groupsList);
      setEditGroupNames(editNames);
      setEditGroups(editGroupsObj);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddUser = async () => {
    try {
      if (!email || !groupName || !name || !rollNumber || !batch) {
        showCustomAlert('Please fill all fields', 'error');
        return;
      }
      const fakeUID = email.replace(/[@.]/g, "_");
      // Check if group exists, if not, create it
      let groupId = groupName.trim().replace(/\s+/g, '_').toLowerCase();
      if (!groups.find(g => g.id === groupId)) {
        await setDoc(doc(db, "groups", groupId), { name: groupName });
      }
      await setDoc(doc(db, "users", fakeUID), {
        email,
        name,
        role,
        groupId,
        rollNumber,
        batch,
      });
      showCustomAlert(`User ${email} added as ${role} to ${groupName}`, 'success');
      setEmail("");
      setName("");
      setRole("member");
      setGroupName("");
      setRollNumber("");
      setBatch("");
      // Refresh users and groups
      setLoading(true);
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = [];
      for (const userDoc of usersSnap.docs) {
        const user = { id: userDoc.id, ...userDoc.data() };
        usersList.push(user);
      }
      setUsers(usersList);
      const groupsSnap = await getDocs(collection(db, "groups"));
      const groupsList = [];
      const editNames = {};
      const editGroupsObj = {};
      for (const groupDoc of groupsSnap.docs) {
        const group = { id: groupDoc.id, ...groupDoc.data() };
        groupsList.push(group);
        editNames[group.id] = group.name;
        editGroupsObj[group.id] = group.name;
      }
      setGroups(groupsList);
      setEditGroupNames(editNames);
      setEditGroups(editGroupsObj);
      setLoading(false);
    } catch (err) {
      showCustomAlert(`Error: ${err.message}`, 'error');
    }
  };

  const handleMarkChange = (userId, task, value) => {
    setEditMarks((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [task]: value },
    }));
  };

  const handleSaveMarks = async (userId) => {
    try {
      const markData = editMarks[userId];
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

      await setDoc(doc(db, "tasks", userId), marksToSave);
      showCustomAlert("Marks updated", 'success');
      setMarks((prev) => ({ ...prev, [userId]: { ...markData } }));
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleGroupChange = (userId, newGroupName) => {
    setEditGroups(prev => ({ ...prev, [userId]: newGroupName }));
  };

  const handleSaveGroup = async (userId) => {
    try {
      const newGroupName = editGroups[userId];
      if (!newGroupName.trim()) {
        showCustomAlert("Group name cannot be empty", 'error');
        return;
      }
      let groupId = newGroupName.trim().replace(/\s+/g, '_').toLowerCase();
      if (!groups.find(g => g.id === groupId)) {
        await setDoc(doc(db, "groups", groupId), { name: newGroupName });
      }
      await updateDoc(doc(db, "users", userId), { groupId });
      setUsers(users => users.map(u => u.id === userId ? { ...u, groupId } : u));
      showCustomAlert("Group updated", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleGroupNameEdit = (groupId, value) => {
    setEditGroupNames(prev => ({ ...prev, [groupId]: value }));
  };

  const handleSaveGroupName = async (groupId) => {
    try {
      await updateDoc(doc(db, "groups", groupId), { name: editGroupNames[groupId] });
      setGroups(groups => groups.map(g => g.id === groupId ? { ...g, name: editGroupNames[groupId] } : g));
      showCustomAlert("Group name updated", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleUserEdit = (userId, value) => {
    setEditNames(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { name: editNames[userId] });
      setUsers(users => users.map(u => u.id === userId ? { ...u, name: editNames[userId] } : u));
      showCustomAlert("User name updated", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleSaveRole = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: editRoles[userId] });
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: editRoles[userId] } : u));
      showCustomAlert("Role updated", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleRollNumberEdit = (userId, value) => {
    setEditRollNumbers(prev => ({ ...prev, [userId]: value }));
  };
  const handleBatchEdit = (userId, value) => {
    setEditBatches(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveRow = async (userId) => {
    try {
      // Save user name
      if (editNames[userId] !== users.find(u => u.id === userId)?.name) {
        await updateDoc(doc(db, "users", userId), { name: editNames[userId] });
      }

      // Save role
      if (editRoles[userId] !== users.find(u => u.id === userId)?.role) {
        await updateDoc(doc(db, "users", userId), { role: editRoles[userId] });
      }

      // Save group
      const newGroupName = editGroups[userId];
      if (newGroupName && newGroupName !== groups.find(g => g.id === users.find(u => u.id === userId)?.groupId)?.name) {
        let groupId = newGroupName.trim().replace(/\s+/g, '_').toLowerCase();
        if (!groups.find(g => g.id === groupId)) {
          await setDoc(doc(db, "groups", groupId), { name: newGroupName });
        }
        await updateDoc(doc(db, "users", userId), { groupId });
      }

      // Save roll number and batch
      await setDoc(doc(db, "users", userId), {
        ...users.find(u => u.id === userId),
        name: editNames[userId],
        role: editRoles[userId],
        groupId: editGroups[userId] !== undefined ? editGroups[userId] : users.find(u => u.id === userId)?.groupId,
        rollNumber: editRollNumbers[userId],
        batch: editBatches[userId],
      });

      // Save marks
      const markData = editMarks[userId];
      if (markData) {
        const marksToSave = {};
        markTasks.forEach(task => {
          const value = markData[task];
          marksToSave[task] = value === "" ? null : Number(value);
        });
        await setDoc(doc(db, "tasks", userId), marksToSave);
      }

      // Update local state
      setUsers(users => users.map(u => {
        if (u.id === userId) {
          const newGroupName = editGroups[userId];
          let groupId = u.groupId;
          if (newGroupName && newGroupName !== groups.find(g => g.id === u.groupId)?.name) {
            groupId = newGroupName.trim().replace(/\s+/g, '_').toLowerCase();
          }
          return {
            ...u,
            name: editNames[userId],
            role: editRoles[userId],
            groupId,
            rollNumber: editRollNumbers[userId],
            batch: editBatches[userId],
          };
        }
        return u;
      }));

      setMarks(prev => ({ ...prev, [userId]: markData }));
      showCustomAlert("All changes saved", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      await deleteDoc(doc(db, "tasks", userId));
      setUsers(users => users.filter(u => u.id !== userId));
      showCustomAlert("User removed", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleAddTask = async () => {
    try {
      if (!newTaskName.trim()) {
        showCustomAlert("Task name cannot be empty", 'error');
        return;
      }
      const taskId = newTaskName.trim().toLowerCase().replace(/\s+/g, '_');
      await setDoc(doc(db, "tasks", taskId), {
        name: newTaskName.trim(),
        description: newTaskDescription.trim(),
      });
      setTasks([...tasks, { id: taskId, name: newTaskName.trim(), description: newTaskDescription.trim() }]);
      setNewTaskName("");
      setNewTaskDescription("");
      showCustomAlert("Task added", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleRemoveTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTasks(tasks => tasks.filter(t => t.id !== taskId));
      showCustomAlert("Task removed", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleAddMarkTask = async () => {
    try {
      if (!newMarkTask.trim()) {
        showCustomAlert("Task name cannot be empty", 'error');
        return;
      }
      const updated = [...markTasks, newMarkTask.trim()];
      setMarkTasks(updated);
      await setDoc(doc(db, "config", "markTasks"), { tasks: updated });
      setNewMarkTask("");
      showCustomAlert("Mark task added", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  const handleRemoveMarkTask = async (task) => {
    try {
      const updated = markTasks.filter(t => t !== task);
      setMarkTasks(updated);
      await setDoc(doc(db, "config", "markTasks"), { tasks: updated });
      showCustomAlert("Mark task removed", 'success');
    } catch (err) {
      showCustomAlert("Error: " + err.message, 'error');
    }
  };

  // Transform current user's email to match document ID format
  const currentUserTransformedEmail = user?.email?.replace(/[@.]/g, "_");

  const filteredUsers = users.filter(user =>
    // Exclude the current admin user from the table
    user.id !== currentUserTransformedEmail &&
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.groupId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="modern-root">
      <div className="modern-container">
        {/* Custom Alert */}
        {showAlert && (
          <div className={`modern-alert ${alertType === 'success' ? 'modern-alert-success' : 'modern-alert-error'}`}>
            {message}
          </div>
        )}

        <div className="modern-header">
          <div className="modern-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="modern-title">Admin Dashboard</h1>
              <p className="modern-subtitle">Manage users, roles, groups, and task marks</p>
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

        <div className="modern-card">
          <div className="modern-card-header">
            <h2 className="modern-card-title">Add New User</h2>
          </div>
          <div className="modern-form-grid">
            <input
              className="modern-input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="modern-input"
              placeholder="User Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="modern-input"
              placeholder="Roll Number"
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value)}
              type="number"
              min="1"
            />
            <input
              className="modern-input"
              placeholder="Batch (e.g. bx1, bw1)"
              value={batch}
              onChange={e => setBatch(e.target.value)}
            />
            <select className="modern-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="leader">Leader</option>
            </select>
            <input
              className="modern-input"
              placeholder="Group Name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
            <button
              className="modern-btn modern-btn-primary"
              onClick={handleAddUser}
              title="Add a new user to the system"
            >
              Add User
            </button>
          </div>
        </div>

        <div className="modern-card">
          <div className="modern-card-header">
            <h2 className="modern-card-title">All Users & Marks</h2>
          </div>

          <div className="modern-space-y-4">
            <input
              className="modern-input"
              placeholder="Search users by name, email, group, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="modern-card">
              <div className="modern-card-header">
                <h3 className="modern-card-title">Manage Mark Tasks</h3>
              </div>
              <div className="modern-flex modern-gap-4" style={{ marginBottom: '1.5rem' }}>
                <input
                  className="modern-input"
                  placeholder="New Task (e.g. T4)"
                  value={newMarkTask}
                  onChange={e => setNewMarkTask(e.target.value)}
                  style={{ width: '200px' }}
                />
                <button
                  className="modern-btn modern-btn-success"
                  onClick={handleAddMarkTask}
                  title="Add a new mark task column"
                >
                  Add Task
                </button>
              </div>
              <div className="modern-task-grid">
                {markTasks.map(task => (
                  <div key={task} className="modern-task-item">
                    <span className="modern-task-label">{task.toUpperCase()}</span>
                    <button
                      className="modern-task-remove"
                      title={`Remove task ${task.toUpperCase()}`}
                      onClick={() => handleRemoveMarkTask(task)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="modern-loading">Loading users and marks...</div>
            ) : (
              <div className="modern-table-container" ref={tableScrollRef}>
                <table className="modern-table admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Roll No.</th>
                      <th>Batch</th>
                      <th>Group</th>
                      <th>Role</th>
                      {markTasks.map((task) => (
                        <th key={task}>{task.toUpperCase()}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <input
                            className="modern-input"
                            value={editNames[user.id] !== undefined ? editNames[user.id] : (user.name || '')}
                            onChange={e => handleUserEdit(user.id, e.target.value)}
                            placeholder="Enter name"
                          />
                        </td>
                        <td className="modern-text-muted">{user.email}</td>
                        <td>
                          <input
                            className="modern-input"
                            value={editRollNumbers[user.id] !== undefined ? editRollNumbers[user.id] : (user.rollNumber || '')}
                            onChange={e => handleRollNumberEdit(user.id, e.target.value)}
                            placeholder="Roll No."
                            type="number"
                            min="1"
                          />
                        </td>
                        <td>
                          <input
                            className="modern-input"
                            value={editBatches[user.id] !== undefined ? editBatches[user.id] : (user.batch || '')}
                            onChange={e => handleBatchEdit(user.id, e.target.value)}
                            placeholder="Batch (e.g. bx1, bw1)"
                          />
                        </td>
                        <td>
                          <input
                            className="modern-input"
                            value={editGroups[user.id] !== undefined ? editGroups[user.id] : (groups.find(g => g.id === user.groupId)?.name || user.groupId || '')}
                            onChange={e => handleGroupChange(user.id, e.target.value)}
                            style={{ width: '100%', minWidth: '80px' }}
                          />
                        </td>
                        <td>
                          <select
                            className="modern-select"
                            value={editRoles[user.id] !== undefined ? editRoles[user.id] : (user.role || '')}
                            onChange={e => setEditRoles(prev => ({ ...prev, [user.id]: e.target.value }))}
                            style={{ width: '100%', minWidth: '70px' }}
                          >
                            <option value="member">Member</option>
                            <option value="leader">Leader</option>
                          </select>
                        </td>
                        {markTasks.map((task) => (
                          <td key={task}>
                            <input
                              className="modern-input"
                              type="number"
                              min={0}
                              max={10}
                              step={1}
                              placeholder="0-10"
                              value={editMarks[user.id]?.[task] !== undefined && editMarks[user.id]?.[task] !== null ? editMarks[user.id]?.[task] : ''}
                              onChange={e => {
                                const value = e.target.value;
                                // Only allow numbers 0-10
                                if (value === '' || (Number(value) >= 0 && Number(value) <= 10 && Number.isInteger(Number(value)))) {
                                  handleMarkChange(user.id, task, value);
                                }
                              }}
                              onBlur={e => {
                                const value = e.target.value;
                                if (value !== '' && (Number(value) < 0 || Number(value) > 10)) {
                                  e.target.value = '';
                                  handleMarkChange(user.id, task, '');
                                }
                              }}
                              style={{ width: '70px', textAlign: 'center' }}
                            />
                          </td>
                        ))}
                        <td>
                          <div className="modern-flex modern-flex-col modern-gap-2">
                            <button
                              className="modern-btn modern-btn-primary modern-btn-sm"
                              onClick={() => handleSaveRow(user.id)}
                              title="Save all changes for this user"
                            >
                              Save
                            </button>
                            <button
                              className="modern-btn modern-btn-destructive modern-btn-sm"
                              onClick={() => handleRemoveUser(user.id)}
                              title="Delete this user permanently"
                            >
                              Remove
                            </button>
                          </div>
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
    </div>
  );
}

export default AdminPanel;
