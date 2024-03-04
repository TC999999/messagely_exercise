const db = require("../db");
// const User = require("../models/user");
const Message = require("../models/message");

const request = require("supertest");
const app = require("../app");

let testToken;
let testToken2;
let testToken3;
beforeEach(async function () {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
  await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

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
});

describe("GET /:id", () => {
  test("see a message from the user it was send from", async () => {
    const res = await request(app)
      .get("/messages/1")
      .send({ _token: testToken });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      body: "u1-to-u2",
      sent_at: expect.any(String),
      read_at: null,
      from_user: {},
      from_user: {
        username: "test",
        first_name: "Test",
        last_name: "Testy",
        phone: "+14155550000",
      },
      to_user: {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      },
    });
  });

  test("see a message from the user it was sent to", async () => {
    const res = await request(app)
      .get("/messages/1")
      .send({ _token: testToken2 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      body: "u1-to-u2",
      sent_at: expect.any(String),
      read_at: null,
      from_user: {},
      from_user: {
        username: "test",
        first_name: "Test",
        last_name: "Testy",
        phone: "+14155550000",
      },
      to_user: {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      },
    });
  });

  test("Returns 404 if user is neither the recipient or the sender", async () => {
    let u3 = await request(app).post("/auth/register").send({
      username: "test3",
      password: "password",
      first_name: "Test3",
      last_name: "Testy3",
      phone: "+14155553333",
    });
    let testToken3 = u3.body.token;
    const res = await request(app)
      .get("/messages/1")
      .send({ _token: testToken3 });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /messages/post", () => {
  test("Creates a new message", async () => {
    const res = await request(app)
      .post("/messages/post")
      .send({ to_username: "test2", body: "test message", _token: testToken });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      id: 2,
      from_username: "test",
      to_username: "test2",
      body: "test message",
      sent_at: expect.any(String),
    });
  });

  test("Returns 401 without token", async () => {
    const res = await request(app)
      .post("/messages/post")
      .send({ to_username: "test2", body: "test message" });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /messages/:id/read", () => {
  test("User can mark their received messages as read", async () => {
    const res = await request(app)
      .post("/messages/1/read")
      .send({ _token: testToken2 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      read_at: expect.any(String),
    });
  });

  test("Returns 401 if user is not intended recipient", async () => {
    const res = await request(app)
      .post("/messages/1/read")
      .send({ _token: testToken });
    expect(res.statusCode).toBe(401);
  });
});

afterAll(async function () {
  await db.end();
});
