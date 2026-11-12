const express = require("express");
const crypto = require("crypto");
const { exec } = require("child_process");

const app = express();
app.use(express.json({ verify: verifyPayload }));

const SECRET = "MY_SECRET_123"; // same as GitHub webhook

function verifyPayload(req, res, buf) {
  req.rawBody = buf.toString();
}

app.post("/git-webhook", (req, res) => {
  const sig = req.headers["x-hub-signature-256"];
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(req.rawBody)
    .digest("hex");

  const expected = `sha256=${hmac}`;

  if (sig !== expected) {
    return res.status(401).send("Invalid signature");
  }

  console.log("✔ Webhook authenticated");
  res.send("Deploying...");

  exec("bash /home/backend/deploy.sh", (error, stdout, stderr) => {
    if (error) console.error(error);
    console.log(stdout);
    console.error(stderr);
  });
});

app.listen(9000, () => console.log("Deploy webhook running on port 9000"));

