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
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
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
  const [mood, setMood] = useState("");
  const [entry, setEntry] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [randomQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [showEntries, setShowEntries] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    // Load journal entries from backend
    fetchJournalEntries();

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/api/journal/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEntries(response.data);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() !== "") {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleAttachmentChange = (e) => {
    if (e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const journalEntry = {
      date: selectedDate.toISOString(),
      mood,
      entry,
      tags,
      attachmentName: attachment?.name || null,
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      await axios.post("http://localhost:8000/api/journal/", journalEntry, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      await fetchJournalEntries();

      setMood("");
      setEntry("");
      setTags([]);
      setTagInput("");
      setAttachment(null);
      setSelectedDate(new Date());

      alert("Journal saved successfully!");
    } catch (error) {
      console.error("Error saving journal:", error);
      alert("Error saving journal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
            <Badge badgeContent={entries.length} color="primary">
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
              value={selectedDate}
              onChange={(newDate) => {
                setSelectedDate(newDate);
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

        <TextField
          select
          label="Today's mood"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          fullWidth
          margin="normal"
          sx={{ bgcolor: "#f9f9f9" }}
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
            multiline
            minRows={6}
            fullWidth
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
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
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleTagAdd();
            }
          }}
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
          {tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              onDelete={() => setTags(tags.filter((_, i) => i !== index))}
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

        {attachment && (
          <Typography sx={{ fontSize: 14, color: "#444", mb: 2 }}>
            Attached: {attachment.name}
          </Typography>
        )}

        <Button
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
          onClick={handleSubmit}
          disabled={!entry || !mood || loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Save My Journal"
          )}
        </Button>

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
          <Typography variant="h6">My Journal Entries</Typography>
          <IconButton onClick={() => setShowEntries(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : entries.length === 0 ? (
            <Typography sx={{ p: 2, textAlign: "center" }}>
              No journal entries yet.
            </Typography>
          ) : (
            <List>
              {entries.map((entry) => (
                <ListItem
                  key={entry.id}
                  divider
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                      cursor: "pointer",
                    },
                  }}
                >
                  <ListItemText
                    primary={formatDate(entry.date)}
                    secondary={
                      <>
                        <Typography component="span" sx={{ display: "block" }}>
                          Mood: {entry.mood}
                        </Typography>
                        {entry.tags.length > 0 && (
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
    </Box>
  );
}
