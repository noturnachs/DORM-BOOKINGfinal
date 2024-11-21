const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();

// Email configuration for PrivateEmail
const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "bookit_db",
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const [existingUser] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)",
        [email, hashedPassword, firstName, lastName, "student"]
      );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const [users] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send user data without sensitive information
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    };

    res.json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

const generateConfirmationNumber = () => {
  const prefix = "BK";
  const randomNum = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `${prefix}${randomNum}`;
};

// Create a new booking
app.post("/api/dorms/:id/bookings", authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, semester, academicYear } = req.body;
    const dorm_id = req.params.id;
    const user_id = req.user.userId;

    // Generate confirmation number (assuming you have this function)
    const confirmation_number = generateConfirmationNumber();

    // Set initial statuses - these should ONLY be set on the server
    const status = "active"; // Initial booking status
    const payment_status = "unpaid"; // Initial payment status
    const payment_deadline = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    ).toISOString();

    // First, check if the dorm is available
    const [existingBookings] = await db.promise().query(
      `SELECT id FROM bookings 
         WHERE dorm_id = ? 
         AND ((start_date <= ? AND end_date >= ?) 
         OR (start_date <= ? AND end_date >= ?))
         AND status = 'active'`,
      [dorm_id, end_date, start_date, end_date, start_date]
    );

    if (existingBookings.length > 0) {
      return res
        .status(400)
        .json({ error: "Dorm is not available for these dates" });
    }

    // If available, create the booking
    const [result] = await db.promise().query(
      `INSERT INTO bookings (
          user_id, 
          dorm_id, 
          start_date, 
          end_date, 
          semester,
          academic_year,
          status,
          payment_status,
          payment_deadline,
          confirmation_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        dorm_id,
        start_date,
        end_date,
        semester,
        academicYear,
        status,
        payment_status,
        payment_deadline,
        confirmation_number,
      ]
    );

    // Verify the booking was created
    const [newBooking] = await db
      .promise()
      .query("SELECT * FROM bookings WHERE id = ?", [result.insertId]);

    if (!newBooking.length) {
      throw new Error("Booking creation failed");
    }

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertId,
      confirmation_number,
      status,
      payment_status,
      payment_deadline,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      error: "Failed to create booking",
      details: error.message,
    });
  }
});

// Add endpoint to update payment status (for admin use later)
app.patch("/api/bookings/:id/payment", authenticateToken, async (req, res) => {
  try {
    const { payment_status } = req.body;
    const booking_id = req.params.id;

    await db
      .promise()
      .query(
        "UPDATE bookings SET payment_status = ?, status = ? WHERE id = ?",
        [
          payment_status,
          payment_status === "paid" ? "active" : "pending",
          booking_id,
        ]
      );

    // If payment is confirmed, send another email
    if (payment_status === "paid") {
      const [bookings] = await db.promise().query(
        `SELECT u.email, u.first_name, d.name, b.semester, b.academic_year 
           FROM bookings b 
           JOIN users u ON b.user_id = u.id 
           JOIN dorms d ON b.dorm_id = d.id 
           WHERE b.id = ?`,
        [booking_id]
      );

      const booking = bookings[0];

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: "Dorm Booking Payment Confirmed",
        html: `
            <h2>Payment Confirmed!</h2>
            <p>Dear ${booking.first_name},</p>
            <p>Your payment for ${booking.name} has been confirmed.</p>
            <p>Your room is now secured for the ${
              booking.semester === "1" ? "First" : "Second"
            } Semester of Academic Year ${booking.academic_year} - ${
          parseInt(booking.academic_year) + 1
        }.</p>
            <p>Please keep this email for your records.</p>
          `,
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({ message: "Payment status updated successfully" });
  } catch (error) {
    console.error("Payment update error:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

app.get("/api/dorms/:id/reviews", async (req, res) => {
  try {
    const [reviews] = await db.promise().query(
      `SELECT r.*, u.first_name, u.last_name 
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.dorm_id = ?
         ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.post("/api/dorms/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    await db
      .promise()
      .query(
        "INSERT INTO reviews (dorm_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
        [req.params.id, req.user.userId, rating, comment]
      );
    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Failed to add review" });
  }
});

