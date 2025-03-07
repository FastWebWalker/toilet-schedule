import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Container,
  Box,
  MenuItem,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getStatus = (startDateTime, duration) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + duration * 60000);

  if (now >= start && now <= end) return "активний";
  if (now < start) return "в очікуванні";
  return "вичерпаний";
};

const getStatusColor = (status) => {
  switch (status) {
    case "активний":
      return "success";
    case "в очікуванні":
      return "warning";
    default:
      return "error";
  }
};

export default function ToiletSchedule() {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [type, setType] = useState("Туалет");
  const [schedule, setSchedule] = useState([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedule"), (snapshot) => {
      const items = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

      setSchedule(items);

      items.forEach(async (item) => {
        const status = getStatus(item.startDateTime, item.duration);
        if (status === "вичерпаний") {
          await deleteDoc(doc(db, "schedule", item.id));
        }
      });
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!name || !duration || !startTime || Number(duration) > 25) {
      return;
    }

    const newStart = new Date(startTime);
    const newEnd = new Date(newStart.getTime() + Number(duration) * 60000);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 3);

    if (newStart > maxDate) {
      toast.error("Можна бронювати максимум на 3 дні вперед!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const conflict = schedule.some((item) => {
      if (item.type !== type) return false;
      const existingStart = new Date(item.startDateTime);
      const existingEnd = new Date(
        existingStart.getTime() + Number(item.duration) * 60000
      );
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflict) {
      toast.error("Цей час вже заброньований для обраного типу!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    await addDoc(collection(db, "schedule"), {
      name,
      duration: Number(duration),
      startTime,
      type,
      startDateTime: startTime,
    });

    setName("");
    setDuration("");
    setStartTime("");
    setType("Туалет");

    toast.success("Тікет успішно створено!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  return (
    <Container maxWidth="md" sx={{ minHeight: "100vh", py: 4 }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%", marginBottom: "2rem" }}>
        <Card
          elevation={6}
          sx={{ p: 4, borderRadius: 4, backgroundColor: "#f3f8ff" }}>
          <Typography
            variant="h4"
            align="center"
            color="primary"
            fontWeight="bold">
            🚽🛁 Розклад туалету та ванни
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
            <TextField
              label="Ваше ім'я"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Тривалість (хв)"
              type="number"
              variant="outlined"
              inputProps={{ max: 25 }}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              helperText="Максимум 25 хв"
            />
            <TextField
              label="Дата та час початку"
              type="datetime-local"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <TextField
              select
              label="Тип"
              value={type}
              onChange={(e) => setType(e.target.value)}>
              <MenuItem value="Туалет">Туалет</MenuItem>
              <MenuItem value="Ванна">Ванна</MenuItem>
            </TextField>
            <Button variant="contained" size="large" onClick={handleAdd}>
              📝 Взяти тікет
            </Button>
          </Box>
        </Card>
      </motion.div>
      <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)} centered>
        <Tab label="🚽 Туалет" />
        <Tab label="🛁 Ванна" />
      </Tabs>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
        {schedule
          .filter((item) =>
            tab === 0 ? item.type === "Туалет" : item.type === "Ванна"
          )
          .map((item) => {
            const status = getStatus(item.startDateTime, item.duration);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}>
                <Card
                  elevation={4}
                  sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff7e6" }}>
                  <CardContent>
                    <Typography
                      variant="h6"
                      color="secondary"
                      fontWeight="bold">
                      👤 {item.name} ({item.type})
                      <Chip
                        label={status}
                        color={getStatusColor(status)}
                        sx={{ ml: 2 }}
                      />
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      🕒 Початок:{" "}
                      <strong>
                        {new Date(item.startDateTime).toLocaleString()}
                      </strong>
                    </Typography>
                    <Typography variant="body1">
                      ⏳ Тривалість: <strong>{item.duration} хв</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
      </Box>
    </Container>
  );
}
