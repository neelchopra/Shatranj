const jwt = require("jsonwebtoken");

/** Populates req.userId when a valid token is present, but never rejects the request. */
const optionalAuth = (req, res, next) => {
	const header = req.headers.authorization || "";
	const token = header.startsWith("Bearer ") ? header.slice(7) : null;
	if (!token) return next();
	try {
		req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
	} catch (err) {
		// Invalid/expired token — proceed as a guest rather than failing the request.
	}
	next();
};

module.exports = optionalAuth;
