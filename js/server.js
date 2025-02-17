const express = require("express");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 5500;
const cors = require("cors");
//const authRouter = require ('./authRouter.js')
const adminEmail = "admin@refor.by";
const adminPassword = "admin";
const { PythonShell } = require("python-shell");
const fs = require("fs");
const path = require("path");

var isLoggined = false;
var isAvailable = [true, true, true, true, true, true, true, true, true, true];
var openingTime = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "13:00",
  "15:00",
  "12:00",
  "13:20",
  "13:20",
  "13:20",
];
const cookieParser = require("cookie-parser");

const ExcelJS = require("exceljs");
const { randomUUID } = require("crypto");
const e = require("express");

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../")));
app.use((req, res, next) => {
  const allowedRoutes = [
    "/setTime",
    "/main",
    "/game",
    "/categories/",
    "/about",
    "/register",
    "/login",
    "/surveys/",
    "/setting",
    "/result",
    "/gameResult",
    "/users",
    "/user-game-results",
    "/download-excel",
    "/user-results",
    "/is-available",
    "/send-event",
    "/",
    "/opening-time",
    "/education",
    "/excursion",
    "/stages",
  ]; // Список допустимых маршрутов
  const requestedRoute = req.path;

  if (
    !allowedRoutes.includes(requestedRoute) &&
    !requestedRoute.startsWith("/users") &&
    !requestedRoute.startsWith("/allowTest/") &&
    !requestedRoute.startsWith("/closeTest/") &&
    !requestedRoute.startsWith("/results") &&
    !requestedRoute.startsWith("/surveys/survey") &&
    !requestedRoute.startsWith("/categories") &&
    !requestedRoute.startsWith("/surveys/survey") &&
    !requestedRoute.startsWith("/main") &&
    !requestedRoute.startsWith("/gameResults/") &&
    !requestedRoute.startsWith("/education") &&
    !requestedRoute.startsWith("/excursion") &&
    !requestedRoute.startsWith("/games") &&
    !requestedRoute.startsWith("/account-data") &&
    !requestedRoute.startsWith("/polls") &&
    !requestedRoute.startsWith("/poll-result") &&
    !requestedRoute.startsWith("/download-poll-results") &&
    !requestedRoute.startsWith("/stages") &&
    !requestedRoute.startsWith("/getStageResult") &&
    !requestedRoute.startsWith("/stage") &&
    !requestedRoute.startsWith("/download-excel-festival") &&
    !requestedRoute.startsWith("/users") &&
    !requestedRoute.startsWith("/idCardResults")
  ) {
    return res.status(404).send("Страница не найдена");
  }

  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

mongoose.connect(
  "mongodb+srv://stanislavrefor:ZlF0Hq6btsMPK6jm@cluster0.cuite.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //pkFactory: {createPk: () => new }
  }
);

const userSchema = new mongoose.Schema({
  //username: String,
  id_card: String,
  creation_date: Date,
  password: String,
  isAdmin: Boolean,
  email: String,
  name: String,
  surname: String,
  // patronymic: String,
  birthDate: String,
  // stateEducationalInstitution: String,
  // faculty: String,
  // group: String,
});

const resultSchema = new mongoose.Schema({
  email: String,
  result: String,
  time: String,
  test_id: String,
  category: String,
});

const gameResultSchema = new mongoose.Schema({
  email: String,
  game_id: String,
  question_id: String,
  result: String,
  time: String,
});

const pollResultSchema = new mongoose.Schema({
  name: String,
  email: String,
  questions: [
    new mongoose.Schema({
      title: String,
      name: String,
      value: [String],
      displayValue: String,
      data: [
        new mongoose.Schema({
          name: String,
          title: String,
          value: String,
          displayValue: String,
        }),
      ],
    }),
  ],
});

const festivalNaukiSchema = new mongoose.Schema({
  card_id: String,
  stages: [
    new mongoose.Schema({
      id: String,
      name: String,
      result: String,
      raw_answers: {type: String, default:'none'},
    }),
  ],
});

const Result = mongoose.model("results", resultSchema);

const User = mongoose.model("users", userSchema);

const GameResult = mongoose.model("game_results", gameResultSchema);

const PollResult = mongoose.model("poll_results", pollResultSchema);

const FestivalNauki = mongoose.model(
  "festival_nauki_results",
  festivalNaukiSchema
);

app.get("/", function (request, response) {
  // отправляем ответ
  response.send("<h2>Привет Express!</h2>");
});

app.get("/lastIdCard", async (req, res) => {
  const lastUser = await User.find().exec();
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  console.log(lastUser);
  response.send(lastUser);
  //res.send("");
});

app.get("/idCardResults/card:id", async (req, res) => {
  const cardResults = await FestivalNauki.findOne({ card_id: req.params.id });
  if (!cardResults) res.send({ msg: "Not found" });
  else {
    res.send(cardResults);
  }
});

app.get("/idCardResults/milo:email", async (req, res) => {
  //console.log(req.params);
  const cardResults = await User.findOne({ email: req.params.email });
  if (!cardResults) res.send({ msg: "Not found" });
  else {
    res.send(cardResults);
  }
});

app.get("/users/id:id", async (req, res) => {
  //console.log(req.params);
  const user = await User.findOne({ id_card: req.params.id });
  if (!user) res.send({ msg: "Not found" });
  else {
    res.send(user);
  }
});

app.get("/getStageResult/card-id:cardId/stage-id:stageId", async (req, res) => {
  const userStageResult = await FestivalNauki.findOne({
    card_id: req.params.cardId,
    "stages.id": req.params.stageId.toString(),
  }).exec();

  bool = false;

  userStageResult?.stages.forEach((stage) => {
    if (stage.id === req.params.stageId.toString()) {
      if (stage.result !== "0") {
        res.send(true);
        bool = true;
      }
    }
  });
  if (!bool) res.send(bool);
});

// Регистрация
app.post("/register", async (req, res) => {
  const lastIdCard = (await User.find().sort({ _id: -1 }).limit(1)).at(
    0
  ).id_card;
  if (lastIdCard) {
    const new_str = (parseInt(lastIdCard.substring(2)) + 1).toString();
    req.body.id_card = "fn" + new_str.padStart(3, "0");
  } else {
    req.body.id_card = "fn001";
  }
  const user = new User(req.body);
  const users = await User.find().exec();
  const reset = users.find((item) => item.email === user.email);
  const festivalNauki = new FestivalNauki({
    card_id: req.body.id_card,
    stages: [
      {
        id: "0",
        name: "Растениеводство",
        result: "0",
      },
      {
        id: "1",
        name: "Техника",
        result: "0",
      },
      {
        id: "2",
        name: "Животноводство",
        result: "0",
      },
      {
        id: "3",
        name: "Переработка",
        result: "0",
      },
      {
        id: "4",
        name: "тест БГСХА",
        result: "0",
      },
      {
        id: "5",
        name: "Собери урожай",
        result: "0",
      },
      {
        id: "6",
        name: "Экономика в ребусах",
        result: "0",
      },
    ],
  });

  if (!req.body.email) {
    res.send({ msg: "произошла ошибка ): попробуйте снова" });
  }

  if (!reset) {
    const result = await user.save();
    await festivalNauki.save();
    if (user.email == adminEmail && user.password == adminPassword) {
      IsAdmin = true;
    } else {
      IsAdmin = false;
    }
    isLoggined = true;
    res.send({
      password: user.password,
      email: user.email,
      isAdmin: IsAdmin,
    });
  } else {
    res.send({ msg: "пользователь с такой почтой уже существует" });
  }
});

// Авторизация
app.post("/login", async (req, res) => {
  //console.log(req);
  const { email, password } = req.body;
  const user = await User.findOne({ email, password }).exec();
  if (user) {
    if (user.email == adminEmail && user.password == adminPassword) {
      IsAdmin = true;
    } else {
      IsAdmin = false;
    }
    isLoggined = true;
    res.send({
      password: user.password,
      email: user.email,
      isAdmin: IsAdmin,
    });
  } else {
    res.status(401).send({ message: "Неверное имя пользователя или пароль" });
  }
});

app.post("/result", async (req, res) => {
  const result = new Result(req.body);
  console.log(result);
  const results = await Result.find().exec();
  const test_id = req.body.test_id;

  // if (result && ((test_id != 1) && (test_id != 2))) {
  if (result) {
    const saveResulst = await result.save();
    res.send({
      message: "Результат успешно записан",
    });
  } else {
    res.status(401).send({ message: "Ошибка при записи результата" });
  }
});

app.post("/poll-result", async (req, res) => {
  console.log("POLL RESULT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log(JSON.stringify(req.body));
  // req.body.questions.forEach(question => {
  //   console.log(question.data);
  // });
  var pollResult = req.body;
  for (var i = 0; i < pollResult.questions.length; ++i) {
    //delete pollResult.poll[i].name;
    //delete pollResult.poll[i].value;
    delete pollResult.questions[i].isNode;
    //delete pollResult.questions[i].data;
  }
  //console.log(pollResult);
  const result = new PollResult(pollResult);
  try {
    const saveResulst = await result.save();
    res.send({
      message: "Результат успешно записан",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при записи");
  }
});

app.post("/gameResult", async (req, res) => {
  const gameResult = new GameResult(req.body);
  //const gameResults = await GameResult.find().exec();
  await gameResult.save();
  res.send("Game result is saved");
});

app.post("/allowTest/:id", async (req, res) => {
  isAvailable[req.params.id - 1] = true;
  res.send(req.params.id);
});

app.post("/closeTest/:id", async (req, res) => {
  isAvailable[req.params.id - 1] = false;
  res.send(isAvailable[req.params.id - 1]);
});

//установка времени в массив админом
app.post("/setTime", async (req, res) => {
  const timeStart = req.body.time;
  const id = req.body.id;
  openingTime[id - 1] = timeStart;

  res.send("super");
});

// Получение всех пользователей (для администратора)
app.get("/users", async (req, res) => {
  const users = await User.find().exec();
  res.send(users);
});

// Удаление пользователя (для администратора)
app.delete("/users/:id", async (req, res) => {
  const result = await User.findByIdAndDelete(req.params.id).exec();
  res.send(result);
});

app.post("/stages/update", async (req, res) => {
  console.log(req.body);
  const find = await FestivalNauki.updateOne(
    { _id: req.body.id_card_results, "stages._id": req.body.stage_id },
    {
      $set: {
        "stages.$.result": req.body.newResult,
      },
    }
  );

  res.send({ msg: "успешно" });
});

app.post("/stages/updateEvery", async (req, res) => {
  console.log(req.body);

  const find = await FestivalNauki.updateOne(
    { card_id: req.body.id_card_results, "stages.id": req.body.stage_id },
    {
      $set: {
        "stages.$.result": req.body.newResult,
        "stages.$.raw_answers": req.body.raw_answers ? req.body.raw_answers : "none",
      },
    }
  );

  res.send({ msg: "успешно" });
});

app.delete("/gameResults/:user", async (req, res) => {
  console.log("delete");

  //const result = await GameResult.findByIdAndDelete(req.params.id).exec();
  const result = await GameResult.deleteMany({ email: req.params.user }).exec();
  res.send(result);
});

app.get("/results", async (req, res) => {
  const results = await Result.find().exec();
  res.send(results);
});

app.get("/main", (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  const mainPath = path.join(__dirname, "../main.html");
  res.sendFile(mainPath);
});

// app.get('/game', (req, res) => {
//   if (!req.headers.cookie) {
//     return res.redirect('/login');
//   }
//   const gamePath = path.join(__dirname, '../game.html');
//   res.sendFile(gamePath);
// })

app.get("/about", (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  const aboutPath = path.join(__dirname, "../about.html");
  res.sendFile(aboutPath);
});

app.get("/categories/", (req, res) => {
  const cookieValue = req.cookies.email;

  if (cookieValue) {
    //surveysPath = path.join(__dirname, '../surveys/.ejs');
    surveysPath = path.join(__dirname, "../category/category.ejs");
    res.render(surveysPath);
  } else {
    res.redirect("/login");
  }
});

//server stages process
app.get("/stages/", (req, res) => {
  const cookieValue = req.cookies.email;

  if (cookieValue) {
    //surveysPath = path.join(__dirname, '../surveys/.ejs');
    surveysPath = path.join(__dirname, "../stages/stages.ejs");
    res.render(surveysPath);
  } else {
    res.redirect("/login");
  }
});

app.get("/stages/category:num", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  const userEmail = req.headers.cookie.replace(
    /(?:(?:^|.*;\s*)email\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
  );
  searchUser = await Result.findOne({
    email: userEmail,
    test_id: req.params.num,
  }).exec();
  surveysPath = path.join(__dirname, `stage${req.params.num}.html`);
  if (!searchUser) {
    res.sendFile(surveysPath);
  } else {
    res.redirect(`/stages`);
  }
});

app.get("/stages/stage:num", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  const userEmail = req.headers.cookie.replace(
    /(?:(?:^|.*;\s*)email\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
  );
  searchUser = await Result.findOne({
    email: userEmail,
    test_id: req.params.num,
  }).exec();
  surveysPath = path.join(__dirname, `stage${req.params.num}.html`);
  if (!searchUser) {
    res.sendFile(surveysPath);
  } else {
    res.redirect(`/stages`);
  }
});

app.get("/stages/results", async (req, res) => {
  const stageResultsPath = path.join(__dirname, `../stages/results.html`);
  res.sendFile(stageResultsPath);
});

app.get("/stage/opros:id", async (req, res) => {
  console.log("server");
  stageResultsPath = path.join(
    __dirname,
    `../stages/stage${req.params.id}.html`
  );
  res.sendFile(stageResultsPath);
});

app.get("/stage/category_:id", async (req, res) => {
  stageResultsPath = path.join(
    __dirname,
    `../stages/stage_category${req.params.id}.ejs`
  );
  res.render(stageResultsPath);
});

/////////////

app.get("/categories/category:id", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  categoriesPath = path.join(
    __dirname,
    `../surveys/surveysPage${req.params.id}.ejs`
  );
  res.render(categoriesPath, { isAvailable });
});

app.get("/categories/category:id/survey:num", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  const userEmail = req.headers.cookie.replace(
    /(?:(?:^|.*;\s*)email\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
  );
  searchUser = await Result.findOne({
    email: userEmail,
    test_id: req.params.num,
  }).exec();
  surveysPath = path.join(__dirname, `survey${req.params.num}.html`);
  if (isAvailable[req.params.num - 1] && !searchUser) {
    res.sendFile(surveysPath);
  } else {
    res.redirect(`/categories/category${req.params.id}`);
  }
});

app.get("/education", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  educationPath = path.join(__dirname, "../education/education.ejs");
  res.render(educationPath);
});

app.get("/excursion", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  excursionPath = path.join(__dirname, "../excursion/excursion.ejs");
  res.render(excursionPath);
});

app.get("/excursion/:excursion", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  excursionPath = path.join(
    __dirname,
    `../excursions/${req.params.excursion}/${req.params.excursion}.ejs`
  );
  res.render(excursionPath);
  //res.render(categoriesPath, {isAvailable});
});

