const express = require("express");
const twilio = require("twilio");

const app = express();
const port = process.env.PORT || 3000;

app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ voice: "alice", language: "ru-RU" }, "Здравствуйте! Я ИИ. Что вы хотите заказать?");
  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(port, () => console.log("Server running on port", port));
