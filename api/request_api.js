import exp from "express"
import { requestmodel } from "../models/request_model.js"
import { postmodel } from "../models/post_model.js"
import { notificationmodel } from "../models/notification_model.js"
import { verifytoken } from "../verifytoken.js"
export const requestapp = exp.Router()

requestapp.post("/send", verifytoken("user"), async (req, res) => {

  const senderid = req.user?.id
  const { postid } = req.body

  // find post
  const post = await postmodel.findById(postid)

  if (!post) {
    return res.status(404).json({
      message: "post not found"
    })
  }

  // prevent self request
  if (post.user.toString() === senderid) {
    return res.status(400).json({
      message: "cannot request your own post"
    })
  }

  // check existing request
  const existingrequest = await requestmodel.findOne({
    post: postid,
    sender: senderid
  })

  if (existingrequest) {
    return res.status(400).json({
      message: "request already sent"
    })
  }

  // create request
  const requestdoc = await requestmodel.create({
    post: postid,
    sender: senderid,
    receiver: post.user
  })
  await notificationmodel.create({
  user: post.user,
  sender: senderid,
  type: "request",
  post: post._id,
  message: "requested to join your project"
})

  res.status(201).json({
    message: "request sent",
    payload: requestdoc
  })
})

requestapp.get("/", verifytoken("user"), async (req, res) => {

  const userid = req.user?.id

  // get requests received by logged-in user
  const requests = await requestmodel
    .find({ receiver: userid })
    .populate("sender", "-password")
    .populate("post")

  res.status(200).json({
    message: "requests",
    payload: requests
  })
})

requestapp.put("/:id", verifytoken("user"), async (req, res) => {

  const requestid = req.params.id
  const { status } = req.body

  // find request
  const request = await requestmodel.findById(requestid)

  if (!request) {
    return res.status(404).json({
      message: "request not found"
    })
  }

  // only receiver can update
  if (request.receiver.toString() !== req.user?.id) {
    return res.status(403).json({
      message: "not authorized"
    })
  }

  // validate status
  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "invalid status"
    })
  }

  // update status
  request.status = status

  await request.save()

  res.status(200).json({
    message: `request ${status}`,
    payload: request
  })
})