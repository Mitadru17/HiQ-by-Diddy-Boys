const express = require("express");
const { testSubmit, getReports } = require("../controllers/testCont");
const verifyToken = require("../config/jwtVerify");
const router = express.Router();

router.post("/test-sub", verifyToken, testSubmit);
router.get("/reports",verifyToken, getReports);


module.exports = router;