const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter a name"],
    minlength: [3, "Name must contain atleast 3 character"],
    maxlength: [40, "Name must contain at max 40 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter an Email"],
    validate: [validator.isEmail, "Please enter a Valid email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    // validate: [
    //   () =>
    //     validator.isStrongPassword({
    //       minLength: 6,
    //     }),
    //   "Password must contain at least 6 character including lowercase, uppercase &  number",
    // ],
    minlength: [6, "Password must contain atleast 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin", "manager"],
    default: "user",
  },
  photo: {
    id: {
      type: String,
    },
    secure_url: {
      type: String,
    },
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    select: false,
  },
});

// encryipting password before saving to db - HOOK
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password methods
userSchema.methods.isCorrectPassword = function (sentPassword) {
  return bcrypt.compare(sentPassword, this.password);
};

// genrate JWT token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};
// genrate forgot password token /string
userSchema.methods.getForgotPasswordToken = function () {
  const forgotToken = crypto.randomBytes(20).toString("hex");

  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;
  return forgotToken;
};

module.exports = mongoose.model("User", userSchema);
