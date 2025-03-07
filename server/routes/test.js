const express = require("express");
const { testSubmit } = require("../controllers/testCont");
const verifyToken = require("../config/jwtVerify");
const router = express.Router();

router.post("/test-sub", verifyToken, testSubmit);


module.exports = router;