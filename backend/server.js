const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => "dorms",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.split(".")[0]}`,
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
const app = express();

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (email, code) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "BookIt - Verify your email address",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a73e8;">Verify your email address</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;">Your verification code is:</p>
              <div style="background-color: #e8f0fe; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a73e8;">
                ${code}
              </div>
              <p style="margin: 10px 0; color: #666;">This code will expire in 10 minutes.</p>
            </div>
  
            <p style="color: #666; font-size: 14px;">
              If you didn't request this verification code, please ignore this email.
            </p>
          </div>
        `,
    });
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetCode = generateVerificationCode();

    await pool.query(
      `INSERT INTO reset_codes (email, code) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET 
         code = EXCLUDED.code,
         created_at = CURRENT_TIMESTAMP`,
      [email, resetCode]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Password",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a73e8;">Reset Your Password</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;">Your password reset code is:</p>
              <div style="background-color: #e8f0fe; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a73e8;">
                ${resetCode}
              </div>
              <p style="margin: 10px 0; color: #666;">This code will expire in 10 minutes.</p>
            </div>
  
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
        `,
    });

    res.json({ message: "Reset code sent to email" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.post("/api/verify-reset-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    const result = await pool.query(
      `SELECT * FROM reset_codes 
         WHERE email = $1 
         AND code = $2 
         AND created_at > NOW() - INTERVAL '10 minutes'`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Error in verify reset code:", error);
    res.status(500).json({ error: "Failed to verify code" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, code, password } = req.body;

    const codeResult = await pool.query(
      `SELECT * FROM reset_codes 
         WHERE email = $1 
         AND code = $2 
         AND created_at > NOW() - INTERVAL '10 minutes'`,
      [email, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
      hashedPassword,
      email,
    ]);

    await pool.query("DELETE FROM reset_codes WHERE email = $1", [email]);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const verificationCode = generateVerificationCode();

    await pool.query(
      `INSERT INTO verification_codes (email, code, first_name, last_name, password)
         VALUES ($1, $2, $3, $4, $5)`,
      [email, verificationCode, firstName, lastName, password]
    );

    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      throw new Error("Failed to send verification email");
    }

    res.status(200).json({
      message: "Verification code sent to email",
      email: email,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    const verificationResult = await pool.query(
      "SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND created_at > NOW() - INTERVAL '10 minutes'",
      [email, code]
    );

    if (verificationResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code" });
    }

    const userData = verificationResult.rows[0];

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await pool.query(
      "INSERT INTO users (email, password, first_name, last_name, role, verified) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        email,
        hashedPassword,
        userData.first_name,
        userData.last_name,
        "student",
        true,
      ]
    );

    await pool.query("DELETE FROM verification_codes WHERE email = $1", [
      email,
    ]);

    res
      .status(201)
      .json({ message: "Email verified and account created successfully" });
  } catch (error) {
    console.error("Error in verification:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

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

const sendBookingConfirmationEmail = async (userEmail, bookingDetails) => {
  try {
    const paymentDeadline = new Date(
      bookingDetails.payment_deadline
    ).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Booking Confirmation - ${bookingDetails.confirmation_number}`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a73e8;">Thank you for your booking, ${
              bookingDetails.firstName
            }!</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1a73e8; margin-top: 0;">Booking Details:</h3>
              
              <p style="margin: 10px 0;">
                <strong>Dorm:</strong> ${bookingDetails.dorm_name}
              </p>
              <p style="margin: 10px 0;">
                <strong>Academic Year:</strong> ${
                  bookingDetails.academic_year
                } - ${parseInt(bookingDetails.academic_year) + 1}
              </p>
              <p style="margin: 10px 0;">
                <strong>Semester:</strong> ${
                  bookingDetails.semester === "1"
                    ? "First (Aug-Dec)"
                    : "Second (Jan-May)"
                }
              </p>
              <p style="margin: 10px 0;">
                <strong>Total Amount:</strong> ₱${
                  bookingDetails.price_per_night * 150
                }
              </p>
            </div>
  
            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1a73e8; margin-top: 0;">Next Steps to Finalize Your Booking:</h3>
              
              <ol style="padding-left: 20px;">
                <li style="margin-bottom: 10px;">Please complete the payment within 48 hours (before ${paymentDeadline})</li>
                <li style="margin-bottom: 10px;">
                  Payment Methods:
                  <ul style="margin-top: 5px;">
                    <li>Bank Transfer to: 23423423434 Dan Lius</li>
                    <li>GCash: 09062130621 Dan Lius</li>
                    <li>In-person at the dormitory office</li>
                  </ul>
                </li>
                <li>Send your proof of payment to ${process.env.EMAIL_USER}</li>
              </ol>
            </div>
  
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0;">
                <strong>Important:</strong> Your booking will be automatically cancelled if payment is not received within 48 hours.
              </p>
            </div>
  
            <p style="color: #666; font-size: 14px;">
              For any questions, please reply to this email or contact us at 09062130621.
            </p>
          </div>
        `,
    });
    console.log("Confirmation email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};

app.post("/api/dorms/:id/bookings", authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, semester, academicYear } = req.body;
    const dorm_id = req.params.id;
    const user_id = req.user.userId;
    const confirmation_number = generateConfirmationNumber();
    const status = "pending";
    const payment_status = "pending";
    const payment_deadline = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    ).toISOString();

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

    const dormResult = await pool.query(
      "SELECT name, price_per_night FROM dorms WHERE id = $1",
      [dorm_id]
    );

    if (dormResult.rows.length === 0) {
      return res.status(404).json({ error: "Dorm not found" });
    }

    const userResult = await pool.query(
      "SELECT email, first_name FROM users WHERE id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const bookingResult = await pool.query(
      `INSERT INTO bookings (
          user_id, dorm_id, start_date, end_date, 
          confirmation_number, status, payment_status, 
          payment_deadline, semester, academic_year
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id`,
      [
        user_id,
        dorm_id,
        start_date,
        end_date,
        confirmation_number,
        status,
        payment_status,
        payment_deadline,
        semester,
        academicYear,
      ]
    );

    const bookingDetails = {
      confirmation_number,
      dorm_name: dormResult.rows[0].name,
      semester,
      academic_year: academicYear,
      payment_deadline,
      price_per_night: dormResult.rows[0].price_per_night,
      firstName: userResult.rows[0].first_name,
    };

    await sendBookingConfirmationEmail(
      userResult.rows[0].email,
      bookingDetails
    );

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: bookingResult.rows[0].id,
      confirmation_number,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: error.message });
  }
});

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

app.get("/api/dorms", async (req, res) => {
  try {
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const capacity = req.query.capacity;
    const available = req.query.available;

    let query = "SELECT * FROM dorms WHERE TRUE";
    const queryParams = [];
    let paramCount = 1;

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

    query += ` ORDER BY created_at DESC`;

    const dormsResult = await pool.query(query, queryParams);

    res.json({
      dorms: dormsResult.rows,
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

app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const { dorm_id, start_date, end_date } = req.body;
    const user_id = req.user.userId;

    const dormResult = await pool.query("SELECT * FROM dorms WHERE id = $1", [
      dorm_id,
    ]);

    if (dormResult.rows.length === 0) {
      return res.status(404).json({ error: "Dorm not found" });
    }

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
          b.room_number,
          d.name as dorm_name,
          d.price_per_night
         FROM bookings b
         JOIN dorms d ON b.dorm_id = d.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
      [userId]
    );

    const bookingsWithAmount = result.rows.map((booking) => ({
      ...booking,
      total_amount: booking.price_per_night * 30 * 5,
    }));

    console.log("Fetched bookings:", bookingsWithAmount);
    res.json(bookingsWithAmount);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

const isAdmin = async (req, res, next) => {
  try {
    const userResult = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (userResult.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

app.post(
  "/api/admin/dorms",
  authenticateToken,
  isAdmin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { name, description, price_per_night, capacity, available } =
        req.body;

      const uploadedImages = req.files
        ? req.files.map((file) => file.path)
        : [];

      const result = await pool.query(
        `INSERT INTO dorms (name, description, price_per_night, capacity, available, images)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          name,
          description,
          price_per_night,
          capacity,
          available === "true" || available === true,
          uploadedImages,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (req.files) {
        for (const file of req.files) {
          try {
            const publicId = file.filename;
            await cloudinary.uploader.destroy(publicId);
          } catch (deleteError) {
            console.error("Error deleting file:", deleteError);
          }
        }
      }
      console.error("Error adding dorm:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete(
  "/api/admin/dorms/:id/images",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];

      await cloudinary.uploader.destroy(`dorms/${publicId}`);

      const existingDorm = await pool.query(
        "SELECT images FROM dorms WHERE id = $1",
        [id]
      );
      const existingImages = existingDorm.rows[0]?.images || [];
      const updatedImages = existingImages.filter((img) => img !== imageUrl);

      await pool.query("UPDATE dorms SET images = $1 WHERE id = $2", [
        updatedImages,
        id,
      ]);

      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.get("/api/admin/dorms", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM dorms ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching dorms:", error);
    res.status(500).json({ error: error.message });
  }
});

