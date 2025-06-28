import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Container, Paper, Grid, Button, CircularProgress,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, TextField, Link as MuiLink,
  Tabs, Tab, Chip
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';



export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Tab state for different sections
  const [currentTab, setCurrentTab] = useState(0);

  // Data states for different sections
  const [therapistApplications, setTherapistApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null); 

  // Modals specific to applications
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false); 

  // Modals for user/session details
  const [openUserDetailsModal, setOpenUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetching functions for each data type
  const fetchTherapistApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/admin/therapist-applications/', { headers: { Authorization: `Bearer ${token}` } });
      setTherapistApplications(response.data);
    } catch (err) {
      console.error("Error fetching therapist applications:", err.response?.data || err);
      setError("Failed to load therapist applications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/admin/users/', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err);
      setError("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/admin/sessions/', { headers: { Authorization: `Bearer ${token}` } });
      setSessions(response.data);
    } catch (err) {
      console.error("Error fetching sessions:", err.response?.data || err);
      setError("Failed to load session data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchJournalEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/admin/journal-entries/', { headers: { Authorization: `Bearer ${token}` } });
      setJournalEntries(response.data);
    } catch (err) {
      console.error("Error fetching journal entries:", err.response?.data || err);
      setError("Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAnalyticsData = useCallback(async () => {

    setAnalyticsData(null); 
    setLoading(false);
  }, []);


  useEffect(() => {
    const pathToTabMap = {
      '/admin/applications': 0,
      '/admin/users': 1,
      '/admin/sessions': 2,
      '/admin/journals': 3, 
      '/admin/analytics': 4,
      '/admin': 0 
    };

    const currentPath = location.pathname;
    const tabIndex = pathToTabMap[currentPath];
    if (tabIndex !== undefined && tabIndex !== currentTab) {
      setCurrentTab(tabIndex);
    }
  }, [location.pathname, currentTab]);

  useEffect(() => {
    if (!authLoading && user && user.is_staff && user.is_superuser) {
      // Fetch data based on the current tab
      if (currentTab === 0) {
        fetchTherapistApplications();
      } else if (currentTab === 1) {
        fetchUsers();
      } else if (currentTab === 2) {
        fetchSessions();
      } else if (currentTab === 3) {
        fetchJournalEntries();
      } else if (currentTab === 4) {
        fetchAnalyticsData();
      }
    } else if (!authLoading && (!user || !user.is_staff || !user.is_superuser)) {
      setError("Access Denied: You must be an administrator to view this page.");
      setLoading(false);
    }
  }, [user, token, authLoading, currentTab, fetchTherapistApplications, fetchUsers, fetchSessions, fetchJournalEntries, fetchAnalyticsData]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Optionally, update the URL to match the tab change for direct linking
    const tabToPathMap = {
      0: '/admin/applications',
      1: '/admin/users',
      2: '/admin/sessions',
      3: '/admin/journals',
      4: '/admin/analytics'
    };
    navigate(tabToPathMap[newValue]);
    setError(null); 
  };

  // Snackbar and Modal Handlers
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleOpenReviewModal = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setReviewerNotes(application.reviewer_notes || '');
    setOpenReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setOpenReviewModal(false);
    setSelectedApplication(null);
    setNewStatus('');
    setReviewerNotes('');
  };

  const handleSaveReview = async () => {
    if (!selectedApplication) return;
    setSubmitting(true);
    try {
      await axios.patch(`http://localhost:8000/api/admin/therapist-applications/${selectedApplication.id}/`,
        { status: newStatus, reviewer_notes: reviewerNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbarMessage('Application updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseReviewModal();
      fetchTherapistApplications(); // Refresh the list
    } catch (err) {
      console.error("Error updating application:", err.response?.data || err);
      setSnackbarMessage(err.response?.data?.detail || "Failed to update application.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };


  // New: Handle User Details Modals
  const handleOpenUserDetailsModal = (userData) => {
    setSelectedUser(userData);
    setOpenUserDetailsModal(true);
  };
  const handleCloseUserDetailsModal = () => {
    setSelectedUser(null);
    setOpenUserDetailsModal(false);
  };

  // Conditional rendering for loading and access denied
  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading admin dashboard...</Typography>
      </Box>
    );
  }

  if (!user || !user.is_staff || !user.is_superuser) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Access Denied: You must be an administrator to view this page.
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please log in with an administrator account.
        </Typography>
        <Button component={Link} to="/login" variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ color: '#780000', mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
          MindWell Admin Dashboard
        </Typography>

       

        {/* Tab Panel for Therapist Applications */}
        {currentTab === 0 && (
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: '#780000', mb: 3, fontWeight: 'bold' }}>
              Therapist Applications
            </Typography>
            {error ? (
              <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>{error}</Typography>
            ) : therapistApplications.length === 0 ? (
              <Typography variant="h6" sx={{ textAlign: 'center', color: '#780000', mt: 2 }}>
                No therapist applications found.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Applicant Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Submitted At</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {therapistApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{app.applicant_full_name}</TableCell>
                        <TableCell>{app.applicant_email}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 'bold', color: app.status === 'pending' ? 'orange' : app.status === 'approved' ? 'green' : 'red' }}>
                          {app.status}
                        </TableCell>
                        <TableCell>{new Date(app.submitted_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
                            onClick={() => handleOpenReviewModal(app)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* Tab Panel for User Management */}
        {currentTab === 1 && (
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: '#780000', mb: 3, fontWeight: 'bold' }}>
              User Management
            </Typography>
            {error ? (
                <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>{error}</Typography>
            ) : users.length === 0 ? (
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#780000', mt: 2 }}>No users found.</Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Verified</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.first_name} {u.last_name}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={u.is_superuser ? 'Admin' : (u.is_therapist ? 'Therapist' : 'User')} 
                                        size="small" 
                                        color={u.is_superuser ? 'secondary' : (u.is_therapist ? 'primary' : 'default')}
                                      />
                                    </TableCell>
                                    <TableCell>{u.is_verified ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        <Button 
                                          size="small" 
                                          variant="outlined"
                                          sx={{ borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
                                          onClick={() => handleOpenUserDetailsModal(u)}
                                        >
                                          View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
          </Paper>
        )}

        {/* Tab Panel for Sessions */}
        {currentTab === 2 && (
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: '#780000', mb: 3, fontWeight: 'bold' }}>
              All Sessions
            </Typography>
            {error ? (
                <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>{error}</Typography>
            ) : sessions.length === 0 ? (
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#780000', mt: 2 }}>No sessions found.</Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Client</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Therapist</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Duration (min)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Type</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sessions.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{s.client_name}</TableCell>
                                    <TableCell>{s.therapist_name}</TableCell>
                                    <TableCell>{s.session_date}</TableCell>
                                    <TableCell>{s.session_time}</TableCell>
                                    <TableCell> {s.duration_minutes} </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={s.status.charAt(0).toUpperCase() + s.status.slice(1)} 
                                        size="small" 
                                        color={s.status === 'completed' ? 'success' : 'info'}
                                      />
                                    </TableCell>
                                    <TableCell>{s.session_type}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
          </Paper>
        )}

        {/* Tab Panel for Journal Entries */}
        {currentTab === 3 && (
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: '#780000', mb: 3, fontWeight: 'bold' }}>
              All Journal Entries
            </Typography>
            {error ? (
                <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>{error}</Typography>
            ) : journalEntries.length === 0 ? (
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#780000', mt: 2 }}>No journal entries found.</Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>User Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Mood</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Entry Summary</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Tags</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {journalEntries.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.user_email || entry.user}</TableCell> {/* Use user_email if available, otherwise user ID */}
                                    <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                                    <TableCell>{entry.mood}</TableCell>
                                    <TableCell>{entry.entry.substring(0, 70)}{entry.entry.length > 70 ? '...' : ''}</TableCell>
                                    <TableCell>
                                        {entry.tags && entry.tags.length > 0 ? (
                                            entry.tags.map((tag, idx) => (
                                                <Chip key={idx} label={tag} size="small" sx={{ mr: 0.5, bgcolor: '#DCC8C8', color: '#333' }} />
                                            ))
                                        ) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
          </Paper>
        )}

        {/* Tab Panel for Analytics */}
        {currentTab === 4 && (
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: '#780000', mb: 3, fontWeight: 'bold' }}>
              Website Analytics
            </Typography>
            <Typography>
              This section will display various graphs and detailed statistics related to user activity, session trends, mood patterns, and more once the analytics endpoints are implemented in the backend.
            </Typography>
            
          </Paper>
        )}

        {/* Snackbar for feedback */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Review Application Modal */}
        <Dialog open={openReviewModal} onClose={handleCloseReviewModal} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>Review Therapist Application</DialogTitle>
            <DialogContent dividers>
                {selectedApplication && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 1, color: '#780000' }}>Applicant: {selectedApplication.applicant_full_name}</Typography>
                        <Typography variant="body2"><strong>Email:</strong> {selectedApplication.applicant_email}</Typography>
                        <Typography variant="body2"><strong>License Number:</strong> {selectedApplication.license_number}</Typography>
                        <Typography variant="body2"><strong>ID Number:</strong> {selectedApplication.id_number}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Motivation:</strong> {selectedApplication.motivation_statement}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Specializations:</strong> {selectedApplication.specializations}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Years of Experience:</strong> {selectedApplication.years_of_experience}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>License Credentials:</strong> {selectedApplication.license_credentials}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Approach/Modalities:</strong> {selectedApplication.approach_modalities}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Languages Spoken:</strong> {selectedApplication.languages_spoken}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Client Focus:</strong> {selectedApplication.client_focus}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Insurance Accepted:</strong> {selectedApplication.insurance_accepted ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Free Consultation:</strong> {selectedApplication.is_free_consultation ? 'Yes' : 'No'}</Typography>
                        {!selectedApplication.is_free_consultation && selectedApplication.hourly_rate && (
                            <Typography variant="body2" sx={{ mt: 1 }}><strong>Hourly Rate:</strong> Ksh {parseFloat(selectedApplication.hourly_rate).toFixed(2)}</Typography>
                        )}
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Session Modes:</strong> {selectedApplication.session_modes}</Typography>
                        {selectedApplication.physical_address && (
                            <Typography variant="body2" sx={{ mt: 1 }}><strong>Physical Address:</strong> {selectedApplication.physical_address}</Typography>
                        )}


                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>License Document:</strong>{' '}
                            {selectedApplication.license_document ? (
                                <MuiLink href={selectedApplication.license_document} target="_blank" rel="noopener">View Document</MuiLink>
                            ) : 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            <strong>ID Document:</strong>{' '}
                            {selectedApplication.id_document ? (
                                <MuiLink href={selectedApplication.id_document} target="_blank" rel="noopener">View Document</MuiLink>
                            ) : 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Professional Photo:</strong>{' '}
                            {selectedApplication.professional_photo ? (
                                <MuiLink href={selectedApplication.professional_photo} target="_blank" rel="noopener">View Photo</MuiLink>
                            ) : 'N/A'}
                        </Typography>


                        <FormControl fullWidth sx={{ mt: 3, mb: 2 }}>
                            <InputLabel>Application Status</InputLabel>
                            <Select
                                value={newStatus}
                                label="Application Status"
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <MenuItem value="pending">Pending Review</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Reviewer Notes (Optional)"
                            multiline
                            rows={3}
                            value={reviewerNotes}
                            onChange={(e) => setReviewerNotes(e.target.value)}
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseReviewModal} sx={{ color: '#780000' }}>Cancel</Button>
                <Button onClick={handleSaveReview} variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }} disabled={submitting}>
                    {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save Review'}
                </Button>
            </DialogActions>
        </Dialog>

        {/* New: User Details/Edit Modal */}
        <Dialog open={openUserDetailsModal} onClose={handleCloseUserDetailsModal} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>User Details</DialogTitle>
            <DialogContent dividers>
                {selectedUser && (
                    <Box>
                        <Typography variant="body1"><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</Typography>
                        <Typography variant="body1"><strong>Email:</strong> {selectedUser.email}</Typography>
                        <Typography variant="body1"><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</Typography>
                        <Typography variant="body1"><strong>Is Therapist:</strong> {selectedUser.is_therapist ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body1"><strong>Is Verified:</strong> {selectedUser.is_verified ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body1"><strong>Is Staff:</strong> {selectedUser.is_staff ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body1"><strong>Is Superuser:</strong> {selectedUser.is_superuser ? 'Yes' : 'No'}</Typography>
                        {selectedUser.is_therapist && (
                            <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                                <Typography variant="h6" sx={{ color: '#780000', mb: 1 }}>Therapist Details</Typography>
                                <Typography variant="body2"><strong>Bio:</strong> {selectedUser.bio || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Years of Experience:</strong> {selectedUser.years_of_experience || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Specializations:</strong> {selectedUser.specializations || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Hourly Rate:</strong> {selectedUser.hourly_rate ? `Ksh ${parseFloat(selectedUser.hourly_rate).toFixed(2)}` : 'N/A'}</Typography>
                                <Typography variant="body2"><strong>License Credentials:</strong> {selectedUser.license_credentials || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Approach Modalities:</strong> {selectedUser.approach_modalities || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Languages Spoken:</strong> {selectedUser.languages_spoken || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Client Focus:</strong> {selectedUser.client_focus || 'N/A'}</Typography>
                                <Typography variant="body2"><strong>Insurance Accepted:</strong> {selectedUser.insurance_accepted ? 'Yes' : 'No'}</Typography>
                                <Typography variant="body2"><strong>Free Consultation:</strong> {selectedUser.is_free_consultation ? 'Yes' : 'No'}</Typography>
                                <Typography variant="body2"><strong>Session Modes:</strong> {selectedUser.session_modes || 'N/A'}</Typography>
                                {selectedUser.physical_address && <Typography variant="body2"><strong>Physical Address:</strong> {selectedUser.physical_address}</Typography>}
                                {selectedUser.profile_picture && <Typography variant="body2"><strong>Profile Picture:</strong> <MuiLink href={selectedUser.profile_picture} target="_blank" rel="noopener">View</MuiLink></Typography>}

                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseUserDetailsModal} sx={{ color: '#780000' }}>Close</Button>
               
            </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
}