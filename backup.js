app.get("/data", async (req, res) => {
    const now = await db.query("SELECT NOW()");
    // await db.end();
    res.status(200).json(now.rows[0]["now"]);
  });

app.post("/user/generateToken", (req, res) => {
    // Validate User Here
    // Then generate JWT Token

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
        time: Date(),
        userId: 12,
    }

    const token = jwt.sign(data, jwtSecretKey);

    res.send(token);
});
app.get("/user/validateToken", (req, res) => {
    // Tokens are generally passed in the header of the request
    // Due to security reasons.

    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    try {
        const token = req.header(tokenHeaderKey);

        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
            return res.send("Successfully Verified");
        } else {
            // Access Denied
            return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }
});
app.get('/accessResource', (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    //Authorization: 'Bearer TOKEN'
    if (!token) {
        res.status(200).json({
            success: false, message: "im here?"
        })
        //Decoding the token
        const decodedToken = jwt.verify(token, "supersecret");
        res.status(200).json({
            success: true, data: {
                username: decodedToken.req.username,
                email: decodedToken.req.email
            }
        })
    }
})

  // const verified = jwt.verify(process.env.TOKEN_RES, jwtSecretKey);
  // console.log(verified);

  // if (verified) {
  //   const text = `SELECT * FROM meals LIMIT ${itemsPerPage} OFFSET ((${page} - 1) * ${itemsPerPage})`
  //   const result = await db.query(text);
  //   res.status(200).json(result.rows);
  //   return res.send("Successfully Verified")
  // }
  // else {
  //   return res.status(401).send("error");
  // }