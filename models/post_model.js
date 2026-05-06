import { Schema, model } from "mongoose";

// reply schema 
const replySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: [true, "user id required"]
  },
  text: {
    type: String,
    required: [true, "reply text required"]
  }
}, {
  timestamps: true,
  versionKey: false
});


// main post schema
const postSchema = new Schema({

  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: [true, "user id is required"]
  },

  content: {
    type: String,
    required: [true, "post content is required"]
  },

  image: {
    type: String
  },
posttype: {
  type: String,
  enum: ["normal", "collaboration", "internship", "study"],
  default: "normal"
},
  likes: [{
    type: Schema.Types.ObjectId,
    ref: "user"
  }],

  replies: [{
    type: replySchema
  }],

  ispostactive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const postmodel = model("post", postSchema);