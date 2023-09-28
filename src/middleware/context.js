// const user async ({ req }) => {
//     // get the user token from the headers

//     const token = req.headers.authorization || "23";
//     // console.log(token);

//     // try to retrieve a user with the token
//     const user = (decodedToken = jwt.verify(token, process.env.SECRET_KEY));
//     // optionally block the user
//     // we could also check user roles/permissions here
//     if (!user)
//       // throwing a `GraphQLError` here allows us to specify an HTTP status code,
//       // standard `Error`s will have a 500 status code by default
//       throw new GraphQLError("User is not authenticated", {
//         extensions: {
//           code: "UNAUTHENTICATED",
//           http: { status: 401 },
//         },
//       });
//     // add the user to the context
//     return { userAuth: user };
//   },

const context = {
  AuthUser: "machina",
};

module.exports = context;
