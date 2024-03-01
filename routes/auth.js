const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (await User.authenticate(username, password)) {
      await User.updateLoginTimestamp(username);
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ msg: `WELCOME BACK, ${username}`, token });
    }
    throw new ExpressError(`Invalid username/password`, 400);
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    const newUser = await User.register(
      username,
      password,
      first_name,
      last_name,
      phone
    );
    const token = jwt.sign({ username: newUser.username }, SECRET_KEY);
    return res.json({
      msg: `User ${newUser.username} created. Welcome!`,
      token,
    });
  } catch (err) {
    if (err.code === "23505") {
      return next(
        new ExpressError("Username taken. Please pick another!", 400)
      );
    }
    return next(err);
  }
});

module.exports = router;
