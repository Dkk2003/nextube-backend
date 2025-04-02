import nodemailer from "nodemailer";
import ApiError from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configure Handlebars options
const handlebarOptions = {
  viewEngine: {
    extname: ".hbs",
    partialsDir: path.join(__dirname, "views"),
    defaultLayout: false,
  },
  viewPath: path.join(__dirname, "../views"),
  extName: ".hbs",
};

// Use Handlebars with Nodemailer
transporter.use("compile", hbs(handlebarOptions));

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Nextube" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    template: "otp", // The .hbs template name (without extension)
    context: {
      otp, // This will replace {{otp}} in the template
    },
  };

  await transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      throw new ApiError(400, err.message);
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, info, "OTP sent Sucessfully"));
    }
  });
};

const sendAccountCreationEmail = async (email, fullName) => {
  const mailOptions = {
    from: `"Nextube" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to Nextube! 🎉",
    template: "welcome",
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    throw new ApiError(400, `Failed to send email: ${err.message}`);
  }
};

const sendForgotPasswordLink = async (email, resetLink) => {
  const mailOptions = {
    from: `"Nextube" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    template: "resetpassword",
    context: {
      resetLink,
    },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    throw new ApiError(400, `Failed to send email: ${err.message}`);
  }
};

export { sendOtpEmail, sendAccountCreationEmail, sendForgotPasswordLink };
