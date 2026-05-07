import exp from 'express'
import { usermodel } from '../models/user_model.js'
import { verifytoken } from '../verifytoken.js'
import { upload } from '../config/multer.js'
import { uploadToCloudinary } from '../config/cloudinaryupload.js'

export const userapp = exp.Router()


// ==========================
// MY PROFILE
// ==========================
userapp.get("/user", verifytoken("user"), async (req, res) => {

  const userid = req.user?.id

  const user = await usermodel.findById(userid)

  if (!user) {
    return res.status(404).json({
      message: "user not found"
    })
  }

  let userobj = user.toObject()
  delete userobj.password

  res.status(200).json({
    message: "user profile",
    payload: userobj
  })
})


// ==========================
// UPDATE PROFILE
// ==========================
userapp.put(
  "/user",
  verifytoken("user"),
  upload.single("profileImage"),
  async (req, res) => {

    const userid = req.user?.id

    let updateddata = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      bio: req.body.bio,
      skills: req.body.skills
    }

    // image upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path)
      updateddata.profileImageurl = result.secure_url
    }

    const updateduser = await usermodel.findByIdAndUpdate(
      userid,
      { $set: updateddata },
      { new: true }
    )

    let userobj = updateduser.toObject()
    delete userobj.password

    res.status(200).json({
      message: "user updated",
      payload: userobj
    })
  }
)


// ==========================
// FOLLOW / UNFOLLOW USER
// ==========================
userapp.put("/follow", verifytoken("user"), async (req, res) => {

  const currentuserid = req.user?.id
  const { targetuserid } = req.body

  // prevent self follow
  if (currentuserid === targetuserid) {
    return res.status(400).json({
      message: "you cannot follow yourself"
    })
  }

  const currentuser = await usermodel.findById(currentuserid)
  const targetuser = await usermodel.findById(targetuserid)

  if (!targetuser) {
    return res.status(404).json({
      message: "user not found"
    })
  }

  // already following -> unfollow
  if (currentuser.following.includes(targetuserid)) {

    currentuser.following = currentuser.following.filter(
      id => id.toString() !== targetuserid
    )

    targetuser.followers = targetuser.followers.filter(
      id => id.toString() !== currentuserid
    )

    await currentuser.save()
    await targetuser.save()

    return res.status(200).json({
      message: "unfollowed successfully"
    })
  }

  // private account -> send request
  if (targetuser.isPrivate) {

    // prevent duplicate request
    if (targetuser.followRequests.includes(currentuserid)) {
      return res.status(400).json({
        message: "follow request already sent"
      })
    }

    targetuser.followRequests.push(currentuserid)

    await targetuser.save()

    return res.status(200).json({
      message: "follow request sent"
    })
  }

  // public account -> direct follow
  currentuser.following.push(targetuserid)
  targetuser.followers.push(currentuserid)

  await currentuser.save()
  await targetuser.save()

  res.status(200).json({
    message: "followed successfully"
  })
})


// ==========================
// TOGGLE PRIVATE / PUBLIC
// ==========================
userapp.put("/privacy", verifytoken("user"), async (req, res) => {

  const user = await usermodel.findById(req.user.id)

  if (!user) {
    return res.status(404).json({
      message: "user not found"
    })
  }

  user.isPrivate = !user.isPrivate

  await user.save()

  res.status(200).json({
    message: `account is now ${user.isPrivate ? "private" : "public"}`,
    isPrivate: user.isPrivate
  })
})


// ==========================
// GET FOLLOW REQUESTS
// ==========================
userapp.get("/follow-requests", verifytoken("user"), async (req, res) => {

  const user = await usermodel
    .findById(req.user.id)
    .populate("followRequests", "-password")

  res.status(200).json({
    message: "follow requests",
    payload: user.followRequests
  })
})


