import { User } from "../database/models/user.models.js";

export const findUserByUid = async (firebaseUid) => {
  return await User.findOne({ firebaseUid });
};

export const findUserById = async (id) => {
  return await User.findById(id);
};
