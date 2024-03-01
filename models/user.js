/** User class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register(
    newUsername,
    newPassword,
    new_first_name,
    new_last_name,
    new_phone
  ) {
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      "INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING username, password, first_name, last_name, phone",
      [newUsername, hashedPassword, new_first_name, new_last_name, new_phone]
    );
    const newUser = results.rows[0];
    return newUser;
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    if (!username || !password) {
      throw new ExpressError("Both username and password are required", 400);
    }
    const results = await db.query("SELECT * from users WHERE username=$1", [
      username,
    ]);
    const user = results.rows[0];
    if (user) {
      return await bcrypt.compare(password, user.password);
    }
    throw new ExpressError(`Invalid username/password`, 400);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      "UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE username=$1",
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      "SELECT username, first_name, last_name, phone FROM users"
    );
    // const users = results.rows;
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      "SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username=$1",
      [username]
    );

    if (!results.rows[0]) {
      throw new ExpressError("No user found", 404);
    }
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {}

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {}
}

module.exports = User;