// ==========================
// ACCEPT FOLLOW REQUEST
// ==========================
userapp.put("/accept-follow", verifytoken("user"), async (req, res) => {

  const { requesterid } = req.body

  const currentuser = await usermodel.findById(req.user.id)
  const requester = await usermodel.findById(requesterid)

  if (!requester) {
    return res.status(404).json({
      message: "requester not found"
    })
  }

  // remove request
  currentuser.followRequests =
    currentuser.followRequests.filter(
      id => id.toString() !== requesterid
    )

  // add follower/following
  currentuser.followers.push(requesterid)
  requester.following.push(req.user.id)

  await currentuser.save()
  await requester.save()

  res.status(200).json({
    message: "follow request accepted"
  })
})


// ==========================
// REJECT FOLLOW REQUEST
// ==========================
userapp.put("/reject-follow", verifytoken("user"), async (req, res) => {

  const { requesterid } = req.body

  const user = await usermodel.findById(req.user.id)

  user.followRequests =
    user.followRequests.filter(
      id => id.toString() !== requesterid
    )

  await user.save()

  res.status(200).json({
    message: "follow request rejected"
  })
})


// ==========================
// GET OTHER USER PROFILE
// ==========================
userapp.get("/user/:id", verifytoken("user"), async (req, res) => {

  const profileuser = await usermodel.findById(req.params.id)

  if (!profileuser) {
    return res.status(404).json({
      message: "user not found"
    })
  }

  const currentuserid = req.user.id

  const isowner =
    profileuser._id.toString() === currentuserid

  const isfollower =
    profileuser.followers
      .map(id => id.toString())
      .includes(currentuserid)

  // private account protection
  if (profileuser.isPrivate && !isowner && !isfollower) {
    return res.status(403).json({
      message: "this account is private"
    })
  }

  let userobj = profileuser.toObject()
  delete userobj.password

  res.status(200).json({
    message: "user",
    payload: userobj
  })
})


// ==========================
// GET ALL USERS
// ==========================
userapp.get("/users", verifytoken("user"), async (req, res) => {

  const users = await usermodel.find()

  const filteredUsers = users.map(user => {
    let obj = user.toObject()
    delete obj.password
    return obj
  })

  res.status(200).json({
    message: "users",
    payload: filteredUsers
  })
})


// ==========================
// SEARCH USERS
// ==========================
userapp.get("/search/:name", verifytoken("user"), async (req, res) => {

  try {

    const searchtext = req.params.name

    const users = await usermodel.find({

      $or: [

        {
          firstname: {
            $regex: searchtext,
            $options: "i"
          }
        },

        {
          lastname: {
            $regex: searchtext,
            $options: "i"
          }
        },

        {
          skills: {
            $in: [
              new RegExp(searchtext, "i")
            ]
          }
        }

      ]

    })

    const filteredUsers = users.map(user => {

      let obj = user.toObject()

      delete obj.password

      return obj
    })

    res.status(200).json({

      message: "search results",

      payload: filteredUsers

    })

  } catch (err) {

    res.status(500).json({
      message: err.message
    })
  }
})

// ==========================
// GET FOLLOWERS
// ==========================
userapp.get("/followers", verifytoken("user"), async (req, res) => {

  const user = await usermodel
    .findById(req.user.id)
    .populate("followers")

  let followers = user.followers.map(u => {
    let obj = u.toObject()
    delete obj.password
    return obj
  })

  res.status(200).json({
    message: "followers",
    payload: followers
  })
})


// ==========================
// GET FOLLOWING
// ==========================
userapp.get("/following", verifytoken("user"), async (req, res) => {

  const user = await usermodel
    .findById(req.user.id)
    .populate("following")

  let following = user.following.map(u => {
    let obj = u.toObject()
    delete obj.password
    return obj
  })

  res.status(200).json({
    message: "following",
    payload: following
  })
})


// ==========================
// UPDATE USER STATUS
// ==========================
userapp.put("/status", verifytoken("user"), async (req, res) => {

  const { isuseractive } = req.body

  const user = await usermodel.findByIdAndUpdate(
    req.user.id,
    { $set: { isuseractive } },
    { new: true }
  )

  if (!user) {
    return res.status(404).json({
      message: "user not found"
    })
  }

  let userobj = user.toObject()
  delete userobj.password

  res.status(200).json({
    message: "user status updated",
    payload: userobj
  })
})
