const nodemailer = require("nodemailer");

exports.sendMailTo = async (options) => {
  let transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,

    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "vanshkushwka@gmail.com", // sender address
    to: options.to, // list of receivers
    subject: options.subject, // Subject line
    text: options.text, // plain text body
    html: options.html, // html body
  });

  console.log(info);
  console.log("Message sent: %s", info.messageId);
};
