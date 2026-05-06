import exp from 'express'
import { postmodel } from '../models/post_model.js'
import { verifytoken } from '../verifytoken.js'
import { notificationmodel } from '../models/notification_model.js'

export const postapp = exp.Router()


// CREATE POST
postapp.post("/post", verifytoken("user"), async (req, res) => {

  const postobj = req.body

  // attach logged-in user id
  postobj.user = req.user?.id

  const postdoc = new postmodel(postobj)

  await postdoc.save()

  res.status(201).json({
    message: "post created",
    payload: postdoc
  })
})


// GET ALL POSTS
postapp.get("/post", verifytoken("user"), async (req, res) => {

  const postlist = await postmodel
    .find({ ispostactive: true }) // keep active posts only
    .populate("user")
    .populate("replies.user")

  res.status(200).json({
    message: "posts",
    payload: postlist
  })
})


//  LIKE / UNLIKE POST

postapp.put("/like", verifytoken("user"), async (req, res) => {

  const { postid } = req.body
  const userid = req.user?.id

  const post = await postmodel.findById(postid)

  if (!post) {
    return res.status(404).json({ message: "post not found" })
  }

  // like notify
  if (post.likes.includes(userid)) {

    // unlike
    post.likes = post.likes.filter(
      id => id.toString() !== userid
    )

  } else {

    // like
    post.likes.push(userid)

    // create notification 
    if (post.user.toString() !== userid) {
      await notificationmodel.create({
        user: post.user,
        sender: userid,
        type: "like",
        post: post._id,
        message: "liked your post"
      })
    }
  }

  await post.save()

  res.status(200).json({
    message: "like updated",
    payload: post
  })
})


// add replly
postapp.put("/reply", verifytoken("user"), async (req, res) => {

  const { postid, text } = req.body
  const userid = req.user?.id

  const post = await postmodel.findOne({
    _id: postid,
    ispostactive: true
  })

  if (!post) {
    return res.status(404).json({ message: "post not found" })
  }

  // add reply
  post.replies.push({
    user: userid,
    text: text
  })

  await post.save()

  // create notification
  if (post.user.toString() !== userid) {
    await notificationmodel.create({
      user: post.user,
      sender: userid,
      type: "reply",
      post: post._id,
      message: "replied to your post"
    })
  }

  res.status(200).json({
    message: "reply added",
    payload: post
  })
})


// DELETE POST 
postapp.delete("/post/:id", verifytoken("user"), async (req, res) => {

  const postid = req.params.id

  const post = await postmodel.findById(postid)

  if (!post) {
    return res.status(404).json({ message: "post not found" })
  }

  // only owner can delete
  if (post.user.toString() !== req.user?.id) {
    return res.status(403).json({ message: "not authorized" })
  }

  // permanent delete
  await post.deleteOne()

  res.status(200).json({
    message: "post deleted permanently"
  })
})