import exp from "express"
import { messagemodel } from "../models/message_model.js"
import { verifytoken } from "../verifytoken.js"

export const messageapp = exp.Router()


// SEND MESSAGE
messageapp.post("/", verifytoken("user"), async (req, res) => {

  const senderid = req.user?.id
  const { receiverid, text } = req.body

  const message = await messagemodel.create({
    sender: senderid,
    receiver: receiverid,
    text
  })

  res.status(201).json({
    message: "message sent",
    payload: message
  })
})


// GET CHAT BETWEEN TWO USERS
messageapp.get("/:userid", verifytoken("user"), async (req, res) => {

  const currentuserid = req.user?.id
  const otheruserid = req.params.userid

  const messages = await messagemodel.find({
    $or: [
      {
        sender: currentuserid,
        receiver: otheruserid
      },
      {
        sender: otheruserid,
        receiver: currentuserid
      }
    ]
  })
  .sort({ createdAt: 1 })

  res.status(200).json({
    message: "chat messages",
    payload: messages
  })
})