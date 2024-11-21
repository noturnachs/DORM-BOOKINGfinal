const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");

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

const pool = new Pool({
  connectionString:
    "postgresql://grimhub:oyVSY3uTAHJfoTsbCUtVtXuv4AZtHH4g@dpg-cq8h5a4s1f4s73clm690-a.singapore-postgres.render.com/lfgdb",
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() => {
    console.log("Successfully connected to the PostgreSQL database.");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
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
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await pool.query(
      "INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5)",
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
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

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
    const confirmation_number = generateConfirmationNumber();
    const status = "active";
    const payment_status = "unpaid";
    const payment_deadline = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    ).toISOString();

    // Check availability
    const existingBookings = await pool.query(
      `SELECT id FROM bookings 
         WHERE dorm_id = $1 
         AND ((start_date <= $2 AND end_date >= $3) 
         OR (start_date <= $4 AND end_date >= $5))
         AND status = 'active'`,
      [dorm_id, end_date, start_date, end_date, start_date]
    );

    if (existingBookings.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Dorm is not available for these dates" });
    }

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (
          user_id, dorm_id, start_date, end_date, semester,
          academic_year, status, payment_status, payment_deadline, confirmation_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
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

    // Verify booking
    const newBooking = await pool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [result.rows[0].id]
    );

    if (!newBooking.rows.length) {
      throw new Error("Booking creation failed");
    }

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.rows[0].id,
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

    await pool.query(
      "UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3",
      [
        payment_status,
        payment_status === "paid" ? "active" : "pending",
        booking_id,
      ]
    );

    if (payment_status === "paid") {
      const bookingResult = await pool.query(
        `SELECT u.email, u.first_name, d.name, b.semester, b.academic_year 
           FROM bookings b 
           JOIN users u ON b.user_id = u.id 
           JOIN dorms d ON b.dorm_id = d.id 
           WHERE b.id = $1`,
        [booking_id]
      );

      const booking = bookingResult.rows[0];

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
    const result = await pool.query(
      `SELECT r.*, u.first_name, u.last_name 
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.dorm_id = $1
         ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Add review
app.post("/api/dorms/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    await pool.query(
      "INSERT INTO reviews (dorm_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)",
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

    let query = "SELECT * FROM dorms WHERE TRUE"; // Use TRUE for a base condition
    const queryParams = [];
    let paramCount = 1;

    // Add filters if they exist
    if (minPrice) {
      query += ` AND price_per_night >= $${paramCount}`;
      queryParams.push(minPrice);
      paramCount++;
    }
    if (maxPrice) {
      query += ` AND price_per_night <= $${paramCount}`;
      queryParams.push(maxPrice);
      paramCount++;
    }
    if (capacity) {
      query += ` AND capacity >= $${paramCount}`;
      queryParams.push(capacity);
      paramCount++;
    }
    if (available !== undefined) {
      query += ` AND available = $${paramCount}`;
      queryParams.push(available);
      paramCount++;
    }

    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    // Get dorms
    const dormsResult = await pool.query(query, queryParams);

    // Get total count for pagination
    const countResult = await pool.query("SELECT COUNT(*) as total FROM dorms");
    const total = parseInt(countResult.rows[0].total);

    res.json({
      dorms: dormsResult.rows,
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

    const result = await pool.query(
      "INSERT INTO dorms (name, description, capacity, price_per_night) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, description, capacity, price_per_night]
    );

    res.status(201).json({
      message: "Dorm created successfully",
      dormId: result.rows[0].id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single dorm by ID
app.get("/api/dorms/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM dorms WHERE id = $1", [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dorm not found" });
    }

    res.json(result.rows[0]);
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

      await pool.query("UPDATE dorms SET available = $1 WHERE id = $2", [
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
    const dormResult = await pool.query("SELECT * FROM dorms WHERE id = $1", [
      dorm_id,
    ]);

    if (dormResult.rows.length === 0) {
      return res.status(404).json({ error: "Dorm not found" });
    }

    // Check availability
    const conflictsResult = await pool.query(
      `SELECT * FROM bookings 
         WHERE dorm_id = $1 
         AND status = 'active'
         AND start_date <= $2 
         AND end_date >= $3`,
      [dorm_id, end_date, start_date]
    );

    if (conflictsResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Dorm is not available for these dates" });
    }

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (
          user_id, 
          dorm_id, 
          start_date, 
          end_date, 
          status
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user_id, dorm_id, start_date, end_date, "active"]
    );

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings
app.get("/api/bookings/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
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
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
      [userId]
    );

    console.log("Fetched bookings:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
