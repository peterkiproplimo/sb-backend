const { buildSchema } = require("graphql");

const schema= buildSchema(`
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


type Account{
_id:ID!
balance:String!
active:Boolean!
user:User
phone:String
createdAt:String!
updatedAt:String!
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



type RootQuery{
users: [User!]!
aUser(username:String!):User!
admins: [Admin!]!
login(loginInput:LoginInput): AuthData!
adminLogin(loginInput:LoginInput): AuthData!
changePassword(username:String, password:String, initiator:String!):User!
accounts:[Account!]
actives:[User!]!
players:[User!]!
gameResult: Float
generateSHA512(inputString: String): String!
veryfyGame(inputString: String): String!
generateServerSeed: String
generateClientSeed: String
generateSaltedSHA256: String
}



type RootMutation{
createUser(userInput:UserInput): AuthData!
createAdmin(userInput:AdminUserInput): AuthData!

}



schema{
query:RootQuery
mutation:RootMutation
}

`)

module.exports = schema;