// Dorms Routes
app.get("/api/dorms", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const capacity = req.query.capacity;
    const available = req.query.available;

    let query = "SELECT * FROM dorms WHERE 1=1";
    const queryParams = [];

    // Add filters if they exist
    if (minPrice) {
      query += " AND price_per_night >= ?";
      queryParams.push(minPrice);
    }
    if (maxPrice) {
      query += " AND price_per_night <= ?";
      queryParams.push(maxPrice);
    }
    if (capacity) {
      query += " AND capacity >= ?";
      queryParams.push(capacity);
    }
    if (available !== undefined) {
      query += " AND available = ?";
      queryParams.push(available);
    }

    // Add pagination
    query += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    // Get dorms
    const [dorms] = await db.promise().query(query, queryParams);

    // Get total count for pagination
    const [countResult] = await db
      .promise()
      .query("SELECT COUNT(*) as total FROM dorms");
    const total = countResult[0].total;

    res.json({
      dorms,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching dorms:", error);
    res.status(500).json({ error: "Failed to fetch dorms" });
  }
});

app.post("/api/dorms", authenticateToken, async (req, res) => {
  try {
    const { name, description, capacity, price_per_night } = req.body;

    const [result] = await db
      .promise()
      .query(
        "INSERT INTO dorms (name, description, capacity, price_per_night) VALUES (?, ?, ?, ?)",
        [name, description, capacity, price_per_night]
      );

    res.status(201).json({
      message: "Dorm created successfully",
      dormId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single dorm by ID
app.get("/api/dorms/:id", async (req, res) => {
  try {
    const [dorms] = await db
      .promise()
      .query("SELECT * FROM dorms WHERE id = ?", [req.params.id]);

    if (dorms.length === 0) {
      return res.status(404).json({ error: "Dorm not found" });
    }

    res.json(dorms[0]);
  } catch (error) {
    console.error("Error fetching dorm:", error);
    res.status(500).json({ error: "Failed to fetch dorm" });
  }
});

app.patch(
  "/api/dorms/:id/availability",
  authenticateToken,
  async (req, res) => {
    try {
      const { available } = req.body;

      await db
        .promise()
        .query("UPDATE dorms SET available = ? WHERE id = ?", [
          available,
          req.params.id,
        ]);

      res.json({ message: "Dorm availability updated successfully" });
    } catch (error) {
      console.error("Error updating dorm:", error);
      res.status(500).json({ error: "Failed to update dorm" });
    }
  }
);

// Bookings Routes
app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const { dorm_id, start_date, end_date } = req.body;
    const user_id = req.user.userId;

    // Check if dorm exists
    const [dorms] = await db
      .promise()
      .query("SELECT * FROM dorms WHERE id = ?", [dorm_id]);

    if (dorms.length === 0) {
      return res.status(404).json({ error: "Dorm not found" });
    }

    // Check availability
    const [conflicts] = await db.promise().query(
      `SELECT * FROM bookings 
       WHERE dorm_id = ? 
       AND status = 'active'
       AND start_date <= ? 
       AND end_date >= ?`,
      [dorm_id, end_date, start_date]
    );

    if (conflicts.length > 0) {
      return res
        .status(400)
        .json({ error: "Dorm is not available for these dates" });
    }

    // Create booking
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO bookings (user_id, dorm_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)",
        [user_id, dorm_id, start_date, end_date, "active"]
      );

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings
app.get("/api/bookings/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [bookings] = await db.promise().query(
      `SELECT 
          b.id,
          b.user_id,
          b.dorm_id,
          b.start_date,
          b.end_date,
          b.semester,
          b.academic_year,
          b.status,
          b.payment_status,
          b.payment_deadline,
          b.confirmation_number,
          b.created_at,
          d.name as dorm_name,
          d.price_per_night
         FROM bookings b
         JOIN dorms d ON b.dorm_id = d.id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`,
      [userId]
    );

    console.log("Fetched bookings:", bookings); // Add this to debug
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
