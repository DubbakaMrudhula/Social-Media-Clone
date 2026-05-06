import { Schema, model } from "mongoose";

const requestSchema = new Schema({

  post: {
    type: Schema.Types.ObjectId,
    ref: "post",
    required: true
  },

  sender: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

  receiver: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }

}, {
  timestamps: true,
  versionKey: false
});

export const requestmodel = model("request", requestSchema);