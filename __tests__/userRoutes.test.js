const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

const request = require("supertest");
const app = require("../app");

let testToken;
let testToken2;
beforeEach(async function () {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
  let u = await request(app).post("/auth/register").send({
    username: "test",
    password: "password",
    first_name: "Test",
    last_name: "Testy",
    phone: "+14155550000",
  });
  testToken = u.body.token;

  let u2 = await request(app).post("/auth/register").send({
    username: "test2",
    password: "password",
    first_name: "Test2",
    last_name: "Testy2",
    phone: "+14155552222",
  });
  testToken2 = u2.body.token;

  let m1 = await Message.create({
    from_username: "test",
    to_username: "test2",
    body: "u1-to-u2",
  });
  let m2 = await Message.create({
    from_username: "test2",
    to_username: "test",
    body: "u2-to-u1",
  });
});

describe("GET /users", () => {
  test("get a list of all users", async () => {
    const res = await request(app).get("/users");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        username: "test",
        first_name: "Test",
        last_name: "Testy",
        phone: "+14155550000",
      },
      {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      },
    ]);
  });
});

describe("GET /users/:username", () => {
  test("get a single user", async () => {
    const res = await request(app).get(`/users/test`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      username: "test",
      first_name: "Test",
      last_name: "Testy",
      phone: "+14155550000",
      join_at: expect.any(String),
      last_login_at: expect.any(String),
    });
  });

  test("Returns 404 with invalid username", async () => {
    const res = await request(app).get(`/users/test_wrong`);
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /users/:username/to", () => {
  test("get a list of messages to the user", async () => {
    const res = await request(app)
      .get(`/users/test/to`)
      .send({ _token: testToken });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        id: expect.any(Number),
        body: "u2-to-u1",
        sent_at: expect.any(String),
        read_at: null,
        from_user: {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155552222",
        },
      },
    ]);
  });

  test("returns 401 without token", async () => {
    const res = await request(app).get(`/users/test/to`);
    expect(res.statusCode).toBe(401);
  });

  test("returns 401 with incorrect token", async () => {
    const res = await request(app)
      .get(`/users/test/to`)
      .send({ _token: testToken2 });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /users/:username/from", () => {
  test("get a list of messages from the user", async () => {
    const res = await request(app)
      .get(`/users/test/from`)
      .send({ _token: testToken });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        id: expect.any(Number),
        body: "u1-to-u2",
        sent_at: expect.any(String),
        read_at: null,
        to_user: {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155552222",
        },
      },
    ]);
  });

  test("returns 401 without token", async () => {
    const res = await request(app).get(`/users/test/from`);
    expect(res.statusCode).toBe(401);
  });

  test("returns 401 with incorrect token", async () => {
    const res = await request(app)
      .get(`/users/test/from`)
      .send({ _token: testToken2 });
    expect(res.statusCode).toBe(401);
  });
});

afterAll(async function () {
  await db.end();
});
