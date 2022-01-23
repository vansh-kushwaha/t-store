const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { BigPromise } = require("./bigPromise");

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  const token =
    req.cookies.token ||
    (req.headers["authorization"]
      ? req.headers["authorization"].replace("Bearer ", "")
      : undefined);

  if (!token) {
    res.status(401).json({
      error: "You need to log in first to access this route.",
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id);

  next();
});

exports.customRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `You are not authirized to use this resource.`,
      });
    }
    next();
  };
};
