const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ msg: "no token provided, authorization denied" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ msg: "token is not valid" });
    }
};

module.exports = authMiddleware;
