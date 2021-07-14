const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1 register
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectQuery);
  console.log(dbUser);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addUser = `
          insert into user values(
              '${username}',
              '${name}',
              '${hashedPassword}',
              '${gender}',
              '${location}');`;
      await db.run(addUser);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

/*app.delete("/delete", async (request, response) => {
  await db.run(`delete from user where username="adam_richard";`);
  response.send("user deleted");
});
*/

//API 2 Login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(userQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);

    if (passwordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 change password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(userQuery);
  const passwordMatch = await bcrypt.compare(oldPassword, dbUser.password);
  if (passwordMatch === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db.run(`update user set
        password='${hashedNewPassword}' where
        username='${username}';`);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
