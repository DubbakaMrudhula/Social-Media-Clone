import exp from "express"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import cors from "cors"
import { config } from "dotenv"

// import APIs
import { authapp } from "./api/auth_api.js"
import { userapp } from "./api/user_api.js"
import { postapp } from "./api/post_api.js"
import { notificationapp } from "./api/notification_api.js"
import { requestapp } from "./api/request_api.js"
import { messageapp } from "./api/message_api.js"
import chatbotRoutes from "./api/chatbot_api.js";
const app = exp()
config()


// MIDDLEWARE
app.use(exp.json())
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))


// DATABASE CONNECTION
mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("DB connected successfully")
  })
  .catch((err) => {
    console.log("DB connection error:", err.message)
  })
app.use("/auth-api", authapp)
app.use("/user-api", userapp)
app.use("/post-api", postapp)
app.use("/notifications-api", notificationapp)
app.use("/request-api", requestapp)
app.use("/chatbot-api", chatbotRoutes);
app.use("/message-api", messageapp)
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})