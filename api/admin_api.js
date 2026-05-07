import express from "express"

import { usermodel } from "../models/user_model.js"
import { postmodel } from "../models/post_model.js"

import { verifytoken } from "../verifytoken.js"

const router = express.Router()



// GET ALL USERS

router.get(
  "/users",
  verifytoken("admin"),

  async (req, res) => {

    try {

      const users = await usermodel.find()

      res.status(200).json(users)

    } catch (err) {

      res.status(500).json({
        message: err.message
      })
    }
  }
)


// DELETE USER


router.delete(
  "/delete-user/:id",
  verifytoken("admin"),

  async (req, res) => {

    try {

      await usermodel.findByIdAndDelete(req.params.id)

      res.status(200).json({
        message: "user deleted"
      })

    } catch (err) {

      res.status(500).json({
        message: err.message
      })
    }
  }
)



// GET ALL POSTS


router.get(
  "/posts",
  verifytoken("admin"),

  async (req, res) => {

    try {

      const posts = await postmodel.find()

      res.status(200).json(posts)

    } catch (err) {

      res.status(500).json({
        message: err.message
      })
    }
  }
)



// DELETE POST


router.delete(
  "/delete-post/:id",
  verifytoken("admin"),

  async (req, res) => {

    try {

      await postmodel.findByIdAndDelete(req.params.id)

      res.status(200).json({
        message: "post deleted"
      })

    } catch (err) {

      res.status(500).json({
        message: err.message
      })
    }
  }
)
// MAKE ADMIN
router.put(
  "/make-admin/:id",
  verifytoken("admin"),
  async (req, res) => {
    try {
      const user = await usermodel.findByIdAndUpdate(req.params.id, { role: "admin" }, { new: true });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.status(200).json({ message: "User is now an admin", user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
)

// REMOVE ADMIN
router.put(
  "/remove-admin/:id",
  verifytoken("admin"),
  async (req, res) => {
    try {
      const user = await usermodel.findByIdAndUpdate(req.params.id, { role: "user" }, { new: true });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.status(200).json({ message: "Admin role removed", user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
)

// STATS
router.get(
  "/stats",
  verifytoken("admin"),
  async (req, res) => {
    try {
      const usersCount = await usermodel.countDocuments();
      const postsCount = await postmodel.countDocuments();
      res.status(200).json({ usersCount, postsCount });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
)

export default router