"use strict";
//database
const db = require("./db");
//server running
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3100;
require("dotenv").config();
app.use(cors());
app.use(express.json());
const jwt = require("jsonwebtoken");
//encryption
const cryptoJS = require("crypto-js");
let base64 = require("base-64");
let string = "someusername:P@55w0rD!";
let encoded = base64.encode(string); // c29tZXVzZXJuYW1lOlBANTV3MHJEIQ==
let decoded = base64.decode(encoded); // someusername:P@55w0rD!
// errors
const notFoundHandler = require("./error-handlers/404");
const errorHandler = require("./error-handlers/500");
app.post("/signup", async (req, res) => {
  const userInfo = {
    user_type: req.body.user_type,
    id: req.body.id,
    username: req.body.username,
    password: req.body.password,
    mobile_no: req.body.mobile_no,
    email: req.body.email,
    address: req.body.address,
    full_name: req.body.full_name,
    department:req.body.department
  };
  try {
    if (
      !(
        userInfo.username &&
        userInfo.password &&
        userInfo.full_name &&
        userInfo.mobile_no &&
        userInfo.email
      )
    )
      res.status(400).json("All input is required");
    else if (userInfo.password < 8)
      res.status(400).json(" password must be 8 characters or above");
    else if (
      !(userInfo.mobile_no.toString().length == 10 && userInfo.mobile_no)
    )
      res.status(400).json(" mobile number must be 10 digits");
    else if (!userInfo.mobile_no)
      res.status(400).json("mobile_no field is required");
    else if (!userInfo.username)
      res.status(400).json("username field is required");
    else if (!userInfo.full_name)
      res.status(400).json("fullname field is required");
    else {
      const usernameQuery = `
    select username from users where username = '${userInfo.username}'`;
      const user = await db.query(usernameQuery);
      const isExist = await db.query(
        "SELECT  * from users where username='" + userInfo.username + "'"
      );
      if (isExist.rowCount > 0) {
        res.status(400).json("USER ALREADY EXISTS");
      } else {
        const encrypted = await cryptoJS.AES.encrypt(
          userInfo.password,
          "D3N4K0"
        ).toString();
        const text = `INSERT INTO users(username, password, full_name, mobile_no, email)
        VALUES ($1, $2, $3, $4, $5);`;
        const values = [
          userInfo.username,
          encrypted,
          userInfo.full_name,
          userInfo.mobile_no,
          userInfo.email,
        ];
        const result = await db.query(text, values);
        if (userInfo.user_type == "customer") {
          const usernameQuery = `
            select id from users where username = '${userInfo.username}'`;
          const db_userQuery = await db.query(usernameQuery);
          const db_userID = await db_userQuery.rows[0]?.id;
          const text5 = `INSERT INTO customers(users_id, address, full_name, mobile_no, email)
            VALUES ($1, $2, $3, $4, $5);`;
          const signupInfo = [
            db_userID,
            userInfo.address,
            userInfo.full_name,
            userInfo.mobile_no,
            userInfo.email,
          ];
          const result5 = await db.query(text5, signupInfo);
          res.status(200).json(`WELCOME ${userInfo.username}`);
        } else if (userInfo.user_type == "employee") {
          const usernameQuery = `
            select id from users where username = '${userInfo.username}'`;
          const db_userQuery = await db.query(usernameQuery);
          const db_userID = await db_userQuery.rows[0]?.id;
          const textEmp= `INSERT INTO employees(users_id,username, password, mobile_no, email,department)
            VALUES ($1, $2, $3, $4 ,$5 ,$6);`;
          const signupInfoEmp = [
            db_userID,
              userInfo.username,
            encrypted,
            userInfo.mobile_no,
            userInfo.email,
            userInfo.department
          ];
          const resultEmp = await db.query(textEmp, signupInfoEmp);
          res.status(200).json(`WELCOME ${userInfo.username}`);
        } else res.status(200).json("REGISTERED SUCCESSFULLY");
      }
    }
  } catch (error) {
    res.status(400).json(error);
    console.log(error);
  }
});
app.post("/login/login", async (req, res) => {
  const userInfo = {
    username: req.body.username,
    password: req.body.password,
  };
  const text = `select * from users where username='${userInfo.username}'`;
  let token;
  let jwtSecretKey = "supersecret";
  process.env.TOKEN_RES = token;
  const result = await db.query(text);
  const dbPass = result.rows[0]?.password || "";
  let plainPass = cryptoJS.AES.decrypt(dbPass, "D3N4K0").toString(
    cryptoJS.enc.Utf8
  );

  if (plainPass == userInfo.password) {
    const userType = await db.query(
      `select * from employees where users_id='${result.rows[0]?.id}'`
    );
    console.log(userType.rows);
    const role = userType.rowCount > 0 ? "customer" : "employees";
    console.log(role);
    token = jwt.sign({ ...result?.rows[0], role }, jwtSecretKey, {
      expiresIn: "1hr",
    });
    res.status(200).json({ success: true, token });
  } else res.status(400).json("incorrect password or username");
  // await db.end();
});
app.get("/logout", function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect("/");
      }
    });
  }
});
app.get(`/meals/getmeals`, async (req, res) => {
  try {
    let page = req.query.page;
    let itemsPerPage = req.query.itemsPerPage;
    console.log(page);
    console.log(itemsPerPage);
    let jwtSecretKey = "supersecret";
    var token = req.headers.authorization.split(" ")[1];
    console.log(token);
    const verified = jwt.verify(token, jwtSecretKey);
    if (verified) {
      console.log("verified");
      const text = `SELECT * FROM meals LIMIT ${itemsPerPage} OFFSET ((${page} - 1) * ${itemsPerPage})`;
      const result = await db.query(text);
      res.status(200).json(result.rows);
    } else {
      // Access Denied
      return res.status(401).send("error");
    }
  } catch (error) {
    console.log(error);
    return res.status(401).send("ACCESS DENIED");
  }
});