app.get("/excursion/:excursion/:category", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  excurisonPath = path.join(
    __dirname,
    `../excursions/${req.params.excursion}/categories/${req.params.category}.ejs`
  );
  //console.log(excursionPath);
  res.render(excurisonPath);
});

app.get("/excursion/:excursion/:category/test:id", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  testPath = path.join(
    __dirname,
    `../excursions/${req.params.excursion}/categories/${req.params.category}/test${req.params.id}.html`
  );
  res.sendFile(testPath);
  //res.render(categoriesPath, {isAvailable});
});

app.get("/excursion/:excursion/:category/results", (req, res) => {
  resultsPath = path.join(
    __dirname,
    `../excursions/${req.params.excursion}/categories/results.html`
  );
  res.sendFile(resultsPath);
});

app.get("/polls", async (req, res) => {
  // if (!req.headers.cookie) {
  //   return res.redirect("/login");
  // }
  pollPath = path.join(__dirname, "../polls/polls.ejs");
  res.render(pollPath);
});

app.get("/polls/poll:id", async (req, res) => {
  // if (!req.headers.cookie) {
  //   return res.redirect("/login");
  // }
  if (req.params.id === "1") {
    res.redirect(`https:///polls`);
  }
  pollPath = path.join(__dirname, `../polls/poll${req.params.id}.html`);
  res.sendFile(pollPath);
});

