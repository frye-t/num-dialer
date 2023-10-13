import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const webhookURL = process.env.WEBHOOK_URL;
const callURL = process.env.CALL_URL;
const MAX_CONCURRENT = 3;

const numbers = [
  "13018040009",
  "19842068287",
  "15512459377",
  "19362072765",
  "18582210308",
  "13018040009",
  "19842068287",
  "15512459377",
  "19362072765",
];

class Dialer {
  constructor(numbers, maxConcurrentCalls) {
    this.callIndex = 0;
    this.maxConcurrentCalls = maxConcurrentCalls;
    this.calls = numbers.map((n) => {
      return { number: n };
    });
  }

  startDialing() {
    for (let i = 0; i < this.maxConcurrentCalls; i++) {
      this.dialNextNumber();
    }
  }

  async dialNextNumber() {
    const idx = this.callIndex;
    if (idx < this.calls.length) {
      try {
        const json = {
          phone: this.calls[idx].number,
          webhookURL,
        };
        this.callIndex += 1;
        const { data } = await axios.post(callURL, json);
        const { id } = data;
        this.calls[idx].id = id;
        console.log("Active calls:", this.getActiveCalls());
        console.log(this.calls);
      } catch (e) {
        console.log(e);
      }
    }
  }

  updateCallStatus(id, status) {
    const call = this.calls.find((c) => c.id === id);
    if (!call.status || status !== "ringing") {
      call.status = status;
    }

    if (call.status === "completed" && status === "completed") {
      this.dialNextNumber();
    }

    console.log("Active calls:", this.getActiveCalls());
    console.log(this.calls);
  }

  getActiveCalls() {
    return this.calls.reduce((acc, call) => {
      if (call.id && call.status !== "completed") {
        acc = acc + 1;
      }
      return acc;
    }, 0);
  }
}

const dialer = new Dialer(numbers, MAX_CONCURRENT);

app.use(express.json());
app.use(cors());

app.get("/api/call", async (req, res) => {
  dialer.startDialing();
  res.status(200).send("All calls initiated");
});

app.post("/webhook/calls", (req, res) => {
  const { id, status } = req.body;
  dialer.updateCallStatus(id, status);
  res.status(200).send();
});

export default app;
