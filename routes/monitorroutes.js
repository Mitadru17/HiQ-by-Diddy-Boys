const express = require("express");
const { monitorInterview } = require("../controllers/monitorController");

const router = express.Router();

router.get("/monitor", monitorInterview);

module.exports = router;
