const { buildSchema } = require("graphql");

const schema = buildSchema(`
type User {
_id: ID!
phone:String!
type:String!
active:Boolean!
online:Boolean
password: String!
dataToken:String!
username:String!
label:String
firstDeposit:Float
createdAt:String!
updatedAt:String!

}

type Player {
_id: ID!
phone:String!
type:String!
active:Boolean!
online:Boolean
password: String
dataToken:String!
username:String!
label:String
firstDeposit:Float
createdAt:String
updatedAt:String 
bets: [Playerbet]
}


type Admin {
_id: ID!
phone:String!
type:String!
active:Boolean!
password: String!
username:String!
createdAt:String!
updatedAt:String!
}
type GameData{
_id: ID!
round:String!
level:String!
createdAt:String!
updatedAt:String!
}

type STKDetails{
MerchantRequestID:String!,
CheckoutRequestID:String!,
ResponseCode: Float!,
ResponseDescription:String!,
CustomerMessage:String!
}

type Bet {
_id:ID!
serverSeed:String!
clientSeed:String!
nonce:String!
amount:Float!
betAmount:Float!
point:String!
round:String!
win:Boolean!
auto:Boolean
tax:Float!
crush:Float
user:User
balance:String
createdAt:String!
updatedAt:String!
}

type BetHistory{
_id:ID!
point:String!
user:User!
createdAt:String!
updatedAt:String!
}

type Account{
_id:ID!
balance:String!
active:Boolean!
user:Player
phone:String
createdAt:String!
updatedAt:String!
}

type betAggregate{
_id:ID!
numberofbets:Float!
}

type Deposit{
amount:String!
}

type winnersPerRound{
_id:ID!
amount:Float!
}

type losersPerRound{
_id:ID!
amount:Float!
}
type WinnersBets{
round:Float!
amount:Float!
}

type winnersPerMonth{
_id:ID!
amount:Float!
}

type losersPerMonth{
_id:ID!
amount:Float!
}

type usersPerMonth{
_id:ID!
amount:Float!
}

type House{
_id:ID!
houseTotal:Float!
user:User!
createdAt:String!
updatedAt:String!
}

type Transaction {
_id:ID!
type: String
amount: String
user:User
transactionId:String
trans_id:String
bill_ref_number:String
trans_time:String
balance:String
username:String
createdAt:String
updatedAt:String
}

type AuthData {
userId: ID!
token: String!
type:String!
username:String!
online:Boolean!
phone:String
dataToken:String
tokenExpiration: Int!
}

type ActiveUsers{
username:String!
active:Boolean!
type:String!
phone:String!
online:Boolean!
createdAt:String!
updatedAt:String!
}

type Logs {
_id:ID!
ip:String!
description:String!
transactionId:String
user:User
round:Float
point:Float
at:Float
crush:Float
balance:String
won:Boolean
createdAt:String!
updatedAt:String!
}

type AdminLogs {
_id:ID!
ip:String
description:String!
user:User
round:Float
point:Float
at:Float
crush:Float
won:Boolean
createdAt:String!
updatedAt:String!
}

input UserInput {
username:String!
phone: String!
type:String!
password: String!
}

input AdminUserInput {
username:String!
phone: String!
type:String!
password: String!
initiator:String!
}

input LoginInput {
username: String!
password: String!
}

input BetInput {
serverSeed:String!
nonce:String!
clientSeed:String!
amount:Float!
betAmount:Float!
point:String!
round:String!
user:String!
win:Boolean
auto:Boolean!
crush:String!
tax:Float!
}

input TransactionInput {
type:String!
amount:String!
}

type Playerbet {
_id: ID!
betAmount: Float!
point: Float!
userId: Player!
round: String!
possibleWin: Float
win:Boolean
createdAt: String!
updatedAt: String!
}

type Chat {
  _id: ID!
  message: String!
  userId: Player!
  createdAt: String!
  updatedAt: String!
}

input ChatInput {
  message: String!
  userId: ID!
}

input PlayerbetInput {
  betAmount: Float!
  point: Float!
  userId: ID!
  round: String!
  win: Boolean!
}
  
input LogsInput {
ip:String!
description:String!  
round:Float  
userId:String
point:Float
at:Float
crush:Float
}

input PermissionInput {
  entity_name: String!
  action_name: String!
  description: String!
}

type HouseAmount{
amount:Float!
}

type TotalDeposits{
amount:Float!
}

type ActivesCount{
count:Float!
total:Float!
}

type OTP{
otp:String!
verified:Boolean!
user:User
createdAt:String!
updatedAt:String!

}
type CustomerToTal{
amount:String!
}
type PlayerToTal{
tax:Float
won:Float
lost:Float
}

type AccountBalance{
amount:Float
}

type Role {
  _id: ID!
  name: String!
  permissions: [Permission!]!
}

type Permission {
  _id: ID!
  entity_name: String!
  action_name: String!
  description: String!
}


type RootQuery{
users: [User!]!
aUser(username:String!):Player!
admins: [Admin!]!
login(loginInput:LoginInput): AuthData!
adminLogin(loginInput:LoginInput): AuthData!
accountBalance(userId:String):Account!
transactions(userId:String):[Transaction!]!
bets(userId:String):[Bet!]!
historyBets(userId:String):[Bet!]!
allBets:[Bet!]!
filteredBets:[Bet!]!
allTransactions:[Transaction!]!
logs:[Logs!]!
deductAccountBalance(userId:String, amount:String, backend:Boolean, dataToken:String!):Account!
adminrefundAccount(userId:String, amount:String, backend:Boolean, initiator:String!):Account!
admindeductAccountBalance(userId:String, amount:String, backend:Boolean, initiator:String!):Account!
refundAccount(userId:String, amount:String, backend:Boolean):Account!
history(userId:String):[BetHistory!]!
accounts:[Account!]
house:[House!]!
updateHouse(amount:Float!, win:Boolean!, userId:String!):House!
getHouse:[House!]!
getCurrentRound(round:Float!):[Bet!]!   
betsPerMonth:[betAggregate!]! 
winnersPerRound:[winnersPerRound!]!
losersPerRound:[losersPerRound!]!
winnersPerMonth:[winnersPerMonth!]!
losersPerMonth:[losersPerMonth!]!
usersPerMonth:[usersPerMonth!]!
activesPerMonth:[usersPerMonth]
winnersBets:WinnersBets
houseAmount:[HouseAmount!]!
activeUser:[ActiveUsers!]!
logout(username:String!, initiator:String!):User!
logoutUser(username:String!):User!
countActives:ActivesCount
actives:[User!]!
players:[Player!]!
verifyOtp(otp:String!):OTP
systemLogs:[AdminLogs!]!
customerToTal:CustomerToTal
taxToTal:CustomerToTal
userTT(userId:String!):PlayerToTal
totalDeposits(userId:String!):TotalDeposits
totalWidrawal(phone:String!):TotalDeposits
withdraw(amount:Float, userId:String!, username:String!, phone:String!):Deposit
userTransaction(phone:String!):Transaction
accountBalanceUpdate(userId:String!, amount:String!):Account
transactionDetails(trans_id:String!):Account
calculateBalance:AccountBalance
getAllPlayers: [Player]!
}



type RootMutation{
changePassword(username:String, password:String, initiator:String!):Player!
createUser(userInput:UserInput): AuthData!
createAdmin(userInput:AdminUserInput): AuthData!
createBet(betInput:BetInput):Bet!
createTransaction(transactionInput:TransactionInput):Transaction!
createLogs(logsInput:LogsInput):Logs
createBetHistory(point:String!, user:String!):BetHistory!
createGameData(round:String!, level:String!):GameData
createActives(user:String!, round:String!, amount:String):ActiveUsers
generateOtp(username:String, phone:String):OTP!
generateAdminOtp(username:String, userId:String):OTP!
transactionStatus(reference:String!):Transaction
depositTest(phone:String!, amount:Float!, userId:String!):Account
suspendAccount(accountId:String!, initiator:String):Account
activateAccount(accountId:String!, initiator:String):Account
depositManual(phone:String!, userId:String!):Account
suspendPlayer(username:String,initiator:String!):User!
activatePlayer(username:String,initiator:String!):User!
changeType(username:String, type:String, initiator:String!):Admin!
changeAdminPassword(username:String, password:String,initiator:String!):User!
editAdminUserPhone(username:String, phone:String, initiator:String!):User!
editAdminUser(username:String, initiator:String!, phone:String, type:String!):Admin!
createPlayerbet(playerbetInput: PlayerbetInput!): Playerbet
createRole(name: String!, selectedPermissionIds: [ID!]!): Role
withdrawTest(userId: String!, amount: Float!, phone: String!): Account
createChat(chatInput: ChatInput!): Chat!

}



schema{
query:RootQuery
mutation:RootMutation
}

`);

module.exports = schema;
