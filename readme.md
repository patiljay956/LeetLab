# LeetLab 🚀

A full-stack coding platform for practicing programming problems, built with modern web technologies. LeetLab provides a comprehensive environment for creating, managing, and solving coding challenges with real-time code execution and validation.

## ✨ Features

- **Problem Management**: Create, edit, and organize coding problems with multiple difficulty levels
- **Code Execution**: Real-time code compilation and execution using Judge0 API
- **Multi-language Support**: Support for multiple programming languages
- **User Authentication**: Secure user registration and login system
- **Role-based Access**: Admin and user roles with different permissions
- **Test Case Validation**: Automatic validation of solutions against test cases
- **Code Snippets**: Pre-built code templates for different languages
- **Problem Categories**: Organize problems with tags and difficulty levels

## 🛠️ Tech Stack

### Backend

- **Node.js** with **Express.js** - RESTful API server
- **Prisma ORM** - Database management and migrations
- **PostgreSQL** - Primary database
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **Judge0 API** - Code execution and compilation
- **CORS** - Cross-origin resource sharing

### Frontend

- Frontend development in progress

## 📁 Project Structure

```
LeetLab/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   └── problem.controller.js
│   │   ├── middlewares/           # Express middlewares
│   │   ├── routes/                # API routes
│   │   ├── libs/                  # External service integrations
│   │   │   ├── db.js              # Database connection
│   │   │   └── judge0.lib.js      # Judge0 API integration
│   │   └── utils/                 # Utility functions
│   └── package.json
├── frontend/                      # Frontend application (in development)
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Judge0 API access (for code execution)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/patiljay956/LeetLab.git
   cd LeetLab
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/leetlab"
   JWT_SECRET="your-jwt-secret-key"
   FRONTEND_URL="http://localhost:3000"
   JUDGE0_API_URL="https://ce.judge0.com"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The backend server will start on `http://localhost:8000` (or your configured port).

## 📊 Database Schema

### User Model

- **id**: Unique identifier
- **name**: User's display name
- **email**: Unique email address
- **role**: USER or ADMIN
- **password**: Hashed password
- **createdAt/updatedAt**: Timestamps

### Problem Model

- **id**: Unique identifier
- **title**: Problem title
- **description**: Problem statement
- **difficulty**: EASY, MEDIUM, or HARD
- **tags**: Array of problem categories
- **examples**: JSON with input/output examples
- **constraints**: Problem constraints
- **testCases**: JSON with test cases for validation
- **codeSnippets**: Pre-built code templates
- **referenceSolutions**: Correct solutions for validation
- **userId**: Creator's user ID

## 🔗 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Problems

- `GET /api/v1/problem` - Get all problems
- `GET /api/v1/problem/:id` - Get specific problem
- `POST /api/v1/problem` - Create new problem (Admin only)
- `PUT /api/v1/problem/:id` - Update problem (Admin only)
- `DELETE /api/v1/problem/:id` - Delete problem (Admin only)

## 🧪 Code Execution

LeetLab integrates with Judge0 API for secure code execution:

- **Supported Languages**: JavaScript, Python, Java, C++, C, and more
- **Sandboxed Execution**: Safe code execution in isolated environments
- **Test Case Validation**: Automatic validation against expected outputs
- **Real-time Results**: Fast execution and response times

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access Control**: Different permissions for users and admins
- **CORS Protection**: Configured cross-origin request handling
- **Input Validation**: Comprehensive request validation

## 🚦 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run database migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Code Quality

- Use ESLint for code linting
- Follow consistent naming conventions
- Write comprehensive error handling
- Add proper JSDoc comments for functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Jay Patil** - [@patiljay956](https://github.com/patiljay956)

## 🙏 Acknowledgments

- [Judge0 API](https://judge0.com/) for code execution services
- [Prisma](https://prisma.io/) for excellent database tooling
- [Express.js](https://expressjs.com/) for the robust web framework

---

**Note**: This project is currently in active development. The frontend is being built and more features are being added regularly.
