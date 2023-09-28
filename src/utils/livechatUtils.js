const Chat = require("../models/Chat");
const Player = require("../models/Player");

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

module.exports = {
  getLiveChat,
};
