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

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      "INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING username, password, first_name, last_name, phone",
      [username, hashedPassword, first_name, last_name, phone]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      "SELECT password FROM users WHERE username=$1",
      [username]
    );
    const user = result.rows[0];
    return await bcrypt.compare(password, user.password);
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

    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      "SELECT id, to_username, body, sent_at, read_at FROM messages WHERE from_username=$1",
      [username]
    );
    if (results.rows.length == 0) {
      throw new ExpressError("No user found", 404);
    }

    const from_messages_promises = results.rows.map(async (u) => {
      const to_user = await db.query(
        "SELECT username,first_name,last_name,phone FROM users WHERE username=$1",
        [u.to_username]
      );
      return {
        id: u.id,
        to_user: to_user.rows[0],
        body: u.body,
        sent_at: u.sent_at,
        read_at: u.read_at,
      };
    });
    const from_messages = await Promise.all(from_messages_promises);

    return from_messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      "SELECT id, from_username, body, sent_at, read_at FROM messages WHERE to_username=$1",
      [username]
    );
    if (results.rows.length == 0) {
      throw new ExpressError("No user found", 404);
    }

    const to_messages_promises = results.rows.map(async (u) => {
      const from_user = await db.query(
        "SELECT username, first_name, last_name, phone FROM users WHERE username=$1",
        [u.from_username]
      );
      return {
        id: u.id,
        from_user: from_user.rows[0],
        body: u.body,
        sent_at: u.sent_at,
        read_at: u.read_at,
      };
    });
    const to_messages = await Promise.all(to_messages_promises);

    return to_messages;
  }
}

module.exports = User;
