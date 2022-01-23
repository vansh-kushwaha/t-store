const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
    unique: false,
    minlength: [3, "atleast 3 characters are required"],
    required: [true, "Please provide name"],
  },
  price: {
    type: Number,
    required: [true, "Please provide price"],
  },
  description: {
    type: String,
    trim: true,
    required: [true, "Please provide description"],
  },
  stocks: {
    type: Number,
    required: [true, "Please provide no. of stocks"],
  },
  photos: [
    {
      id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],

  category: {
    type: String,
    required: [true, "Please provide Category."],
    enum: {
      values: ["shortsleeves", "longsleeves", "sweatshirt", "hoodies"],
      message: "Please select valid category",
    },
  },
  brand: String,

  ratings: {
    type: Number,
    defualt: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        require: true,
      },
      rating: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        required: true,
      },
      comments: {
        type: String,
        trim: true,
        maxlength: [120, "Only 120 characters are required"],
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
