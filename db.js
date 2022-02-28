const { Pool } = require("pg");

var credentials ={
    host: "localhost",
    port:"5432",
    user: "rest",
    password: "rest",
    database: "restdb",

  };
const pool = new Pool(credentials);
module.exports=pool
 