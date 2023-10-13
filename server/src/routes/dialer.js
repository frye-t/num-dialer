import axios from "axios";
import { Router } from "express";
const router = Router();

const MAX_CONCURRENT = 3;
const webhookURL = process.env.WEBHOOK_URL;
const callURL = process.env.CALL_URL;

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
  constructor(numbers, maxConcurrentCalls, io) {
    this.callIndex = 0;
    this.maxConcurrentCalls = maxConcurrentCalls;

    this.calls = numbers.map((n, idx) => {
      return { number: n, displayId: idx };
    });

    io.on("connection", (socket) => {
      console.log("got a connection!");
      this.socket = socket;
    });

    io.on("disconnect", () => {
      console.log("DCED");
    });
  }

  getCalls() {
    return this.calls;
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
        axios.post(callURL, json).then(({ data }) => {
          const { id } = data;
          this.calls[idx].id = id;
          console.log("Active calls:", this.getActiveCalls());
          console.log(this.calls);
        });
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
    if (this.socket) {
      this.socket.emit("status", JSON.stringify(this.calls));
    } else {
      console.log("socket not found");
    }
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

const configureRouter = (io) => {
  let dialer;

  router.get("/get-numbers", (req, res) => {
    dialer = new Dialer(numbers, MAX_CONCURRENT, io);
    res.status(200).json(dialer.getCalls());
  });

  router.get("/call", (req, res) => {
    dialer.startDialing();
    res.status(200).send("Dialing all numbers");
  });

  router.post("/update-dialer", (req, res) => {
    const { id, status } = req.body;
    dialer.updateCallStatus(id, status);
  });

  return router;
};

export default configureRouter;
