import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import axios from "axios";
import dialerRouter from "./routes/dialer";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

io.on("disconnect", () => {
  console.log("DCED");
});

app.use(express.json());
app.use(cors());

app.use("/api", dialerRouter(io));

app.post("/webhook/calls", (req, res) => {
  const { id, status } = req.body;
  const json = {
    id,
    status,
  };
  axios.post("http://localhost:3000/api/update-dialer", json);
  res.status(200).send();
});

export default httpServer;
