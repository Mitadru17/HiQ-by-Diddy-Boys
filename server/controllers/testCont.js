const { Simulation, Interview } = require("../models/model");

// POST API to submit a test
exports.testSubmit = async (req, res) => {
  try {
    const { testName, questions } = req.body;
    const email = req.user?.email; // Safe check for email
    console.log("📩 Received Name:", testName);
    // Validate request
    if (
      !email ||
      !testName ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      console.error("❌ Invalid test submission data:", {
        email,
        testName,
        questions,
      });
      return res.status(400).json({ error: "Invalid request data" });
    }

    // Format the test object
    const newTest = {
      testName,
      questions,
    };

    // Find the user and update or create their test record
    let userSimulation = await Simulation.findOne({ email });

    if (!userSimulation) {
      userSimulation = new Simulation({
        email,
        tests: [newTest],
      });
    } else {
      userSimulation.tests.push(newTest);
    }

    // Save to database
    await userSimulation.save();
    res
      .status(201)
      .json({ message: "Test submitted successfully", data: userSimulation });
  } catch (error) {
    console.error("❌ Error submitting test:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res
        .status(400)
        .json({ success: false, error: "User email is required" });
    }

    const email = req.user.email;

    // Fetch all interview records for the user
    const interviews = await Interview.find({ email });

    // Fetch all simulation records & return only the `tests` array
    const simulations = await Simulation.find({ email }, "tests");

    if (!interviews.length && !simulations.length) {
      return res
        .status(404)
        .json({ success: false, message: "No reports found for this user" });
    }

    res.status(200).json({
      success: true,
      interviews,
      simulations, // Only returning tests array
    });
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