app.get("/games", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  gamesPath = path.join(__dirname, "../games/games.ejs");
  res.render(gamesPath);
});

app.get("/games/:id", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  gamePath = path.join(__dirname, `../${req.params.id}.html`);
  //res.render(categoriesPath, {isAvailable});
  console.log(gamePath);
  res.sendFile(gamePath);
  //res.render(gamePath);
});

app.get("/account-data/:email", async (req, res) => {
  if (!req.headers.cookie) {
    return res.redirect("/login");
  }
  searchUser = await User.findOne({ email: req.params.email }).exec();
  //console.log(searchUser);
  res.send(searchUser);
});

app.get("/setting", async (req, res) => {
  const cookieValue = req.cookies.email;
  const currentUser = await User.findOne({ email: cookieValue }).exec();
  if (currentUser) {
    if (currentUser.isAdmin) {
      surveysPath = path.join(__dirname, "../setting.html");
      res.sendFile(surveysPath);
    } else {
      res.redirect("/login");
    }
  }
  // if (cookieValue === 'admin') {
  //   surveysPath = path.join(__dirname, '../setting.html');
  //   res.sendFile(surveysPath);
  // } else {
  //   res.redirect("/login");
  // }
});

//
app.get("/login", (req, res) => {
  login2Path = path.join(__dirname, "../login.html");
  res.sendFile(login2Path);
});

