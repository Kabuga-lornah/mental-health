import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Chip,
  Stack,
  InputAdornment,
  useMediaQuery,
  Paper,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Badge,
  Snackbar,
  Alert,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😨", label: "Anxious" },
  { emoji: "😠", label: "Angry" },
  { emoji: "🙏", label: "Grateful" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😴", label: "Tired" },
];

const motivationalQuotes = [
  "Your words today become your reality tomorrow.",
  "Every journal entry is a step toward self-discovery.",
  "The smallest progress is still progress.",
  "Your feelings are valid and important.",
  "This is your safe space to be completely honest.",
  "Reflection is the key to growth.",
];

export default function Journal() {
  const { user, token, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    mood: "",
    entry: "",
    tags: [],
    attachment_name: "",
    attachment_file: null,
    date: new Date(),
  });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [showEntries, setShowEntries] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [randomQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  const fetchJournalEntries = async () => {
    if (user && !authLoading && token) {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("http://localhost:8000/api/journal/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setJournalEntries(response.data);
      } catch (err) {
        console.error("Error fetching journal entries:", err);
        if (err.response?.status === 401) {
          setError("You are not authorized to view these entries. Please log in again.");
        } else {
          setError(err.message || "Failed to fetch journal entries.");
        }
      } finally {
        setLoading(false);
      }
    } else if (!user && !authLoading) {
      setJournalEntries([]);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [user, authLoading, token]);

  const handleTagAdd = () => {
    if (formData.tagInput?.trim() !== "") {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: "",
      });
    }
  };

  const handleAttachmentChange = (e) => {
    if (e.target.files.length > 0) {
      setFormData({
        ...formData,
        attachment_file: e.target.files[0],
        attachment_name: e.target.files[0].name,
      });
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    const dataToSend = new FormData();
    dataToSend.append("date", formData.date.toISOString());
    dataToSend.append("mood", formData.mood);
    dataToSend.append("entry", formData.entry);
    dataToSend.append("tags", JSON.stringify(formData.tags));
    if (formData.attachment_file) {
      dataToSend.append("attachment_file", formData.attachment_file);
    }
    if (formData.attachment_name) {
      dataToSend.append("attachment_name", formData.attachment_name);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      if (editingEntry) {
        await axios.put(`http://localhost:8000/api/journal/${editingEntry.id}/`, dataToSend, config);
        setFeedbackMessage("Journal entry updated successfully!");
      } else {
        await axios.post("http://localhost:8000/api/journal/", dataToSend, config);
        setFeedbackMessage("Journal entry saved successfully!");
      }
      setOpenSnackbar(true);
      setFormData({
        mood: "",
        entry: "",
        tags: [],
        attachment_name: "",
        attachment_file: null,
        date: new Date(),
        tagInput: "",
      });
      setEditingEntry(null);
      fetchJournalEntries();
    } catch (error) {
      console.error("Error saving journal:", error);
      setError(error.response?.data?.error || "Failed to save journal entry.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && formData.tagInput?.trim()) {
      e.preventDefault();
      handleTagAdd();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        p: isMobile ? 2 : 4,
        maxWidth: 1000,
        mx: "auto",
        bgcolor: "#fff",
        borderRadius: 3,
        boxShadow: 4,
        mt: 4,
        gap: 4,
      }}
    >
      {/* Motivational Sidebar */}
      {!isMobile && (
        <Paper
          sx={{
            width: 200,
            p: 3,
            bgcolor: "#f9f4e8",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <FormatQuoteIcon sx={{ color: "#780000", fontSize: 40, mb: 2 }} />
          <Typography variant="body1" sx={{ fontStyle: "italic", mb: 3 }}>
            "{randomQuote}"
          </Typography>
          <Divider sx={{ width: "100%", my: 2 }} />
          <Typography
            variant="h6"
            sx={{ color: "#780000", fontWeight: "bold", mb: 2 }}
          >
            Journaling Tips
          </Typography>
          <Box sx={{ textAlign: "left", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <StarBorderIcon sx={{ fontSize: 16, mr: 1, color: "#780000" }} />
              <Typography variant="body2">Be honest with yourself</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <StarBorderIcon sx={{ fontSize: 16, mr: 1, color: "#780000" }} />
              <Typography variant="body2">Date every entry</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <StarBorderIcon sx={{ fontSize: 16, mr: 1, color: "#780000" }} />
              <Typography variant="body2">
                Write freely without editing
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <StarBorderIcon sx={{ fontSize: 16, mr: 1, color: "#780000" }} />
              <Typography variant="body2">
                Review past entries monthly
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            sx={{ mt: 3, color: "#780000", borderColor: "#780000" }}
            onClick={() => setShowEntries(true)}
          >
            View My Journals
          </Button>
        </Paper>
      )}

      {/* Main Journal Content */}
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: "#780000", fontWeight: "bold" }}
          >
            Reflect, Release & Recenter
          </Typography>

          <IconButton
            onClick={() => setShowCalendar(!showCalendar)}
            sx={{ color: "#780000" }}
          >
            <Badge badgeContent={journalEntries.length} color="primary">
              <CalendarTodayIcon />
            </Badge>
          </IconButton>
        </Box>

        <Typography sx={{ mb: 3, color: "#555" }}>
          Start by selecting your mood and writing freely. Add tags to track
          themes in your life, and feel free to upload images or voice notes.
        </Typography>

        {showCalendar && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={formData.date}
              onChange={(newDate) => {
                setFormData({ ...formData, date: newDate });
                setShowCalendar(false);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 2 },
                },
              }}
            />
          </LocalizationProvider>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            select
            label="Today's mood"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
            fullWidth
            margin="normal"
            sx={{ bgcolor: "#f9f9f9" }}
            required
          >
            {moods.map((option) => (
              <MenuItem key={option.label} value={option.label}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontSize: "1.5rem", mr: 1 }}>
                    {option.emoji}
                  </Typography>
                  <Typography>{option.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <Paper
            sx={{
              p: 2,
              mt: 2,
              mb: 3,
              backgroundImage:
                "linear-gradient(to bottom, #f9f9f9 1px, transparent 1px)",
              backgroundSize: "100% 28px",
              backgroundPositionY: "32px",
              backgroundColor: "#fff9f0",
              border: "1px solid #e0e0e0",
              minHeight: 200,
            }}
          >
            <TextField
              placeholder="Dear Diary..."
              name="entry"
              multiline
              minRows={6}
              fullWidth
              value={formData.entry}
              onChange={handleChange}
              required
              sx={{
                "& .MuiInputBase-root": {
                  background: "transparent",
                  lineHeight: "28px",
                  padding: 0,
                },
                "& .MuiInputBase-input": {
                  lineHeight: "28px",
                  padding: 0,
                },
                "& fieldset": { border: "none" },
              }}
            />
          </Paper>

          <TextField
            label="Add tags (e.g. work, family, success)"
            name="tagInput"
            value={formData.tagInput || ""}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            fullWidth
            margin="normal"
            sx={{ bgcolor: "#f9f9f9" }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={handleTagAdd}
                    sx={{
                      color: "#780000",
                      textTransform: "none",
                      fontWeight: "bold",
                    }}
                  >
                    Add
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
            {formData.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() =>
                  setFormData({
                    ...formData,
                    tags: formData.tags.filter((_, i) => i !== index),
                  })
                }
                sx={{ bgcolor: "#780000", color: "#fff" }}
              />
            ))}
          </Stack>

          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{
              mb: 2,
              borderColor: "#780000",
              color: "#780000",
              ":hover": { borderColor: "#780000", backgroundColor: "#fbe9e7" },
            }}
          >
            Upload File
            <input type="file" hidden onChange={handleAttachmentChange} />
          </Button>

          {formData.attachment_name && (
            <Typography sx={{ fontSize: 14, color: "#444", mb: 2 }}>
              Attached: {formData.attachment_name}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              py: 1.5,
              backgroundColor: "#780000",
              ":hover": { backgroundColor: "#a30000" },
              fontWeight: "bold",
              fontSize: "1rem",
            }}
            disabled={!formData.entry || !formData.mood || loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : editingEntry ? (
              "Update Journal"
            ) : (
              "Save My Journal"
            )}
          </Button>
        </form>

        {isMobile && (
          <Box sx={{ mt: 4, p: 2, bgcolor: "#f9f4e8", borderRadius: 2 }}>
            <Typography
              variant="h6"
              sx={{ color: "#780000", fontWeight: "bold", mb: 1 }}
            >
              Journal Prompt
            </Typography>
            <Typography sx={{ fontStyle: "italic" }}>
              "{randomQuote}"
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2, color: "#780000", borderColor: "#780000" }}
              onClick={() => setShowEntries(true)}
            >
              View My Journals
            </Button>
          </Box>
        )}
      </Box>

      {/* Journal Entries Dialog */}
      <Dialog
        open={showEntries}
        onClose={() => setShowEntries(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          My Journal Entries
          <IconButton onClick={() => setShowEntries(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : journalEntries.length === 0 ? (
            <Typography sx={{ p: 2, textAlign: "center" }}>
              No journal entries yet.
            </Typography>
          ) : (
            <List>
              {journalEntries.map((entry) => (
                <ListItem
                  key={entry.id}
                  divider
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                      cursor: "pointer",
                    },
                  }}
                  onClick={() => {
                    setEditingEntry(entry);
                    setFormData({
                      mood: entry.mood,
                      entry: entry.entry,
                      tags: entry.tags || [],
                      date: new Date(entry.date),
                      attachment_name: entry.attachment_name || "",
                      attachment_file: null,
                    });
                    setShowEntries(false);
                  }}
                >
                  <ListItemText
                    primary={formatDate(entry.date)}
                    secondary={
                      <>
                        <Typography component="span" sx={{ display: "block" }}>
                          Mood: {entry.mood}
                        </Typography>
                        {entry.tags?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {entry.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{
                                  mr: 1,
                                  mb: 1,
                                  bgcolor: "#780000",
                                  color: "#fff",
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEntries(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}