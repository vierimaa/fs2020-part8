require('dotenv').config()
const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require("jsonwebtoken")

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

const JWT_SECRET = process.env.SECRET

// const auth1 = new Author({
//   name: 'Robert Martin',
//   born: 1952
// })

// auth1.save().then(result => {
//   console.log('author saved!')
// })

// const book1 = new Book({
//   title: 'Clean Code',
//   published: 2008,
//   author: '5f873a854e67f504344c83b4',
//   genres: ['refactoring']
// })

// book1.save().then(result => {
//   console.log('book saved!')
// })


const MONGODB_URI = process.env.MONGODB_URI

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Author {
    name: String!
    born: Int
    id: ID!
    bookCount: Int
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  
  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (args.author && args.genre) {
        const author = await Author.findOne({ name: args.author })
        const books = await Book.find({ 
          $and: [
            { author: { $in: author.id } },
            { genres: { $in: args.genre } }
          ]
           
        }).populate('author')
        return books

      } else if (args.author && !args.genre) {
        const author = await Author.findOne({ name: args.author })
        const books = await Book.find({ author: { $in: author.id } }).populate('author')
        return books

      } else if (args.genre && !args.author) {
        return await Book.find({ genres: { $in: args.genre } }).populate('author')

      } else {
        const books = await Book.find({}).populate('author')
        return books
      }
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      return authors
    },
    me: (root, args, { currentUser}) => {
      return currentUser
    }
  },
  Author: {
    bookCount: (root) => {
      return Book.find({ author: { $in: root.id } }).countDocuments()
    }
  },
  Mutation: {
    addBook: async (root, args, { currentUser} ) => {
      const author = await Author.findOne({ name: args.author })

      const bookUniqueCount = await Book.find({ title: { $in: args.title } }).countDocuments()

      if (!currentUser) {
        throw new AuthenticationError("Not authenticated")
      }

      if (bookUniqueCount > 0) {
        throw new UserInputError(`Name must be unique`, {
          invalidArgs: args.title,
        })
      }

      if (!author) {
        try {
          const newAuthor = new Author({ name: args.author })
          await newAuthor.save()
          const newBook = new Book({ ...args, author: newAuthor._id})
          await newBook.save()
          return newBook.populate('author').execPopulate()
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        }
        
      }
      if (author) {
        try {
          const newBook = new Book({ ...args, author: author._id})
          await newBook.save()
          return newBook.populate('author').execPopulate()
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        }
      }
    },
    editAuthor: async (root, args, { currentUser}) => {
      let author = await Author.findOne({ name: args.name })

      if (!currentUser) {
        throw new AuthenticationError("Not authenticated")
      }

      if (!author) {
        return null
      }

      try {
        author.born = args.setBornTo
        await author.save()
        return author
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      try {
        await user.save()
        return user
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      if ( !user || args.password !== 'secret' ) {
        throw new UserInputError("Wrong credentials")
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLocaleLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})