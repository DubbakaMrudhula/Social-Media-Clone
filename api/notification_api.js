import exp from 'express'
import { notificationmodel } from '../models/notification_model.js'
import { verifytoken } from '../verifytoken.js'

export const notificationapp = exp.Router()


//GET ALL NOTIFICATIONS
notificationapp.get("/", verifytoken("user"), async (req, res) => {

  const userid = req.user?.id

  const notifications = await notificationmodel
    .find({ user: userid })
    .populate("sender")
    .populate("post")

  res.status(200).json({
    message: "notifications",
    payload: notifications
  })
})


// MARK NOTIFICATION AS READ
notificationapp.put("/:id", verifytoken("user"), async (req, res) => {

  const notificationid = req.params.id

  const notification = await notificationmodel.findById(notificationid)

  if (!notification) {
    return res.status(404).json({ message: "notification not found" })
  }

  // update read status
  notification.isread = true

  await notification.save()

  res.status(200).json({
    message: "notification marked as read",
    payload: notification
  })
})