const Chat = require("../models/Chat");
const Player = require("../models/Player");
const Logs = require("../models/logs");
async function getLiveChat() {
  const latestChats = await Chat.find({})
    .sort({ createdAt: -1 }) // Sort by createdAt in descending order (most recent first)
    .limit(20);
  // Limit the result to 20 messages
  const chatsWithDetails = await Chat.populate(latestChats, {
    path: "user", // Match this with the field name in Playerbet model that references User model
    model: Player, // Reference the User model
  });

  return chatsWithDetails;
}

async function fetchPlayersData() {
  const playerCount = await Player.countDocuments();
  // const onlineUserCount = await Player.countDocuments({ online: true });
  const today = new Date();
  // Set the time to midnight (00:00:00)
  today.setHours(0, 0, 0, 0);

  // Define the criteria for the query
  const criteria = {
    action: "login",
    createdAt: { $gte: today },
  };
  const todayUserCount = Logs.countDocuments(criteria, (err, count) => {
    if (err) {
      // console.error("Error counting logs:", err);
    } else {
      // console.log("Count of login logs today:", count);
    }
  });

  return { playing: playerCount, onlineToday: todayUserCount }; // Replace with actual data
}

module.exports = {
  getLiveChat,
  fetchPlayersData,
};
