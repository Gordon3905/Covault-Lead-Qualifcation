import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 4300);
const app = createApp();

app.listen(port, () => {
  console.log(`CoVault API listening on http://127.0.0.1:${port}`);
});
