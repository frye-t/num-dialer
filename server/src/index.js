import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT;

app.listen(PORT || 3000, () =>
  console.log(`Example app listening on port ${PORT || 3000}!`)
);
