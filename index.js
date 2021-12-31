require("dotenv").config();
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const botCommands = require("./bot-command-list");
const userModel = require("./models/user-model");
const todoModel = require("./models/todo-model");
const admins = process.env.ADMINS.split(",").map((item) => item.trim());
const moment = require("moment-timezone");

const start = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URL,
      { useUnifiedTopology: true },
      () => console.log("Connected to MongoDB")
    );
  } catch (e) {
    console.log(e);
  }

  bot.setMyCommands(botCommands);

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendSticker(
      chatId,
      "https://tlgrm.ru/_/stickers/fbc/c45/fbcc454e-75ff-3445-9dc7-addf71db6c9e/192/46.webp"
    );
    await bot.sendMessage(
      chatId,
      `
Привет, ${msg.from.first_name}!
Используйте команду /register, чтобы зарегистрироваться`
    );
  });

  bot.onText(/\/register/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const userExist = await userModel.findOne({ user_id: chatId });
      if (userExist) {
        return await bot.sendMessage(chatId, "Вы уже зарегистрированы!");
      }
      const newUser = new userModel({
        user_id: chatId
      });
      await newUser.save();
      await bot.sendMessage(chatId, "Успешная регистрация!");
    } catch (e) {
      console.log(e);
    }
  });

  bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    const adminMenu = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: "Кол-во пользователей",
              callback_data: `admin usersCount ${chatId}`
            },
            {
              text: "Кол-во заметок",
              callback_data: `admin todosCount ${chatId}`
            }
          ]
        ]
      })
    };
    try {
      if (admins.includes(chatId.toString())) {
        await bot.sendMessage(chatId, "Админ панель", adminMenu);
      }
    } catch (e) {
      console.log(e);
    }
  });

  bot.onText(/\/new/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const userExist = await userModel.findOne({ user_id: chatId });
      if (!userExist) {
        return await bot.sendMessage(
          chatId,
          `
Вы ещё не зарегистрированы!
Используйте /register, чтобы зарегистрироваться`
        );
      }
      await bot.sendMessage(chatId, "Введите название.");
      bot.once("message", async (msg) => {
        const title = msg.text;
        const newTodo = new todoModel({
          user_id: chatId,
          title
        });
        await newTodo.save();
        await bot.sendMessage(
          chatId,
          `
Заметка успешно создана!
Используйте /todos, чтобы просмотреть.`
        );
      });
    } catch (e) {
      console.log(e);
    }
  });

  bot.onText(/\/todos/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const userExist = await userModel.findOne({ user_id: chatId });
      if (!userExist) {
        return await bot.sendMessage(
          chatId,
          `
Вы ещё не зарегистрированы!
Используйте /register, чтобы зарегистрироваться`
        );
      }
      const todos = await todoModel.find({ user_id: chatId });
      if (todos.length === 0) {
        return await bot.sendMessage(
          chatId,
          `
У вас нету заметок.
Чтобы добавить, используйте /new`
        );
      }
      todos.map((todo, ix) => {
        const todoLayout = `
ID: *${ix + 1}*
Название: *${todo.title}*
Выполнено: *${todo.completed ? "Да" : "Нет"}*
Создана: *${moment(todo.created_at).format("DD.MM.YYYY HH:mm:ss")}*
				`;
        bot.sendMessage(chatId, todoLayout, {
          parse_mode: "MARKDOWN",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                {
                  text: "Выполнить",
                  callback_data: `complete ${todo._id} ${chatId}`
                },
                {
                  text: "Удалить",
                  callback_data: `delete ${todo._id} ${chatId}`
                }
              ]
            ]
          })
        });
      });
    } catch (e) {
      console.log(e);
    }
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.from.id;
    const sData = data.split(" ");
    if (sData[0] === "admin") {
      if (!admins.includes(chatId.toString())) {
        return await bot.sendMessage(chatId, "Нет доступа!");
      }
      try {
        const aChatId = sData[2];
        const cmd = sData[1];
        switch (cmd) {
          case "todosCount":
            const todosCount = await todoModel.count();
            await bot.sendMessage(aChatId, `Всего заметок: ${todosCount}`);
            break;
          case "usersCount":
            const usersCount = await userModel.count();
            await bot.sendMessage(
              aChatId,
              `Всего пользователей: ${usersCount}`
            );
            break;
          default:
            return;
        }
        return;
      } catch (e) {
        console.log(e);
      }
    }
    try {
      const todo = await todoModel.findById(sData[1]);
      if (!todo.user_id === Number(sData[2])) {
        return;
      }
      switch (sData[0]) {
        case "complete":
          todo.completed = true;
          await todo.save();
          await bot.sendMessage(chatId, "Заметка выполнена!");
          break;
        case "delete":
          await todoModel.deleteOne({ _id: sData[1] });
          await bot.sendMessage(chatId, "Заметка удалена!");
          break;
        default:
          return;
      }
    } catch (e) {
      console.log(e);
    }
  });
};
start();
