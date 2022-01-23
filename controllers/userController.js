const { BigPromise } = require("../middlewares/bigPromise");
const User = require("../models/User");
const { cookieToken } = require("../utils/cookieToken");
const cloudinary = require("cloudinary").v2;
const { sendMailTo } = require("../utils/sendMail");
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!email) {
    res.status(400);
    return next(new Error("Please enter email"));
  }

  if (!name) {
    return next(new Error("Please enter name"));
  }

  if (!password) {
    return next(new Error("Please enter password"));
  }

  let result;
  if (req.files || !Object.keys(req.files).length === 0) {
    let file = req.files.photo;
    result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "sampleupload",
      unique_filename: true,
    });
  }
  let photo = {};
  if (result) {
    photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }
  const user = await User.create({
    name,
    email,
    password,
    photo,
  });

  user.password = undefined;

  cookieToken(user, res);

  next();
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: "Please eneter email & password.",
    });
    return next();
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).json({
      error: "User not found. Please signup first",
    });
  }

  if (!(await user.isCorrectPassword(password))) {
    res.status(400).json({
      error: "Incorrect email or password. ",
    });
    return next();
  }

  cookieToken(user, res);
  next();
});

exports.logout = BigPromise(async (req, res, next) => {
  res.clearCookie("token").json({
    message: "cookie deleted successfully",
  });
  // res
  //   .cookie("token", null, {
  //     httpOnly: true,
  //     expires: new Date(Date.now()),
  //   })
  //   .json({
  //     success: true,
  //     message: "cookie deleted successfully",
  //   });
  next();
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Please enter email",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  try {
    const token = await user.getForgotPasswordToken();
    await user.save({ validateBeforeSave: false });
    const message = {
      to: email,
      subject: "TSTORE - Password reset",
      text: `Click the link `,
      html: `<a>Click here ${req.protocol}://${req.get("host")}${
        req.baseUrl
      }/password/reset/${token}</a>1`,
    };
    await sendMailTo(message);
    res.status(200).json({
      message: "Email sent check your mail box.",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    res
      .status(400)
      .json({ error: `unable to forgot password. Retry ${error}` });
  }

  next();
});

exports.forgotPasswordReset = BigPromise(async (req, res, next) => {
  const token = req.params.token;
  const { password, confirmPassword } = req.body;

  if (!token) {
    return res.status(400).json({
      error: "please click right link",
    });
  }

  if (!password || !confirmPassword) {
    return res.status(400).json({
      error: "please enter password and confirm password",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      error: "Password and confirm password do not match",
    });
  }

  const encyToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPassword: encyToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      error: "Invalid token or token has expired",
    });
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  cookieToken(user, res);

  next();
});

exports.getLoggedInUserDetail = BigPromise(async (req, res, next) => {
  const user = req.user;
  res.json({ user });
});

exports.updatePassword = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const { oldPassword, newPassword } = req.body;
  if (!(await user.isCorrectPassword(oldPassword))) {
    res.status(400).json({
      error: "Incorrect User password ",
    });
  }

  user.password = newPassword;
  await user.save();

  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user.id);
  if (name) {
    user.name = name;
  }
  if (email) {
    user.email = email;
  }
  if (req.files) {
    const uploadedImage = await cloudinary.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "sampleupload",
        unique_filename: true,
      }
    );
    if (!uploadedImage) {
      return res.json({
        error: "Unable to upload image",
      });
    }

    const oldPhoto = {
      ...user.photo,
    };

    // Updating all values localy
    user.photo.id = uploadedImage.public_id;
    user.photo.secure_url = uploadedImage.secure_url;

    // updating in database
    const updatedUser = await user.save();
    if (!updatedUser) {
      // deleting new image from cloudinary
      await cloudinary.uploader.destroy(uploadedImage.public_id);
      return res.json({
        error: "Unable Update user",
      });
    }

    // Deleting old image from cloudinary
    const deletedImage = await cloudinary.uploader.destroy(oldPhoto.id);

    if (!deletedImage) {
      await cloudinary.uploader.destroy(oldPhoto.id);
    }

    return res.status(200).json({
      success: true,
      updatedUser,
    });
  } else {
    const updatedUser = await user.save();
    if (!updatedUser) {
      return res.json({
        error: "Unable Update user",
      });
    }
    return res.status(200).json({
      success: true,
      updatedUser,
    });
  }
});

// ! Admin controllers

exports.adminGetAllUser = BigPromise(async (req, res, next) => {
  const allUser = await User.find().sort({ name: 1 });
  if (!allUser) {
    return res.status(400).json({
      error: "Unable to get users",
    });
  }
  res.json(allUser);
});

exports.adminGetSingleUser = BigPromise(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({
      error: "Unable to the get user",
    });
  }
  res.json(user);
});

exports.adminUpdateUserDetails = BigPromise(async (req, res, next) => {
  const { name, email, role } = req.body;

  const user = await User.findById(req.params.id);
  if (role) {
    user.role = role;
  }
  if (req.files) {
    const uploadedImage = await cloudinary.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "sampleupload",
        unique_filename: true,
      }
    );
    if (!uploadedImage) {
      return res.staus(400).json({
        error: "Unable to upload image",
      });
    }

    const oldPhoto = {
      ...user.photo,
    };

    // Updating all values localy
    user.photo.id = uploadedImage.public_id;
    user.photo.secure_url = uploadedImage.secure_url;
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }

    // updating in database
    const updatedUser = await user.save();
    if (!updatedUser) {
      // deleting new image from cloudinary
      await cloudinary.uploader.destroy(uploadedImage.public_id);
      await cloudinary.uploader.destroy(uploadedImage.public_id);

      return res.status(400).json({
        error: "Unable Update user",
      });
    }

    // Deleting old image from cloudinary
    const deletedImage = await cloudinary.uploader.destroy(oldPhoto.id);
    if (!deletedImage) {
      await cloudinary.uploader.destroy(oldPhoto.id);
    }

    return res.status(200).json({
      success: true,
      updatedUser,
    });
  } else {
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }

    const updatedUser = await user.save();
    if (!updatedUser) {
      return res.json({
        error: "Unable Update user",
      });
    }
    return res.status(200).json({
      success: true,
      updatedUser,
    });
  }
});

exports.adminDeletAUser = BigPromise(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id, {});
  if (!user) {
    res.status(400).json({
      success: false,
      message: "Unable to delete the user",
    });
  }
  const result = await cloudinary.uploader.destroy(user.photo.id);
  res.status(200).json({ success: true, ...result, user });
});

// ! Manager controllers

exports.managerGetAllUser = BigPromise(async (req, res, next) => {
  const allUser = await User.find({ role: "user" });
  if (!allUser) {
    return res.status(400).json({
      error: "Unable to get users",
    });
  }
  res.json(allUser);
});
