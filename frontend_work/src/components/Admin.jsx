// File: frontend_work/src/components/Admin.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Link as MuiLink,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack, // Added Stack import here
  // Removed Tabs and Tab imports as they are no longer needed
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format }  from "date-fns";

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Tab state for different sections - CurrentTab will still manage which content is shown
  const [currentTab, setCurrentTab] = useState(0);

  // Data states for different sections
  const [therapistApplications, setTherapistApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]); // Keep for analytics count
  const [payments, setPayments] = useState([]); // New state for payments

  // Initialize analyticsData with default empty arrays to prevent undefined errors
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalTherapists: 0,
    sessionData: [],
    moodData: [],
    totalRevenue: 0, // Merged back to single totalRevenue
    totalAllPayments: 0,
    revenueTrendData: [],
    sessionTypeData: [],
  });

  // Modals specific to applications
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modals for user/session details
  const [openUserDetailsModal, setOpenUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Theme colors for charts
  const primaryColor = "#780000";
  const secondaryColor = "#b56576";
  const tertiaryColor = "#6d597a";
  const accentColor = "#e7a042";
  const neutralBg = "#fefae0";

  // Fetching functions for each data type
  const fetchTherapistApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:8000/api/admin/therapist-applications/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTherapistApplications(response.data);
    } catch (err) {
      console.error(
        "Error fetching therapist applications:",
        err.response?.data || err
      );
      setError("Failed to load therapist applications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:8000/api/admin/users/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      const response = await axios.get(
        "http://localhost:8000/api/admin/sessions/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(response.data);
    } catch (err) {
      console.error("Error fetching sessions:", err.response?.data || err);
      setError("Failed to load session data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Keep fetchJournalEntries for analytics data, but it won't be displayed in a separate tab
  const fetchJournalEntries = useCallback(async () => {
    try {
      // No setLoading(true) here as it's part of fetchAnalyticsData
      const response = await axios.get(
        "http://localhost:8000/api/admin/journal-entries/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJournalEntries(response.data);
      return response.data; // Return data for use in fetchAnalyticsData
    } catch (err) {
      console.error(
        "Error fetching journal entries for analytics:",
        err.response?.data || err
      );
      // Don't set global error here, as analytics might still load other data
      return []; // Return empty array on error
    }
  }, [token]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:8000/api/admin/payments/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayments(response.data);
    } catch (err) {
      console.error("Error fetching payments:", err.response?.data || err);
      setError("Failed to load payment data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, sessionsRes, journalsData, paymentsRes] = // Changed journalsRes to journalsData
        await Promise.all([
          axios.get("http://localhost:8000/api/admin/users/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/admin/sessions/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // Call fetchJournalEntries directly here to ensure data is fetched
          fetchJournalEntries(), // This calls the function, which returns a Promise
          axios.get("http://localhost:8000/api/admin/payments/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const allUsers = usersRes.data;
      const allSessions = sessionsRes.data;
      const allJournalEntries = journalsData; // Removed .data here
      const allPayments = paymentsRes.data;

      const totalUsers = allUsers.length;
      const totalTherapists = allUsers.filter((u) => u.is_therapist).length;

      const sessionStatusCounts = allSessions.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {});

      const sessionData = Object.keys(sessionStatusCounts).map((status) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        count: sessionStatusCounts[status],
      }));

      const moodCounts = allJournalEntries.reduce((acc, entry) => {
        if (entry.mood) {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        }
        return acc;
      }, {});

      const moodData = Object.keys(moodCounts).map((mood) => ({
        name: mood.charAt(0).toUpperCase() + mood.slice(1),
        count: moodCounts[mood],
      }));

      let totalRevenue = 0;
      let paidSessionsCount = 0;
      let freeSessionsCount = 0;
      const monthlyRevenue = {};

      allSessions.forEach((session) => {
        if (session.session_request_is_paid) {
          paidSessionsCount++;
        } else {
          freeSessionsCount++;
        }
      });

      // Reverted to sum both completed and pending for Total Revenue, as per request
      allPayments
        .filter((p) => p.status === "completed" || p.status === "pending")
        .forEach((payment) => {
          totalRevenue += parseFloat(payment.amount);
          const monthYear = format(new Date(payment.payment_date), "yyyy-MM");
          monthlyRevenue[monthYear] =
            (monthlyRevenue[monthYear] || 0) + parseFloat(payment.amount);
        });

      const totalAllPayments = allPayments.length;

      const revenueTrendData = Object.keys(monthlyRevenue)
        .sort()
        .map((month) => ({
          name: format(new Date(month + "-01"), "MMM 'McFarland'"),
          Revenue: monthlyRevenue[month],
        }));

      const sessionTypeData = [
        {
          name: "Paid Sessions",
          value: paidSessionsCount,
          color: primaryColor,
        },
        {
          name: "Free Sessions",
          value: freeSessionsCount,
          color: secondaryColor,
        },
      ];

      setAnalyticsData({
        totalUsers,
        totalTherapists,
        sessionData,
        moodData,
        totalRevenue, // Single totalRevenue field
        totalAllPayments,
        revenueTrendData,
        sessionTypeData,
      });
    } catch (err) {
      console.error(
        "Error fetching analytics data:",
        err.response?.data || err
      );
      setError("Failed to load analytics data.");
      setAnalyticsData({
        totalUsers: 0,
        totalTherapists: 0,
        sessionData: [],
        moodData: [],
        totalRevenue: 0,
        totalAllPayments: 0,
        revenueTrendData: [],
        sessionTypeData: [],
      });
    } finally {
      setLoading(false);
    }
  }, [token, fetchJournalEntries]); // Added fetchJournalEntries to dependencies

  useEffect(() => {
    // Updated pathToTabMap to remove /admin/journals (index 3)
    const pathToTabMap = {
      "/admin/applications": 0,
      "/admin/users": 1,
      "/admin/sessions": 2,
      "/admin/analytics": 3, // Analytics is now tab 3
      "/admin": 0,
    };

    const currentPath = location.pathname;
    const tabIndex = pathToTabMap[currentPath];
    if (tabIndex !== undefined && tabIndex !== currentTab) {
      setCurrentTab(tabIndex);
    }
  }, [location.pathname, currentTab]);

  useEffect(() => {
    if (!authLoading && user && user.is_staff && user.is_superuser) {
      if (currentTab === 0) {
        fetchTherapistApplications();
      } else if (currentTab === 1) {
        fetchUsers();
      } else if (currentTab === 2) {
        fetchSessions();
      } else if (currentTab === 3) { // Analytics is now tab 3
        fetchAnalyticsData();
      }
      // No explicit fetch for journal entries tab anymore
    } else if (
      !authLoading &&
      (!user || !user.is_staff || !user.is_superuser)
    ) {
      setError(
        "Access Denied: You must be an administrator to view this page."
      );
      setLoading(false);
    }
  }, [
    user,
    token,
    authLoading,
    currentTab,
    fetchTherapistApplications,
    fetchUsers,
    fetchSessions,
    fetchAnalyticsData,
  ]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Updated tabToPathMap to remove /admin/journals (index 3)
    const tabToPathMap = {
      0: "/admin/applications",
      1: "/admin/users",
      2: "/admin/sessions",
      3: "/admin/analytics", // Analytics is now tab 3
    };
    navigate(tabToPathMap[newValue]);
    setError(null);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleOpenReviewModal = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setReviewerNotes(application.reviewer_notes || "");
    setOpenReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setOpenReviewModal(false);
    setSelectedApplication(null);
    setNewStatus("");
    setReviewerNotes("");
  };

  const handleSaveReview = async () => {
    if (!selectedApplication) return;
    setSubmitting(true);
    try {
      await axios.patch(
        `http://localhost:8000/api/admin/therapist-applications/${selectedApplication.id}/`,
        { status: newStatus, reviewer_notes: reviewerNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbarMessage("Application updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      handleCloseReviewModal();
      fetchTherapistApplications();
    } catch (err) {
      console.error("Error updating application:", err.response?.data || err);
      setSnackbarMessage(
        err.response?.data?.detail || "Failed to update application."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUserDetailsModal = (userData) => {
    setSelectedUser(userData);
    setOpenUserDetailsModal(true);
  };
  const handleCloseUserDetailsModal = () => {
    setOpenUserDetailsModal(false);
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress sx={{ color: primaryColor }} />
        <Typography sx={{ ml: 2, color: primaryColor }}>
          Loading admin dashboard...
        </Typography>
      </Box>
    );
  }

  if (!user || !user.is_staff || !user.is_superuser) {
    return (
      <Box
        sx={{
          textAlign: "center",
          mt: 4,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Access Denied: You must be an administrator to view this page.
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please log in with an administrator account.
        </Typography>
        <Button
          component={Link}
          to="/login"
          variant="contained"
          sx={{
            backgroundColor: primaryColor,
            "&:hover": { backgroundColor: "#5a0000" },
          }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  const COLORS = [
    "#780000", // primaryColor
    "#b56576", // secondaryColor
    "#e7a042", // accentColor
    "#6d597a", // tertiaryColor
    "#7f5a83",
    "#a75000",
    "#c1121f",
    "#f07167",
    "#ffaa00",
    "#606c38",
  ];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: neutralBg }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography
          variant="h4"
          sx={{
            color: primaryColor,
            mb: 4,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          MindWell Admin Dashboard
        </Typography>

        {/* Removed Tabs for navigation as it's now handled by the side drawer */}
        {/* <Paper
          elevation={2}
          sx={{ mb: 4, borderRadius: 2, overflow: "hidden" }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            aria-label="admin dashboard tabs"
            sx={{
              "& .MuiTab-root": {
                color: primaryColor,
                fontWeight: "bold",
                "&.Mui-selected": {
                  color: primaryColor,
                  backgroundColor: `${primaryColor}10`,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: primaryColor,
              },
            }}
          >
            <Tab label="Therapist Applications" />
            <Tab label="User Management" />
            <Tab label="Sessions" />
            <Tab label="Analytics" />
          </Tabs>
        </Paper> */}

        {/* Tab Panel for Therapist Applications */}
        {currentTab === 0 && (
          <Paper
            elevation={3}
            sx={{ p: 3, backgroundColor: "white", borderRadius: 2 }}
          >
            <Typography
              variant="h5"
              sx={{ color: primaryColor, mb: 3, fontWeight: "bold" }}
            >
              Therapist Applications
            </Typography>
            {error ? (
              <Typography color="error" sx={{ textAlign: "center", mt: 2 }}>
                {error}
              </Typography>
            ) : therapistApplications.length === 0 ? (
              <Typography
                variant="h6"
                sx={{ textAlign: "center", color: primaryColor, mt: 2 }}
              >
                No therapist applications found.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Applicant Name
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Email
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Submitted At
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {therapistApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{app.applicant_full_name}</TableCell>
                        <TableCell>{app.applicant_email}</TableCell>
                        <TableCell
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: "bold",
                            color:
                              app.status === "pending"
                                ? "orange"
                                : app.status === "approved"
                                ? "green"
                                : "red",
                          }}
                        >
                          {app.status}
                        </TableCell>
                        <TableCell>
                          {new Date(app.submitted_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              "&:hover": {
                                backgroundColor: "rgba(120,0,0,0.05)",
                              },
                            }}
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

        {/* Tab Panel for User Management - MODIFIED */}
        {currentTab === 1 && (
          <Paper
            elevation={3}
            sx={{ p: 3, backgroundColor: "white", borderRadius: 2 }}
          >
            <Typography
              variant="h5"
              sx={{ color: primaryColor, mb: 3, fontWeight: "bold" }}
            >
              User & Therapist Management
            </Typography>
            {error ? (
              <Typography color="error" sx={{ textAlign: "center", mt: 2 }}>
                {error}
              </Typography>
            ) : users.length === 0 ? (
              <Typography
                variant="h6"
                sx={{ textAlign: "center", color: primaryColor, mt: 2 }}
              >
                No users found.
              </Typography>
            ) : (
              <Box>
                {/* Display regular users first */}
                <Accordion
                  defaultExpanded
                  sx={{
                    mb: 2,
                    boxShadow: "none",
                    border: `1px solid ${primaryColor}10`,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: primaryColor }} />}
                    sx={{
                      backgroundColor: `${primaryColor}05`,
                      borderBottom: `1px solid ${primaryColor}20`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, fontWeight: "bold" }}
                    >
                      Regular Users (
                      {
                        users.filter((u) => !u.is_therapist && !u.is_superuser)
                          .length
                      }
                      )
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Email
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Name
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Role
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Verified
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users
                            .filter((u) => !u.is_therapist && !u.is_superuser)
                            .map((u) => (
                              <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                  {u.first_name} {u.last_name}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={"User"}
                                    size="small"
                                    color={"default"}
                                  />
                                </TableCell>
                                <TableCell>
                                  {u.is_verified ? "Yes" : "No"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: primaryColor,
                                      color: primaryColor,
                                      "&:hover": {
                                        backgroundColor: "rgba(120,0,0,0.05)",
                                      },
                                    }}
                                    onClick={() =>
                                      handleOpenUserDetailsModal(u)
                                    }
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                {/* Therapists Section */}
                <Accordion
                  defaultExpanded
                  sx={{
                    mb: 2,
                    boxShadow: "none",
                    border: `1px solid ${primaryColor}10`,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: primaryColor }} />}
                    sx={{
                      backgroundColor: `${primaryColor}05`,
                      borderBottom: `1px solid ${primaryColor}20`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, fontWeight: "bold" }}
                    >
                      Therapists (
                      {
                        users.filter((u) => u.is_therapist && !u.is_superuser)
                          .length
                      }
                      )
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    {[
                      {
                        title: "Charging Therapists",
                        filter: (t) => !t.is_free_consultation,
                      },
                      {
                        title: "Free Consultation Therapists",
                        filter: (t) => t.is_free_consultation,
                      },
                    ].map((priceCategory, pIndex) => (
                      <Box key={pIndex} sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: primaryColor,
                            fontWeight: "bold",
                            ml: 2,
                            mt: 2,
                          }}
                        >
                          {priceCategory.title}
                        </Typography>
                        {[
                          { mode: "online", label: "Online Sessions" },
                          { mode: "physical", label: "Physical Sessions" },
                          { mode: "both", label: "Both Online & Physical" },
                        ].map((sessionMode, sIndex) => {
                          const filteredTherapists = users.filter(
                            (u) =>
                              u.is_therapist &&
                              !u.is_superuser &&
                              priceCategory.filter(u) &&
                              (u.session_modes === sessionMode.mode ||
                                (sessionMode.mode === "online" &&
                                  u.session_modes === "both") ||
                                (sessionMode.mode === "physical" &&
                                  u.session_modes === "both"))
                          );

                          if (filteredTherapists.length === 0) return null;

                          return (
                            <Accordion
                              key={`${pIndex}-${sIndex}`}
                              defaultExpanded
                              sx={{
                                ml: 2,
                                mt: 1,
                                boxShadow: "none",
                                border: `1px dashed ${primaryColor}05`,
                              }}
                            >
                              <AccordionSummary
                                expandIcon={
                                  <ExpandMoreIcon
                                    sx={{ color: primaryColor }}
                                  />
                                }
                                sx={{ backgroundColor: `${primaryColor}05` }}
                              >
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: primaryColor,
                                    fontWeight: "bold",
                                  }}
                                >
                                  {sessionMode.label} (
                                  {filteredTherapists.length})
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 0 }}>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            color: primaryColor,
                                          }}
                                        >
                                          Email
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            color: primaryColor,
                                          }}
                                        >
                                          Name
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            color: primaryColor,
                                          }}
                                        >
                                          Rate
                                        </TableCell>
                                        {["physical", "both"].includes(
                                          sessionMode.mode
                                        ) && (
                                          <TableCell
                                            sx={{
                                              fontWeight: "bold",
                                              color: primaryColor,
                                            }}
                                          >
                                            Location
                                          </TableCell>
                                        )}
                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            color: primaryColor,
                                          }}
                                        >
                                          Status
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            color: primaryColor,
                                          }}
                                        >
                                          Actions
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {filteredTherapists.map((u) => (
                                        <TableRow key={u.id}>
                                          <TableCell>{u.email}</TableCell>
                                          <TableCell>
                                            {u.first_name} {u.last_name}
                                          </TableCell>
                                          <TableCell>
                                            {u.is_free_consultation
                                              ? "Free"
                                              : u.hourly_rate
                                              ? `Ksh ${parseFloat(
                                                  u.hourly_rate
                                                ).toFixed(2)}`
                                              : "N/A"}
                                          </TableCell>
                                          {["physical", "both"].includes(
                                            sessionMode.mode
                                          ) && (
                                            <TableCell>
                                              {u.physical_address || "N/A"}
                                            </TableCell>
                                          )}
                                          <TableCell>
                                            <Chip
                                              label={
                                                u.is_verified
                                                  ? "Verified"
                                                  : "Unverified"
                                              }
                                              size="small"
                                              color={
                                                u.is_verified
                                                  ? "success"
                                                  : "warning"
                                              }
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                borderColor: primaryColor,
                                                color: primaryColor,
                                                "&:hover": {
                                                  backgroundColor:
                                                    "rgba(120,0,0,0.05)",
                                                },
                                              }}
                                              onClick={() =>
                                                handleOpenUserDetailsModal(u)
                                              }
                                            >
                                              View
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </AccordionDetails>
                            </Accordion>
                          );
                        })}
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>

                {/* Admin Users (Superusers) */}
                <Accordion
                  defaultExpanded
                  sx={{
                    boxShadow: "none",
                    border: `1px solid ${primaryColor}10`,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: primaryColor }} />}
                    sx={{
                      backgroundColor: `${primaryColor}05`,
                      borderBottom: `1px solid ${primaryColor}20`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, fontWeight: "bold" }}
                    >
                      Administrators (
                      {users.filter((u) => u.is_superuser).length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Email
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Name
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Role
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", color: primaryColor }}
                            >
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users
                            .filter((u) => u.is_superuser)
                            .map((u) => (
                              <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                  {u.first_name} {u.last_name}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={"Admin"}
                                    size="small"
                                    color={"secondary"}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: primaryColor,
                                      color: primaryColor,
                                      "&:hover": {
                                        backgroundColor: "rgba(120,0,0,0.05)",
                                      },
                                    }}
                                    onClick={() =>
                                      handleOpenUserDetailsModal(u)
                                    }
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Paper>
        )}

        {/* Tab Panel for Sessions */}
        {currentTab === 2 && (
          <Paper
            elevation={3}
            sx={{ p: 3, backgroundColor: "white", borderRadius: 2 }}
          >
            <Typography
              variant="h5"
              sx={{ color: primaryColor, mb: 3, fontWeight: "bold" }}
            >
              All Sessions
            </Typography>
            {error ? (
              <Typography color="error" sx={{ textAlign: "center", mt: 2 }}>
                {error}
              </Typography>
            ) : sessions.length === 0 ? (
              <Typography
                variant="h6"
                sx={{ textAlign: "center", color: primaryColor, mt: 2 }}
              >
                No sessions found.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Client
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Therapist
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Date
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Time
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Duration (min)
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Type
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: primaryColor }}
                      >
                        Paid
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.client_name}</TableCell>
                        <TableCell>{s.therapist_name}</TableCell>
                        <TableCell>{s.session_date}</TableCell>
                        <TableCell>{s.session_time}</TableCell>
                        <TableCell> {s.duration_minutes} </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              s.status.charAt(0).toUpperCase() +
                              s.status.slice(1)
                            }
                            size="small"
                            color={
                              s.status === "completed" ? "success" : "info"
                            }
                          />
                        </TableCell>
                        <TableCell>{s.session_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.session_request_is_paid ? "Yes" : "No"}
                            size="small"
                            color={
                              s.session_request_is_paid ? "success" : "default"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* Removed Tab Panel for Journal Entries (currentTab === 3) */}

        {/* Tab Panel for Analytics (now currentTab === 3) */}
        {currentTab === 3 && (
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "white",
              borderRadius: 2,
              minHeight: "600px",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: primaryColor,
                mb: 3,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Website Analytics
            </Typography>
            {error ? (
              <Typography color="error" sx={{ textAlign: "center", mt: 2 }}>
                {error}
              </Typography>
            ) : (
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: primaryColor, mb: 2 }}>
                    Overview
                  </Typography>
                  <Typography variant="body1">
                    Total Users:{" "}
                    <Chip
                      label={analyticsData.totalUsers}
                      color="primary"
                      sx={{ bgcolor: primaryColor, color: "white" }}
                    />
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Total Therapists:{" "}
                    <Chip
                      label={analyticsData.totalTherapists}
                      color="secondary"
                      sx={{ bgcolor: secondaryColor, color: "white" }}
                    />
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Total Sessions:{" "}
                    <Chip label={sessions.length} color="info" />
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Total Journal Entries:{" "}
                    <Chip label={journalEntries.length} color="success" />{" "}
                    {/* Still shows count */}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Total Revenue:{" "}
                    <Chip
                      label={`Ksh ${analyticsData.totalRevenue.toFixed(2)}`}
                      sx={{
                        bgcolor: accentColor,
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Total Payments:{" "}
                    <Chip
                      label={analyticsData.totalAllPayments}
                      sx={{
                        bgcolor: tertiaryColor,
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid #ccc",
                      borderRadius: 2,
                      minHeight: 350,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, mb: 2 }}
                    >
                      Session Status Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={analyticsData.sessionData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke={primaryColor} />
                        <YAxis stroke={primaryColor} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          fill={primaryColor}
                          name="Number of Sessions"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    {analyticsData.sessionData.length === 0 && (
                      <Typography
                        variant="body2"
                        sx={{ textAlign: "center", mt: 2 }}
                      >
                        No session status data available.
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid #ccc",
                      borderRadius: 2,
                      minHeight: 350,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, mb: 2 }}
                    >
                      Monthly Revenue Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={analyticsData.revenueTrendData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke={primaryColor} />
                        <YAxis stroke={primaryColor} />
                        <Tooltip
                          formatter={(value) => `Ksh ${value.toFixed(2)}`}
                        />
                        <Legend />
                        <Bar dataKey="Revenue" fill={accentColor} />
                      </BarChart>
                    </ResponsiveContainer>
                    {analyticsData.revenueTrendData.length === 0 && (
                      <Typography
                        variant="body2"
                        sx={{ textAlign: "center", mt: 2 }}
                      >
                        No revenue trend data available.
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid #ccc",
                      borderRadius: 2,
                      minHeight: 350,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, mb: 2 }}
                    >
                      Free vs. Paid Sessions
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <Pie
                          data={analyticsData.sessionTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={0}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent, x, y, outerRadius, midAngle }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 25;
                            const sx = x + radius * Math.cos(-midAngle * RADIAN);
                            const sy = y + radius * Math.sin(-midAngle * RADIAN);
                            const mx = x + radius * Math.cos(-midAngle * RADIAN);
                            const my = y + radius * Math.sin(-midAngle * RADIAN);
                            const ex = sx + (Math.cos(-midAngle * RADIAN) >= 0 ? 1 : -1) * 22;
                            const ey = sy;
                            const textAnchor = Math.cos(-midAngle * RADIAN) >= 0 ? 'start' : 'end';
                            
                            return (
                              <text x={ex} y={ey} fill={primaryColor} textAnchor={textAnchor} dominantBaseline="central" fontSize="12px">
                                {`${name}: ${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        >
                          {analyticsData.sessionTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} sessions`,
                            name,
                          ]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {analyticsData.sessionTypeData.length === 0 && (
                      <Typography
                        variant="body2"
                        sx={{ textAlign: "center", mt: 2 }}
                      >
                        No free vs. paid session data available.
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid #ccc",
                      borderRadius: 2,
                      minHeight: 500,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, mb: 2 }}
                    >
                      Journal Entry Mood Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={450}>
                      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <Pie
                          data={analyticsData.moodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={110}
                          innerRadius={0}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent, x, y, outerRadius, midAngle }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 25;
                            const sx = x + radius * Math.cos(-midAngle * RADIAN);
                            const sy = y + radius * Math.sin(-midAngle * RADIAN);
                            const mx = x + radius * Math.cos(-midAngle * RADIAN);
                            const my = y + radius * Math.sin(-midAngle * RADIAN);
                            const ex = sx + (Math.cos(-midAngle * RADIAN) >= 0 ? 1 : -1) * 22;
                            const ey = sy;
                            const textAnchor = Math.cos(-midAngle * RADIAN) >= 0 ? 'start' : 'end';

                            return (
                              <text x={ex} y={ey} fill={primaryColor} textAnchor={textAnchor} dominantBaseline="central" fontSize="12px">
                                {`${name}: ${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        >
                          {analyticsData.moodData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {analyticsData.moodData.length === 0 && (
                      <Typography
                        variant="body2"
                        sx={{ textAlign: "center", mt: 2 }}
                      >
                        No journal entry mood data available.
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        )}

        {/* Snackbar for feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Review Application Modal */}
        <Dialog
          open={openReviewModal}
          onClose={handleCloseReviewModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: primaryColor, fontWeight: "bold" }}>
            Review Therapist Application
          </DialogTitle>
          <DialogContent dividers>
            {selectedApplication && (
              <Box>
                <Typography variant="h6" sx={{ mb: 1, color: primaryColor }}>
                  Applicant: {selectedApplication.applicant_full_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {selectedApplication.applicant_email}
                </Typography>
                <Typography variant="body2">
                  <strong>License Number:</strong>{" "}
                  {selectedApplication.license_number}
                </Typography>
                <Typography variant="body2">
                  <strong>ID Number:</strong> {selectedApplication.id_number}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Motivation:</strong>{" "}
                  {selectedApplication.motivation_statement}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Specializations:</strong>{" "}
                  {selectedApplication.specializations}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Years of Experience:</strong>{" "}
                  {selectedApplication.years_of_experience}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>License Credentials:</strong>{" "}
                  {selectedApplication.license_credentials}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Approach/Modalities:</strong>{" "}
                  {selectedApplication.approach_modalities}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Languages Spoken:</strong>{" "}
                  {selectedApplication.languages_spoken}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Client Focus:</strong>{" "}
                  {selectedApplication.client_focus}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Insurance Accepted:</strong>{" "}
                  {selectedApplication.insurance_accepted ? "Yes" : "No"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Free Consultation:</strong>{" "}
                  {selectedApplication.is_free_consultation ? "Yes" : "No"}
                </Typography>
                {!selectedApplication.is_free_consultation &&
                  selectedApplication.hourly_rate && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Hourly Rate:</strong> Ksh{" "}
                      {parseFloat(selectedApplication.hourly_rate).toFixed(2)}
                    </Typography>
                  )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Session Modes:</strong>{" "}
                  {selectedApplication.session_modes}
                </Typography>
                {selectedApplication.physical_address && (
                  <Typography variant="body2">
                    <strong>Physical Address:</strong>{" "}
                    {selectedApplication.physical_address}
                  </Typography>
                )}

                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>License Document:</strong>{" "}
                  {selectedApplication.license_document ? (
                    <MuiLink
                      href={selectedApplication.license_document}
                      target="_blank"
                      rel="noopener"
                    >
                      View Document
                    </MuiLink>
                  ) : (
                    "N/A"
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>ID Document:</strong>{" "}
                  {selectedApplication.id_document ? (
                    <MuiLink
                      href={selectedApplication.id_document}
                      target="_blank"
                      rel="noopener"
                    >
                      View Document
                    </MuiLink>
                  ) : (
                    "N/A"
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Professional Photo:</strong>{" "}
                  {selectedApplication.professional_photo ? (
                    <MuiLink
                      href={selectedApplication.professional_photo}
                      target="_blank"
                      rel="noopener"
                    >
                      View Photo
                    </MuiLink>
                  ) : (
                    "N/A"
                  )}
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
            <Button
              onClick={handleCloseReviewModal}
              sx={{ color: primaryColor }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveReview}
              variant="contained"
              sx={{
                backgroundColor: primaryColor,
                "&:hover": { backgroundColor: "#5a0000" },
              }}
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save Review"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New: User Details/Edit Modal */}
        <Dialog
          open={openUserDetailsModal}
          onClose={handleCloseUserDetailsModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: primaryColor, fontWeight: "bold" }}>
            User Details
          </DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Box>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedUser.first_name}{" "}
                  {selectedUser.last_name}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {selectedUser.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> {selectedUser.phone || "N/A"}
                </Typography>
                <Typography variant="body1">
                  <strong>Is Therapist:</strong>{" "}
                  {selectedUser.is_therapist ? "Yes" : "No"}
                </Typography>
                <Typography variant="body1">
                  <strong>Is Verified:</strong>{" "}
                  {selectedUser.is_verified ? "Yes" : "No"}
                </Typography>
                <Typography variant="body1">
                  <strong>Is Staff:</strong>{" "}
                  {selectedUser.is_staff ? "Yes" : "No"}
                </Typography>
                <Typography variant="body1">
                  <strong>Is Superuser:</strong>{" "}
                  {selectedUser.is_superuser ? "Yes" : "No"}
                </Typography>
                {selectedUser.is_therapist && (
                  <Box sx={{ mt: 2, borderTop: "1px solid #eee", pt: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{ color: primaryColor, mb: 1 }}
                    >
                      Therapist Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>Bio:</strong> {selectedUser.bio || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Years of Experience:</strong>{" "}
                      {selectedUser.years_of_experience || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Specializations:</strong>{" "}
                      {selectedUser.specializations || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Hourly Rate:</strong>{" "}
                      {selectedUser.hourly_rate
                        ? `Ksh ${parseFloat(selectedUser.hourly_rate).toFixed(
                            2
                          )}`
                        : "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>License Credentials:</strong>{" "}
                      {selectedUser.license_credentials || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Approach Modalities:</strong>{" "}
                      {selectedUser.approach_modalities || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Languages Spoken:</strong>{" "}
                      {selectedUser.languages_spoken || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Client Focus:</strong>{" "}
                      {selectedUser.client_focus || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Insurance Accepted:</strong>{" "}
                      {selectedUser.insurance_accepted ? "Yes" : "No"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Free Consultation:</strong>{" "}
                      {selectedUser.is_free_consultation ? "Yes" : "No"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Session Modes:</strong>{" "}
                      {selectedUser.session_modes || "N/A"}
                    </Typography>
                    {selectedUser.physical_address && (
                      <Typography variant="body2">
                        <strong>Physical Address:</strong>{" "}
                        {selectedUser.physical_address}
                      </Typography>
                    )}
                    {selectedUser.profile_picture && (
                      <Typography variant="body2">
                        <strong>Profile Picture:</strong>{" "}
                        <MuiLink
                          href={selectedUser.profile_picture}
                          target="_blank"
                          rel="noopener"
                        >
                          View
                        </MuiLink>
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseUserDetailsModal}
              sx={{ color: primaryColor }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
