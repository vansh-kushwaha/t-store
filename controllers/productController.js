const { BigPromise } = require("../middlewares/bigPromise");
const WhereClause = require("../utils/whereClause");
const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;

// ! User

exports.getAllProducts = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;
  const productsObj = new WhereClause(Product, req.query).search().filter();
  // console.log(productsObj);
  //  = productsObj.length();
  // const filteredProductNumber = await productsObj.length();
  let products = await productsObj.pager(resultPerPage).base;
  const filteredProductNumber = products.length;
  res.status(200).json({
    success: true,
    filteredProductNumber,
    products,
  });
});

exports.getSingleProduct = BigPromise(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }
});

// ! Admin

exports.adminAddProduct = BigPromise(async (req, res, next) => {
  const imageArr = [];
  const { name, price, description, stocks, category } = req.body;
  if (!name) {
    return res.status(400).json({
      error: "Product name is Requried",
    });
  }
  if (!price) {
    return res.status(400).json({
      error: "Product price is Requried",
    });
  }
  if (!description) {
    return res.status(400).json({
      error: "Product description is Requried",
    });
  }
  if (!stocks) {
    return res.status(400).json({
      error: "Product stocks is Requried",
    });
  }
  if (!category) {
    return res.status(400).json({
      error: "Product category is Requried",
    });
  }
  if (!req.files) {
    return res.status(400).json({
      error: "Photos are Requried",
    });
  }

  const product = await Product.create({
    name,
    price,
    description,
    stocks,
    category,
    photos: imageArr,
    user: req.user._id,
  });
  console.log(product);
  if (!product) {
    for (let index = 0; index < imageArr.length; index++) {
      await cloudinary.uploader.destroy(imageArr[index].id);
    }
    return res.status(400).json({
      error: "Unable to create product.",
    });
  }

  for (let index = 0; index < req.files.photos.length; index++) {
    const image = await cloudinary.uploader.upload(
      req.files.photos[index].tempFilePath,
      {
        folder: "Products",
      }
    );
    if (!image) {
      return res.status(400).json({
        error: "Unable to upload photos.",
      });
    }
    imageArr.push({
      id: image.public_id,
      secure_url: image.secure_url,
    });
  }

  try {
    product.photos = imageArr;
    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    for (let index = 0; index < imageArr.length; index++) {
      await cloudinary.uploader.destroy(imageArr[index].id);
    }
    return res.status(400).json({
      message: "Unable to create product.",
      error,
    });
  }
});

exports.adminGetAllProducts = BigPromise(async (req, res, next) => {
  const products = await Product.find();
  const productsCount = products.length;
  res.status(200).json({
    success: true,
    productsCount,
    products,
  });
});

exports.deleteProduct = BigPromise(async (req, res, next) => {
  const productId = req.params.productId;

  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    return res.status(400).json({
      error: "Unable to delete the product.",
    });
  }
  console.log(product);
  const imageArr = product.photos;
  console.log(imageArr);

  for (let index = 0; index < imageArr.length; index++) {
    await cloudinary.uploader.destroy(imageArr[index].id);
  }
  return res.status(201).json({
    success: true,
    product,
  });
});

exports.adminUpdateProduct = BigPromise(async (req, res, next) => {
  Product.findById(req.params.productId)
    .then(async (product) => {
      const imageArr = [];
      const { name, price, description, stocks, category } = req.body;
      if (name) {
        product.name = name;
      }
      if (price) {
        product.price = price;
      }

      if (description) {
        product.description = description;
      }

      if (stocks) {
        product.stocks = stocks;
      }

      if (category) {
        product.category = category;
      }

      product.save().catch((err) => {
        return res.status(400).json({
          error: err,
          message: "Unable to update product",
        });
      });

      if (req.files) {
        for (let index = 0; index < req.files.photos.length; index++) {
          cloudinary.uploader
            .upload(req.files.photos[index].tempFilePath, {
              folder: "Products",
            })
            .then((image) => {
              imageArr.push({
                id: image.public_id,
                secure_url: image.secure_url,
              });
            })
            .catch((err) => {
              return res.status(400).json({
                message: "Unable to upload photos.",
                error: err,
              });
            });
        }

        product.photos = [...product.photos, ...imageArr];
        product
          .save()
          .then((product) => {
            return res.status(201).json({
              success: true,
              product,
            });
          })
          .catch(async (err) => {
            for (let index = 0; index < imageArr.length; index++) {
              await cloudinary.uploader.destroy(imageArr[index].id);
            }
            return res.status(400).json({
              error: err,
              message: "Unable to update product photos.",
            });
          });
      }
    })
    .catch((err) => {
      return res.status(404).json({
        error: err,
        message: "Product not found",
      });
    });
});