const sendPaymentConfirmationEmail = async (userEmail, bookingDetails) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Payment Confirmation - ${bookingDetails.confirmation_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Payment Received!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a73e8; margin-top: 0;">Booking Details:</h3>
            
            <p style="margin: 10px 0;">
              <strong>Confirmation Number:</strong> ${
                bookingDetails.confirmation_number
              }
            </p>
            <p style="margin: 10px 0;">
              <strong>Dorm:</strong> ${bookingDetails.dorm_name}
            </p>
            <p style="margin: 10px 0;">
              <strong>Academic Year:</strong> ${
                bookingDetails.academic_year
              } - ${parseInt(bookingDetails.academic_year) + 1}
            </p>
            <p style="margin: 10px 0;">
              <strong>Semester:</strong> ${
                bookingDetails.semester === "1"
                  ? "First (Aug-Dec)"
                  : "Second (Jan-May)"
              }
            </p>
            <p style="margin: 10px 0;">
              <strong>Total Amount Paid:</strong> ₱${
                bookingDetails.price_per_night * 150
              }
            </p>
          </div>

          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1a73e8; margin: 0;">
              Thank you for your payment! Your booking is now confirmed.
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            For any questions, please contact us at ${process.env.EMAIL_USER}
          </p>
        </div>
      `,
    });
    console.log("Payment confirmation email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    return false;
  }
};

app.patch(
  "/api/admin/bookings/:id/payment",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { payment_status, room_number } = req.body;

      const bookingResult = await pool.query(
        `
      SELECT b.*, d.price_per_night, d.name as dorm_name, u.email, u.first_name
      FROM bookings b 
      JOIN dorms d ON b.dorm_id = d.id 
      JOIN users u ON b.user_id = u.id 
      WHERE b.id = $1
    `,
        [id]
      );

      const booking = bookingResult.rows[0];

      const totalAmount = booking.price_per_night * 30 * 5;

      await pool.query(
        "UPDATE bookings SET payment_status = $1, room_number = $2 WHERE id = $3",
        [payment_status, room_number, id]
      );

      if (payment_status === "paid") {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: booking.email,
          subject: "Payment Confirmation - BookIt",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a73e8;">Payment Confirmation</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1a73e8; margin-bottom: 20px;">Booking Details:</h3>
              
              <div style="margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Confirmation Number:</strong> ${
                  booking.confirmation_number
                }</p>
                <p style="margin: 5px 0;"><strong>Dorm:</strong> ${
                  booking.dorm_name
                }</p>
                <p style="margin: 5px 0;"><strong>Room Number:</strong> ${room_number}</p>
                <p style="margin: 5px 0;"><strong>Academic Year:</strong> ${
                  booking.academic_year
                } - ${parseInt(booking.academic_year) + 1}</p>
                <p style="margin: 5px 0;"><strong>Semester:</strong> ${
                  booking.semester === "1"
                    ? "First (Aug-Dec)"
                    : "Second (Jan-May)"
                }</p>
                <p style="margin: 5px 0;"><strong>Total Amount Paid:</strong> ₱${totalAmount.toLocaleString()}</p>
              </div>

              <div style="background-color: #e8f0fe; padding: 15px; border-radius: 4px; margin-top: 20px;">
                <p style="margin: 0; color: #1a73e8;">Your room has been successfully assigned. Please keep this email for your records.</p>
              </div>
            </div>

            <div style="color: #666; font-size: 14px; margin-top: 20px;">
              <p>Thank you for choosing BookIt!</p>
              <p>Best regards,<br>The BookIt Team</p>
            </div>
          </div>
        `,
        });
      }

      res.json({ message: "Payment status updated successfully" });
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete(
  "/api/admin/dorms/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM dorms WHERE id = $1", [id]);
      res.json({ message: "Dorm deleted successfully" });
    } catch (error) {
      console.error("Error deleting dorm:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.get(
  "/api/admin/dashboard-stats",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const [dormsCount, bookingsCount, usersCount, recentBookings] =
        await Promise.all([
          pool.query("SELECT COUNT(*) FROM dorms"),
          pool.query("SELECT COUNT(*) FROM bookings"),
          pool.query("SELECT COUNT(*) FROM users"),
          pool.query(`
          SELECT b.*, u.first_name || ' ' || u.last_name as user_name, d.name as dorm_name
          FROM bookings b
          JOIN users u ON b.user_id = u.id
          JOIN dorms d ON b.dorm_id = d.id
          ORDER BY b.created_at DESC
          LIMIT 5
        `),
        ]);

      res.json({
        totalDorms: parseInt(dormsCount.rows[0].count),
        totalBookings: parseInt(bookingsCount.rows[0].count),
        totalUsers: parseInt(usersCount.rows[0].count),
        recentBookings: recentBookings.rows,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.get("/api/admin/bookings", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, 
             u.first_name || ' ' || u.last_name as user_name, 
             u.email as user_email,
             d.name as dorm_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN dorms d ON b.dorm_id = d.id
    `;

    if (status && status !== "all") {
      query += ` WHERE b.status = $1`;
    }

    query += " ORDER BY b.created_at DESC";

    const result = await pool.query(query, status !== "all" ? [status] : []);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch(
  "/api/admin/bookings/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, cancelReason, userEmail, userName, bookingId } = req.body;

      await pool.query("UPDATE bookings SET status = $1 WHERE id = $2", [
        status,
        id,
      ]);

      if (status === "cancelled" && cancelReason && userEmail) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: "Your Booking Has Been Cancelled",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a73e8;">Booking Cancellation Notice</h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>Dear ${userName},</p>
                <p>Your booking (ID: ${bookingId}) has been cancelled by the administrator.</p>
                
                <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p><strong>Reason for cancellation:</strong></p>
                  <p style="color: #666;">${cancelReason}</p>
                </div>

                <p>If you have any questions about this cancellation, please contact our support team.</p>
              </div>

              <div style="color: #666; font-size: 14px; margin-top: 20px;">
                <p>Best regards,</p>
                <p>The BookIt Team</p>
              </div>
            </div>
          `,
        });
      }

      res.json({ message: "Booking status updated successfully" });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch(
  "/api/admin/users/:id/role",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);

      res.json({ message: "User role updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.put(
  "/api/admin/dorms/:id",
  authenticateToken,
  isAdmin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price_per_night,
        capacity,
        available,
        existingImages,
      } = req.body;

      const existingImagesArray =
        typeof existingImages === "string"
          ? JSON.parse(existingImages)
          : existingImages || [];

      const newImageUrls = req.files ? req.files.map((file) => file.path) : [];

      const allImages = [...existingImagesArray, ...newImageUrls];

      const result = await pool.query(
        `UPDATE dorms 
         SET name = $1, description = $2, price_per_night = $3, capacity = $4, 
             available = $5, images = $6
         WHERE id = $7
         RETURNING *`,
        [name, description, price_per_night, capacity, available, allImages, id]
      );

      if (result.rows.length === 0) {
        if (req.files) {
          for (const file of req.files) {
            const publicId = file.filename;
            await cloudinary.uploader.destroy(publicId);
          }
        }
        return res.status(404).json({ error: "Dorm not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      if (req.files) {
        for (const file of req.files) {
          const publicId = file.filename;
          await cloudinary.uploader.destroy(publicId);
        }
      }
      console.error("Error updating dorm:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SUPPORT_EMAIL,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">New Contact Form Submission</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting BookIt",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Thank you for contacting us!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Dear ${name},</p>
            <p>We have received your message and will get back to you as soon as possible.</p>
            <p>Thank you for your patience.</p>
          </div>

          <div style="color: #666; font-size: 14px; margin-top: 20px;">
            <p>Best regards,</p>
            <p>The BookIt Team</p>
          </div>
        </div>
      `,
    });

    res.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending contact form:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
