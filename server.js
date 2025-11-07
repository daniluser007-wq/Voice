// server.js
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import twilio from "twilio";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

// ✅ ES Modules: правильно берём VoiceResponse
const { VoiceResponse } = twilio.twiml;

let userSession = {};

// 🔹 Первый шаг — приветствие
app.post("/voice", (req, res) => {
  const twiml = new VoiceResponse();
  const callSid = req.body.CallSid;
  userSession[callSid] = {}; // создаём сессию

  twiml.say({ voice: "alice", language: "ru-RU" }, "Здравствуйте! Я ИИ. Что вы хотите заказать?");
  twiml.redirect("/order_details");

  res.type("text/xml");
  res.send(twiml.toString());
});

// 🔹 Второй шаг — получение заказа
app.post("/order_details", (req, res) => {
  const twiml = new VoiceResponse();
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult;

  if (speechResult) userSession[callSid].order = speechResult;

  twiml.say({ voice: "alice", language: "ru-RU" }, "Хорошо. Теперь скажите адрес доставки.");
  twiml.redirect("/confirm_order");

  res.type("text/xml");
  res.send(twiml.toString());
});

// 🔹 Третий шаг — подтверждение
app.post("/confirm_order", (req, res) => {
  const twiml = new VoiceResponse();
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult;

  if (speechResult) userSession[callSid].address = speechResult;

  const { order, address } = userSession[callSid];
  twiml.say(
    { voice: "alice", language: "ru-RU" },
    `Вы заказали ${order}, по адресу ${address}. Подтвердите заказ, скажите да или нет.`
  );
  twiml.redirect("/final_step");

  res.type("text/xml");
  res.send(twiml.toString());
});

// 🔹 Финальный шаг — отправка данных в n8n и завершение звонка
app.post("/final_step", async (req, res) => {
  const twiml = new VoiceResponse();
  const callSid = req.body.CallSid;
  const answer = (req.body.SpeechResult || "").toLowerCase();

  const { order, address } = userSession[callSid] || {};

  if (answer.includes("да")) {
    twiml.say({ voice: "alice", language: "ru-RU" }, "Спасибо! Ваш заказ принят. Хорошего дня!");
    twiml.hangup();

    try {
      await axios.post("https://danpan420.app.n8n.cloud/webhook-test/new-order", {
        order,
        address,
      });
      console.log("✅ Данные успешно отправлены в n8n");
    } catch (err) {
      console.error("❌ Ошибка при отправке в n8n:", err.message);
    }

  } else {
    twiml.say({ voice: "alice", language: "ru-RU" }, "Хорошо, заказ отменён. До свидания!");
    twiml.hangup();
  }

  delete userSession[callSid];

  res.type("text/xml");
  res.send(twiml.toString());
});

app.get("/", (req, res) => {
  res.send("Twilio voice bot is running 🚀");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