app.post("/meals", async (req, res) => {
  //add meals
  const mealInfo = {
    id: req.body.id,
    meal_description: req.body.meal_description,
    price: req.body.price,
    meal_name: req.body.meal_name,
    image: req.body.image,
  };
  try {
    let jwtSecretKey = "supersecret";
    var token = req.headers.authorization.split(" ")[1];
    const verified = jwt.verify(token, jwtSecretKey);
    if (verified) {
      const text = `
    INSERT INTO meals(meal_description, price,meal_name,image) VALUES ($1,$2,$3,$4);`;
      const values = [
        mealInfo.meal_description,
        mealInfo.price,
        mealInfo.meal_name,
        mealInfo.image,
      ];
      const result = await db.query(text, values);
      res.status(200).json(mealInfo);
    } else {
      return res.status(401).send("ACCESS DENIED");
    }
  } catch {
    return res.status(401).send("UNAUTHORIZED");
  }
});
// ----------------------------------------------------------------------
app.post("/orders", async (req, res) => {
  try {
    console.log(req.body);
    const orderInfo = {
      total_price: req.body.total_price,
      order_date: req.body.order_date,
      order_no: req.body.order_no,
      customer_id: req.body.customer_id,
    };
    if (!(orderInfo.total_price && orderInfo.order_date && orderInfo.order_no))
      res.status(400).json("All input is required");
    let jwtSecretKey = "supersecret";
    var token = req.headers.authorization.split(" ")[1];
    const verified = jwt.verify(token, jwtSecretKey);
    if (verified) {
      const text = `
        INSERT INTO orders(total_price, order_date,order_no,customer_id) VALUES ($1,$2,$3,$4);`;
      const values = [
        orderInfo.total_price,
        orderInfo.order_date,
        orderInfo.order_no,
        orderInfo.customer_id,
        orderInfo.status,
        orderInfo["order_status_id"],
      ];
      const result = await db.query(text, values);
      res.status(200).send(result);
    }
  } catch (error) {
    res.status(200).json(error);
  }
});
app.post("/cart", async (req, res) => {
  const mealInfo = {
    id: req.body.id,
    meal_description: req.body.meal_description,
    price: req.body.price,
    meal_name: req.body.meal_name,
    image: req.body.image,
  };
  const text = `INSERT INTO cart(meal_description, price,meal_name,image) VALUES ($1,$2,$3,$4);`;
  const values = [
    mealInfo.meal_description,
    mealInfo.price,
    mealInfo.meal_name,
    mealInfo.image,
  ];
  const result = await db.query(text, values);
});
app.get("/order/:customer_id", async (req, res) => {
  const { customer_id } = req.params;
  const { rows } = await db.query("SELECT * FROM orders WHERE id = $1", [
    customer_id,
  ]);
  res.send(rows[0]);
});
app.post("/order/:status", async (req, res) => {
  const orderInfo = {
    id: req.body.id,
    order_status_id: req.body.order_status_id,
  };
  const text = `
    UPDATE orders(order_status_id) VALUES ($1) WHERE id=($2);`;
  const values = [orderInfo.order_status_id, orderInfo.id];
  const result = await db.query(text, values);
  res.status(200).send("Updated");
});
app.get("/bad", (req, res, next) => {
  next("error from bad end point");
});
app.get("*", (req, res) => {
  res.status(404).send("Sorry, we couldn't find what you were looking for 😱");
});
app.use("*", notFoundHandler);
app.use(errorHandler);
app.listen(port, () => console.log(`Server started on port ${port}`));