app.get("/register", (req, res) => {
  login2Path = path.join(__dirname, "../register.html");
  res.sendFile(login2Path);
});

app.get("/user-game-results", async (req, res) => {
  const gameResults = await GameResult.find().exec();
  const email = req.cookies.email;
  const userGameResults = [];
  gameResults.forEach((gameResult) => {
    if (gameResult.email === email) {
      userGameResults.push(gameResult);
    }
  });
  res.send(userGameResults);
});

app.get("/download-poll-results", async (req, res) => {
  const agg = [
    {
      $unwind: {
        path: "$questions",
      },
    },
    {
      $unwind: {
        path: "$questions.data",
      },
    },
    {
      $group: {
        _id: {
          name: "$name",
          question_title: "$questions.title",
          value: "$questions.data.displayValue",
        },
        count: {
          $count: {},
        },
      },
    },
    {
      $group: {
        _id: {
          name: "$_id.name",
          question_title: "$_id.question_title",
        },
        answers: {
          $push: {
            item: "$_id.value",
            count: "$count",
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.name",
        questions: {
          $push: {
            title: "$_id.question_title",
            answers: "$answers",
          },
        },
      },
    },
  ];

  const client = await mongodb.MongoClient.connect(
    "mongodb+srv://NIIinAPK:nii123@survey.yvbwk8s.mongodb.net/?retryWrites=true&w=majority"
  );
  const coll = client.db("test").collection("poll_results");
  const cursor = coll.aggregate(agg);
  const results = await cursor.toArray();
  await client.close();

  // Создание книги Excel и добавление данных
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");
  worksheet.columns = [
    { header: "", key: "col1" },
    { header: "", key: "col2" },
    { header: "", key: "col3" },
    { header: "", key: "col4" },
  ];

  var opts = { charts: [] };
  let i = 1;
  results.forEach((result) => {
    worksheet.getRow(i).values = {
      col1: `${result._id}`,
    };
    ++i;
    result.questions.forEach((question) => {
      const fields = [];
      const values = [];
      const values2 = [];
      worksheet.getRow(i).values = {
        col2: `${question.title}`,
      };
      i += 2;
      question.answers.forEach((answer) => {
        fields.push(answer.item);
        values.push(Number.parseInt(answer.count));
        worksheet.getRow(i).values = {
          col2: `${answer.item}`,
          col3: `${answer.count}`,
        };
        ++i;
      });
      ++i;
      // values.reduce(function(a, b){
      //   return a + b;
      // }, 0);
      var sum = 0;
      values.forEach((value) => {
        sum += value;
      });
      for (var j = 0; j < values.length; ++j) {
        values2.push(values[j]);
        values[j] = ((values[j] / sum) * 100).toFixed(2);
      }
      console.log(__dirname);
      console.log(__dirname + "/mult.xlsx");
      opts.charts.push({
        chart: "bar",
        templatePath: __dirname + "/mult.xlsx",
        titles: [
          "%",
          //"количество"
        ],
        fields: fields,
        data: {
          "%": Object.assign({}, ...fields.map((n, i) => ({ [n]: values[i] }))),
          //"количество": Object.assign({}, ...fields.map((n, i) => ({ [n]: values2[i] }))),
        },
        chartTitle: `${question.title}`,
      });
    });
    ++i;
  });

  var xlsxChart = new XLSXChart();
  xlsxChart.generate(opts, function (err, data) {
    res.set({
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": "attachment; filename=char.xlsx",
      "Content-Length": data.length,
    });
    res.status(200).send(data);
  });

  //const users = await User.find().exec();
  //const results = await PollResult.find().exec();
  // console.log(results);
  // let i = 1;
  // users.forEach((user) => {
  //   results.forEach((result) => {
  //     if (result.email === user.email) {
  //       worksheet.getRow(i).values = {
  //         col1: `${user.email}`,
  //         col2: `${user.username}`,
  //       };
  //       ++i;
  //       result.poll.forEach((question) => {
  //         worksheet.getRow(i).values = {
  //           col1: `${question.title}`,
  //           col2: `${question.displayValue}`,
  //         }
  //         ++i
  //       });
  //       ++i;
  //     }
  //   });
  // });

  // Установка HTTP-заголовков для скачивания файла
  // res.setHeader(
  //   "Content-Type",
  //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  // );
  // res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");

  //worksheet.autoFitColumns();
  // worksheet.columns.forEach(function (column, i) {
  //   let maxLength = 0;
  //   column["eachCell"]({ includeEmpty: true }, function (cell) {
  //     var columnLength = cell.value ? cell.value.toString().length + 2 : 10;
  //     if (columnLength > maxLength) {
  //       maxLength = columnLength;
  //     }
  //   });
  //   column.width = maxLength < 10 ? 10 : maxLength;
  // });

  // // Сохранение книги в поток ответа
  // workbook.xlsx
  //   .write(res)
  //   .then(() => {
  //     res.end();
  //   })
  //   .catch((error) => {
  //     console.log("Ошибка при сохранении данных:", error);
  //     res.status(500).send("Произошла ошибка");
  //   });
});

app.get("/download-excel", async (req, res) => {
  // Создание книги Excel и добавление данных
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");
  worksheet.columns = [
    { header: "Почта", key: "email" },
    { header: "Имя пользователя", key: "username" },
    { header: "Категория", key: "category" },
    { header: "Номер теста", key: "test_id" },
    { header: "Количество правильных ответов", key: "correct" },
    { header: "Всего отвечено", key: "no_of_questions" },
    { header: "Всего вопросов", key: "total" },
    { header: "Время выполнения в секундах", key: "time" },
  ];

  const users = await User.find().exec();
  const results = await Result.find().exec();
  let i = 2;
  users.forEach((user) => {
    let correct = 0;
    let no_of_questions = 0;
    let total = 0;
    results.forEach((result) => {
      if (result.email === user.email) {
        worksheet.getRow(i).values = {
          email: `${user.email}`,
          username: `${user.username}`,
          category: `${result.category}`,
          test_id: `${result.test_id}`,
          correct: `${JSON.parse(result.result)["correct_answers"]}`,
          no_of_questions: `${JSON.parse(result.result)["no_of_questions"]}`,
          total: `${JSON.parse(result.result)["total"]}`,
          time: `${result["time"]}`,
        };
        correct += JSON.parse(result.result)["correct_answers"];
        no_of_questions += JSON.parse(result.result)["no_of_questions"];
        total += JSON.parse(result.result)["total"];
        ++i;
      }
    });
  });

  // Установка HTTP-заголовков для скачивания файла
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");

  //worksheet.autoFitColumns();
  worksheet.columns.forEach(function (column, i) {
    let maxLength = 0;
    column["eachCell"]({ includeEmpty: true }, function (cell) {
      var columnLength = cell.value ? cell.value.toString().length + 2 : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength;
  });

  // Сохранение книги в поток ответа
  workbook.xlsx
    .write(res)
    .then(() => {
      res.end();
    })
    .catch((error) => {
      console.log("Ошибка при сохранении данных:", error);
      res.status(500).send("Произошла ошибка");
    });
});

app.get("/download-excel-festival", async (req, res) => {
  // Создание книги Excel и добавление данных
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");
  worksheet.columns = [
    { header: "id", key: "id" },
    { header: "Имя", key: "name" },
    { header: "email", key: "email" },
    { header: "Этап 1", key: "stage_1" },
    { header: "Этап 2", key: "stage_2" },
    { header: "Этап 3", key: "stage_3" },
    { header: "Этап 4", key: "stage_4" },
    { header: "Этап 5", key: "stage_5" },
    { header: "Этап 6", key: "stage_6" },
    { header: "Всего баллов", key: "total" },
  ];

  const users = await User.find().exec();
  const results = await FestivalNauki.find().exec();
  let i = 2;
  users.forEach((user) => {
    results.forEach((result) => {
      if (result.card_id === user.id_card) {
        console.log(result);
        worksheet.getRow(i).values = {
          id: `${user.id_card}`,
          name: `${user.name} ${user.surname}`,
          email: `${user.email}`,
          stage_1: `${result.stages[0].result}`,
          stage_2: `${result.stages[1].result}`,
          stage_3: `${result.stages[2].result}`,
          stage_4: `${result.stages[3].result}`,
          stage_5: `${result.stages[4].result}`,
          stage_6: `${result.stages[5].result}`,
          total: `${
            Number(result.stages[0].result) +
            Number(result.stages[1].result) +
            Number(result.stages[2].result) +
            Number(result.stages[3].result) +
            Number(result.stages[4].result) +
            Number(result.stages[5].result)
          }`,
        };
        ++i;
      }
    });
  });

  // Установка HTTP-заголовков для скачивания файла
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=festival_results.xlsx"
  );

  //worksheet.autoFitColumns();
  worksheet.columns.forEach(function (column, i) {
    let maxLength = 0;
    column["eachCell"]({ includeEmpty: true }, function (cell) {
      var columnLength = cell.value ? cell.value.toString().length + 2 : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength;
  });

  // Сохранение книги в поток ответа
  workbook.xlsx
    .write(res)
    .then(() => {
      res.end();
    })
    .catch((error) => {
      console.log("Ошибка при сохранении данных:", error);
      res.status(500).send("Произошла ошибка");
    });
});

app.get("/user-results", (req, res) => {
  resultsPath = path.join(__dirname, "../results.html");
  res.sendFile(resultsPath);
});

app.get("/is-available", async (req, res) => {
  res.send(isAvailable);
});

app.get("/opening-time", (req, res) => {
  res.send(openingTime);
});

// app.get('/send-event', (req, res) => {
//   // Отправка серверного события клиенту
//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');
//   res.flushHeaders();

//   res.write('event: update\n');  // Тип события
//   res.write(`data: ${JSON.stringify({ message: 'Update requested' })}\n\n`); // Данные события

//   // Закрытие соединения
//   res.end();
// });

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  const currentPath = path.dirname(__filename);
});

//app.get('/surveys/', (req, res) => {
//   const cookieValue = req.cookies.email;

//   if (cookieValue) {
//     //surveysPath = path.join(__dirname, '../surveys/.ejs');
//     surveysPath = path.join(__dirname, '../surveys/surveysPage1');
//     //res.sendFile(surveysPath)
//     res.render(surveysPath, { isAvailable });
//   } else {
//     res.redirect("/login");
//   }
// });

// app.get('/surveys/survey:id', async (req, res) => {
//   if (!req.headers.cookie) {
//     return res.redirect('/login');
//   }
//   const userEmail = req.headers.cookie.replace(/(?:(?:^|.*;\s*)email\s*\=\s*([^;]*).*$)|^.*$/, "$1");
//   searchUser = await Result.findOne({ email: userEmail, test_id: req.params.id }).exec();
//   surveysPath = path.join(__dirname, `survey${req.params.id}.html`);
//   if (isAvailable[req.params.id - 1] && !(searchUser)) {
//     res.sendFile(surveysPath);
//   }
//   else {
//     res.redirect("/surveys/");
//   }
// })
