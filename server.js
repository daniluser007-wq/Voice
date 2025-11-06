const express = require("express");
const twilio = require("twilio");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ------------------- Шаг 1: спрашиваем заказ -------------------
app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: "speech",
    action: "/order_details",
    language: "ru-RU",
    timeout: 10,
    speechTimeout: "auto",
    bargeIn: true
  });

  gather.say({ voice: "alice", language: "ru-RU" }, "Здравствуйте! Я ИИ. Что вы хотите заказать?");

  res.type("text/xml");
  res.send(twiml.toString());
});

// ------------------- Шаг 2: получаем заказ, спрашиваем адрес -------------------
app.post("/order_details", (req, res) => {
  const order = req.body.SpeechResult || "Не распознано";

  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: "speech",
    action: `/confirm_order?order=${encodeURIComponent(order)}`,
    language: "ru-RU",
    timeout: 10,
    speechTimeout: "auto",
    bargeIn: true
  });

  gather.say({ voice: "alice", language: "ru-RU" }, `Вы заказали: ${order}. Пожалуйста, назовите адрес доставки.`);

  res.type("text/xml");
  res.send(twiml.toString());
});

// ------------------- Шаг 3: переповтор заказа и адреса + подтверждение -------------------
app.post("/confirm_order", (req, res) => {
  const order = req.query.order || "Не распознано";
  const address = req.body.SpeechResult || "Не распознано";

  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: "speech",
    action: `/final_step?order=${encodeURIComponent(order)}&address=${encodeURIComponent(address)}`,
    language: "ru-RU",
    timeout: 10,
    speechTimeout: "auto",
    bargeIn: true
  });

  gather.say({ voice: "alice", language: "ru-RU" }, `Вы заказали: ${order}. Доставка по адресу: ${address}. Всё верно? Пожалуйста, скажите да или нет.`);

  res.type("text/xml");
  res.send(twiml.toString());
});

// ------------------- Шаг 4: проверка "Да/Нет" -------------------
app.post("/final_step", (req, res) => {
  const order = req.query.order || "Не распознано";
  const address = req.query.address || "Не распознано";
  const answer = (req.body.SpeechResult || "").toLowerCase();

  const twiml = new twilio.twiml.VoiceResponse();

  if (answer.includes("да")) {
    twiml.say({ voice: "alice", language: "ru-RU" }, "Спасибо! Ваш заказ принят.");
    twiml.hangup();
  } else {
    twiml.say({ voice: "alice", language: "ru-RU" }, "Хорошо, давайте попробуем снова.");
    twiml.redirect("/voice");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// ------------------- Запуск сервера -------------------
app.listen(port, () => console.log("Server running on port", port));

