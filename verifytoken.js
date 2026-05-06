import jwt from "jsonwebtoken"

export const verifytoken = (...allowedroles) => {

  return (req, res, next) => {

    try {
      // get token from cookies
      const token = req.cookies.token

      // if token not present
      if (!token) {
        return res.status(401).json({ message: "unauthorized access" })
      }

      // verify token using secret key
      const decoded = jwt.verify(token, process.env.Secret_key)
        console.log("TOKEN PAYLOAD:", decoded)
      // attach decoded data to request
      req.user = decoded

      // role-based authorization check
      if (allowedroles.length > 0 && !allowedroles.includes(decoded.role)) {
        return res.status(403).json({ message: "forbidden access" })
      }

      // move to next middleware / route
      next()

    } catch (err) {
      return res.status(401).json({ message: "invalid or expired token" })
    }
  }
}