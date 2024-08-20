const accessModel = require("../models/accessModel");

const ratelimiting = async (req, res, next) => {
  
  const sid = req.session.id;
  try {
    const accessDb = await accessModel.findOne({ sessionId: sid });
    

    //this is the first req, create an entry in db
    if (!accessDb) {
      
      const accessObj = new accessModel({ sessionId: sid, time: Date.now() });
      await accessObj.save();
      next();
      return;
    }
    

    const diff = (Date.now() - accessDb.time) / 1000;

    //if it is less then your logic
    if (diff < 1) {
      // 1 req/sec
      return res
        .status(400)
        .json("Too many request, please wait for some time");
    }

    //req time is fine
    const db = await accessModel.findOneAndUpdate(
      { sessionId: sid },
      { time: Date.now() }
    );
    next();
  } catch (error) {
    return res.status(500).json(error);
  }
};

module.exports = ratelimiting;

