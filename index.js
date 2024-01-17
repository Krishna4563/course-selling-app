const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const PORT = 3000;

const secretKeyAdmin = "s3cr3tk3yAdm1n";
const secretKeyUser = "s3cr3tk3yUs3r";

const generateJwtAdmin = (user) => {
  const payload = { username: user.username };
  return jwt.sign(payload, secretKeyAdmin, { expiresIn: "1h" });
};

const authenticateJwtAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, secretKeyAdmin, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const generateJwtUser = (user) => {
  const payload = { username: user.username };
  return jwt.sign(payload, secretKeyUser, { expiresIn: "1h" });
};

const authenticateJwtUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, secretKeyUser, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Admin Routes

app.post("/admin/signup", (req, res) => {
  const admin = req.body;
  const existingAdmin = ADMINS.find((a) => a.username === admin.username);

  if (existingAdmin) {
    res.status(403).json({ message: "Admin already exists" });
  } else {
    ADMINS.push(admin);
    const token = generateJwtAdmin(admin);
    res.status(403).json({ message: "Admin created successfully !", token });
  }
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.headers;

  const admin = ADMINS.find(
    (a) => a.username === username && a.password === password
  );

  if (admin) {
    const token = generateJwtAdmin(admin);
    res.status(403).json({ message: "Admin logged in successfully !", token });
  } else {
    res.status(403).json({ message: "Admin authentication failed :(" });
  }
});

app.post("/admin/course", authenticateJwtAdmin, (req, res) => {
  const course = req.body;
  course.id = COURSES.length + 1;
  COURSES.push(course);
  res
    .status(403)
    .json({ message: "Course created successfully", courseId: course.id });
});

app.put("/admin/course/:courseId", authenticateJwtAdmin, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find((c) => c.id === courseId);

  if (course) {
    Object.assign(course, req.body);
    res.status(403).json({ message: "Course updated successfully !" });
  } else {
    res.status(403).json({ message: "Course not found" });
  }
});

app.get("/admin/course", authenticateJwtAdmin, (req, res) => {
  res.json({ courses: COURSES });
});

// User Routes

app.post("/user/signup", (req, res) => {
  const user = req.body;
  const existingUser = USERS.find((u) => u.username === user.username);
  if (existingUser) {
    res.status(403).json({ message: "User already exists" });
  } else {
    USERS.push(user);
    const token = generateJwtUser(user);
    res.json({ message: "User created successfully", token });
  }
});

app.post("/user/login", (req, res) => {
  const { username, password } = req.headers;
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    const token = generateJwtUser(user);
    res.json({ message: "Logged in successfully", token });
  } else {
    res.status(403).json({ message: "User authentication failed" });
  }
});

app.get("/user/course", authenticateJwtUser, (req, res) => {
  res.json({ courses: COURSES });
});

app.post("/user/course/:courseId", authenticateJwtUser, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find((c) => c.id === courseId);
  if (course) {
    const user = USERS.find((u) => u.username === req.user.username);
    if (user) {
      if (!user.purchasedCourses) {
        user.purchasedCourses = [];
      }
      user.purchasedCourses.push(course);
      res.json({ message: "Course purchased successfully" });
    } else {
      res.status(403).json({ message: "User not found" });
    }
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

app.get("/user/purchasedCourses", authenticateJwtUser, (req, res) => {
  const user = USERS.find((u) => u.username === req.user.username);
  if (user && user.purchasedCourses) {
    res.json({ purchasedCourses: user.purchasedCourses });
  } else {
    res.status(404).json({ message: "No courses purchased" });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
