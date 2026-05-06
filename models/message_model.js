import { Schema, model } from "mongoose";

const messageSchema = new Schema({

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

  text: {
    type: String,
    required: true
  }

}, {
  timestamps: true,
  versionKey: false
});

export const messagemodel = model("message", messageSchema);