const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const mongoose = require("mongoose");

app.use(express.json());

const PORT = 3000;

const secretKeyAdmin = "s3cr3tk3yAdm1n";
const secretKeyUser = "s3cr3tk3yUs3r";

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean,
});

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Course = mongoose.model("Course", courseSchema);

mongoose.connect(
  "mongodb+srv://user1:user1@cluster0.jadtxey.mongodb.net/courses",
  { useNewUrlParser: true, useUnifiedTopology: true, dbName: "courses" }
);

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

app.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (admin) {
    res.status(403).json({ message: "Admin already exists :(" });
  } else {
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    const token = generateJwtAdmin(newAdmin);
    res.status(200).json({ message: "Admin Created Successfully", token });
  }
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.headers;
  const admin = await Admin.findOne({ username, password });
  if (admin) {
    const token = generateJwtAdmin(admin);
    res.status(200).json({ message: "Admin logged in successfully", token });
  } else {
    res.status(403).json({ message: "Login Failed :(" });
  }
});

app.post("/admin/course", authenticateJwtAdmin, async (req, res) => {
  const course = await Course.findOne({});
  if (course) {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(200).json({ message: "Course created successfully" });
  } else {
    res.status(403).json({ message: "Error finding course! " });
  }
});

app.put("/admin/course/:courseId", authenticateJwtAdmin, async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
    new: true,
  });
  if (course) {
    res.json({ message: "Course updated successfully !" });
  } else {
    res.status(403).json({ message: "Course not found" });
  }
});

app.delete(
  "/admin/course/:courseId",
  authenticateJwtAdmin,
  async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if (course) {
      const targetCourse = await Course.findByIdAndDelete(req.params.courseId);
      await targetCourse.deleteOne();
      res.status(200).json({ message: "Course Deleted Successfully" });
    } else {
      res.status(403).json({ message: "Course not found !" });
    }
  }
);

app.get("/admin/course", authenticateJwtAdmin, async (req, res) => {
  const courses = await Course.find({});
  res.json({ courses });
});

// User Routes

// app.post("/user/signup", (req, res) => {
//   const user = req.body;
//   const existingUser = USERS.find((u) => u.username === user.username);
//   if (existingUser) {
//     res.status(403).json({ message: "User already exists" });
//   } else {
//     USERS.push(user);
//     const token = generateJwtUser(user);
//     res.json({ message: "User created successfully", token });
//   }
// });

// app.post("/user/login", (req, res) => {
//   const { username, password } = req.headers;
//   const user = USERS.find(
//     (u) => u.username === username && u.password === password
//   );
//   if (user) {
//     const token = generateJwtUser(user);
//     res.json({ message: "Logged in successfully", token });
//   } else {
//     res.status(403).json({ message: "User authentication failed" });
//   }
// });

// app.get("/user/course", authenticateJwtUser, (req, res) => {
//   res.json({ courses: COURSES });
// });

// app.post("/user/course/:courseId", authenticateJwtUser, (req, res) => {
//   const courseId = parseInt(req.params.courseId);
//   const course = COURSES.find((c) => c.id === courseId);
//   if (course) {
//     const user = USERS.find((u) => u.username === req.user.username);
//     if (user) {
//       if (!user.purchasedCourses) {
//         user.purchasedCourses = [];
//       }
//       user.purchasedCourses.push(course);
//       res.json({ message: "Course purchased successfully" });
//     } else {
//       res.status(403).json({ message: "User not found" });
//     }
//   } else {
//     res.status(404).json({ message: "Course not found" });
//   }
// });

// app.get("/user/purchasedCourses", authenticateJwtUser, (req, res) => {
//   const user = USERS.find((u) => u.username === req.user.username);
//   if (user && user.purchasedCourses) {
//     res.json({ purchasedCourses: user.purchasedCourses });
//   } else {
//     res.status(404).json({ message: "No courses purchased" });
//   }
// });

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
