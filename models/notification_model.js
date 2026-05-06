import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: [true, "receiver user id required"]
  },

  sender: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: [true, "sender user id required"]
  },


  type: {
    type: String,
enum: [
  "like",
  "reply",
  "request",
  "follow_request",
  "follow_accept"
],   
required: [true, "notification type required"]
  },


  post: {
    type: Schema.Types.ObjectId,
    ref: "post",
    required: [true, "post id required"]
  },

  message: {
    type: String
  },

  isread: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const notificationmodel = model("notification", notificationSchema);   