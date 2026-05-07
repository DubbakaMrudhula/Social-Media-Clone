import { Schema, model } from 'mongoose';

const userSchema = new Schema({

  firstname: {
    type: String,
    required: [true, "first name is required"],
    trim: true
  },

  lastname: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    required: [true, "email required"],
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: [true, "password req"]
  },

  profileImageurl: {
    type: String
  },

  followers: [{
    type: Schema.Types.ObjectId,
    ref: "user"
  }],

  following: [{
    type: Schema.Types.ObjectId,
    ref: "user"
  }],
  isPrivate: {
  type: Boolean,
  default: false
},
followRequests: [{
  type: Schema.Types.ObjectId,
  ref: "user"
}],
  bio: {
    type: String,
    maxlength: [160, "bio cannot exceed 160 characters"]
  },
role: {
  type: String,
  enum: ["user","admin"],
  default: "user"
},
skills: {
  type: [String],
  default: []
},
  isuseractive: {
    type: Boolean,
    default: true
  }

},
 {
  timestamps: true,
  versionKey: false,
  strict: "throw"
});

export const usermodel = model("user", userSchema);