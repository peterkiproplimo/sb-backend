const { buildSchema } = require("graphql");

const schema = buildSchema(`
type User {
  _id: ID!
  phoneNumber:String
  status:Boolean!
  deleted:Boolean!
  password: String
  username:String!
  role:String
  createdAt:String
  updatedAt:String
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
otp:String
label:String
firstDeposit:Float
createdAt:String
updatedAt:String 
bets: [Playerbet]
}

type SinglePlayer {
  player: Player
  account: Account
  bets: [Playerbet]
  transactions: [Transaction]
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

type Game{
_id: ID!
bustpoint: Float
seedeed: String!
played: Int!
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

type History{
  _id:ID!
  point:String!
  hash:String!
  round:String!
  createdAt:String!
  updatedAt:String!
  }

type Account{
_id:ID!
balance:Float!
karibubonus:Float
totalbalance:Float
active:Boolean!
user:Player
phone:String
deposits:Float
withdrawals:Float
winnings:Float
loses:Float
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
user:Player
account:Account
transactionId:String
trans_id:String
bill_ref_number:String
trans_time:String
balance:String
username:String
createdAt:String
updatedAt:String
MerchantRequestID:String
CheckoutRequestID:String
mpesaReceiptNumber:String
phone:String
status: Int
}

type AuthData {
userId: ID
token: String
type:String
balance:Float
username:String!
online:Boolean
phone:String
dataToken:String
tokenExpiration: Int
otp:String
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
action:String
user:User
createdAt:String!
updatedAt:String!
}

type AdminLogs {
  _id:ID!
  ip:String!
  description:String!
  action:String
  user:User
  createdAt:String!
  updatedAt:String!
}

type HouseRevenue {
  currentDay: Float
}

type HouseLosesToday {
  currentDay: Float
}

type MPESABalance {
  paybillTotal: Float
  b2cTotal: Float
}

type Players {
  total: Int
  onlineToday: Int
}

type WithholdingTax {
  total: Float
}

type WalletsTotal {
  grandTotal: Float
}

type HouseWins {
  monthlyTotal: Float
}
type playerWallets {
  totalPlayersBalance: Float
}

type HouseLosses {
  monthlyTotal: Float
}
type totalearned {
  totalearned: Float
}

type totalpaid {
  totalpaid: Float
}

type DashboardData {
  houseRevenue: HouseRevenue
  houseLose: HouseLosesToday
  mpesaBalance: MPESABalance
  players: Players
  withholdingTax: WithholdingTax
  walletsTotal: WalletsTotal
  houseWins: HouseWins
  houseLosses: HouseLosses
  playerWallets: playerWallets
}

type affiliateProgram {
  earned: totalearned
  paid: totalpaid
}

input PlayerInput {
username:String!
phone: String!
type:String!
password: String!
otp:String
}

input AdminUserInput {
username:String!
phone: String!
password: String!
roleId:String!
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
round:String
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
round:String
balance:Float
userId: Player
roundid: Game
withholdingtax:Float
winamount:Float
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
  round: String
  win: Boolean
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

input CreateUserInput {
  username: String!
  phoneNumber: String!
  password: String
  role: String!
}
input UpdateUserInput {
  _id: ID!
  username: String
  phoneNumber: String
  role: String!
}

input CreateRoleInput {
  name: String!
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
phone:String!
username:String!
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
  description: String
  createdAt:String!
  updatedAt:String!
}

type Permission {
  _id: ID!
  entity_name: String!
  action_name: String!
  description: String!
}

type adminAuthData {
  userId: ID!
  username: String!
  role: String!
  token: String!
  tokenValidity: Int!
}

type FAQ{
  _id: ID!
  question: String!
  answer: String!
}

input FaqInput{
  question: String!
  answer: String!
}

type Response {
  status: String
  message: String
}

type Policy {
  _id: ID
  policy: String
}

type Terms {
  _id: ID
  terms: String
}

type PlayersData{
  players: [Player]!,
  paginationInfo: PaginationInfo
}

type BetsData{
  playerBets: [Playerbet]!,
  paginationInfo: PaginationInfo
}
type TransactionsData{
  transactions: [Transaction]!,
  paginationInfo: PaginationInfo
}
type UsersData{
  users: [User]!
  paginationInfo: PaginationInfo
}
type AdminLogsData{
  logs: [AdminLogs]!
  paginationInfo: PaginationInfo
}
type PaginationInfo{
  current_page: Int,
  total_pages: Int,
  total_items: Int,
  per_page: Int
},

type Settings {
  _id: ID
  item: String
  value: String
  createdAt: String
  updatedAt: String
}



type RootQuery{
  getUsers(searchTerm: String, status: String, page: Int, per_page: Int): UsersData!
  getUser(userId: String): User!
  aPlayer(username:String!):Player!
  getPlayer: SinglePlayer
  admins: [Admin!]!
  login(loginInput:LoginInput): AuthData!
  adminLogin(loginInput:LoginInput): AuthData!
  accountBalance:Account!
  accountSummary:Account! 
  transactions(userId:String):[Transaction!]!
  bets(userId:String):[Bet!]!
  historyBets:[Playerbet!]!
  allBets(searchTerm: String, win:String, page: Int, per_page: Int):BetsData!
  filteredBets:[Bet!]!
  allTransactions(searchTerm: String, page: Int, per_page: Int):TransactionsData!
  logs:[Logs!]!
  deductAccountBalance(userId:String, amount:String, backend:Boolean, dataToken:String!):Account!
  adminrefundAccount(userId:String, amount:String, backend:Boolean, initiator:String!):Account!
  admindeductAccountBalance(userId:String, amount:String, backend:Boolean, initiator:String!):Account!
  refundAccount(userId:String, amount:String, backend:Boolean):Account!
  history:[History!]!
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
  permissions:[Permission!]!
  roles:[Role!]!
  verifyOtp(otp:String!):OTP
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
  getAllPlayers(username: String, active: String, page: Int, per_page: Int): PlayersData!
  Dashboard: DashboardData
  affiliate: affiliateProgram

  
  getSinglePlayer(playerId: String!): SinglePlayer
  getAccounts(page: Int, limit: Int): [Account!]!
  getFAQs: [FAQ!]!
  getPolicy: Policy
  getTerms: Terms

  getAdminLogs(page: Int, per_page: Int): AdminLogsData!
  getUserData: User!

  getSettings: [Settings]!
  getSettingById(id: ID!): Settings
}



type RootMutation{
  changePassword(username:String, password:String, initiator:String!, otp:String!):Player!
  createPlayer(userInput:PlayerInput): AuthData!
  createAdmin(userInput:AdminUserInput): AuthData!
  createBet(betInput:BetInput):Bet!
  createTransaction(transactionInput:TransactionInput):Transaction!
  createLogs(logsInput:LogsInput):Logs
  createBetHistory(point:String!, user:String!):BetHistory!
  createGameData(round:String!, level:String!):GameData
  createActives(user:String!, round:String!, amount:String):ActiveUsers
  generateOtp(username:String, phone:String):OTP!
  generateForgetpasswordOtp(username:String):OTP!
  generateAdminOtp(username:String, userId:String):OTP!
  transactionStatus(reference:String!):Transaction
  depositTest(phone:String!, amount:Float!, userId:String!):Account
  depositManual(phone:String!, userId:String!):Account
  
  activatePlayer(username:String,initiator:String!):User!
  changeType(username:String, type:String, initiator:String!):Admin!
  editAdminUserPhone(username:String, phone:String, initiator:String!):User!
  editAdminUser(username:String, initiator:String!, phone:String, type:String!):Admin!
  createPlayerbet(playerbetInput: PlayerbetInput!): Playerbet
  createRole(roleInput : CreateRoleInput): Response
  withdrawTest(userId: String!, amount: Float!, phone: String!): Account
  createChat(chatInput: ChatInput!): Chat!
  logoutPlayer(username:String!):Player!

  suspendPlayer(playerId:String!):Response!

  adminLogin(username: String!, password: String!): adminAuthData!
  updateOrCreateUser(userId:String, userInput: CreateUserInput): Response!
  updateUser(userInput: UpdateUserInput): User!
  deleteUser(userId: String!): Response!
  restoreUser(userId: String!): Response!
  suspendUser(userId: String!): Response!
  activateUser(userId: String!): Response!

  updateBalance(accountId: String!, amount: Float, updateReason: String): Response!
  restoreAccount(accountId: String!): Response!
  suspendAccount(accountId: String!): Response!

  
  createFAQ(faqInput: FaqInput!): Response!
  updateFAQ(faqId: String!, faqInput: FaqInput!): Response!
  deleteFAQ(faqId: String!): Response!
  updatePolicy(policy: String!): Response!
  updateTerms(terms: String!): Response!

  changeAdminPassword(password: String): Response!

  createSetting(item: String!, value: String!): Settings!
  updateSetting(id: ID!, item: String!, value: String!): Settings!
  deleteSetting(id: ID!): Settings!
}



schema{
query:RootQuery
mutation:RootMutation
}

`);

module.exports = schema;
