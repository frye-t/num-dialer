import { useEffect, useState } from "react";
import { socket } from "./socket";
import axios from "axios";

function App() {
  const [calls, setCalls] = useState([]);
  const [hasCalled, setHasCalled] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await axios.get("http://localhost:3000/api/get-numbers");
      console.log(data);
      setCalls(
        data.map((call) => {
          return { ...call, status: "idle" };
        })
      );
    })();
  }, []);

  useEffect(() => {
    const onConnect = () => {
      console.log("connected");
    };

    const onDisconnect = () => {
      console.log("disconnected");
    };

    const onStatus = (data) => {
      const callData = JSON.parse(data);
      setCalls(
        calls.map((call) => {
          const newCall = callData.find((d) => d.displayId === call.displayId);
          return { ...call, status: newCall.status || call.status };
        })
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("status", onStatus);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("status", onStatus);
    };
  });

  const handleConnect = () => {
    setHasCalled(true);
    axios.get("http://localhost:3000/api/call");
  };

  return (
    <>
      <button onClick={handleConnect} disabled={hasCalled}>
        Call
      </button>
      <ul>
        {calls.length > 0 &&
          calls.map((call, idx) => {
            return (
              <li key={call.displayId}>
                {call.number}: {call.status}
              </li>
            );
          })}
      </ul>
    </>
  );
}

export default App;
