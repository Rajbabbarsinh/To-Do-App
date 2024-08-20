const express = require("express");
require('dotenv').config();
const clc = require("cli-color");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session);
const jwt = require("jsonwebtoken");



// File-imports
const { userDataValidation, isEmailRgex } = require("./utils/authUtils");
const { DataValidation } = require("./utils/logUtils");
const userModel = require("./models/userModel");
const isAuth = require("./middleware/authMiddleware");
const {
  todoDataValidation,
  generateToken,
  sendVerificationMail,
} = require("./utils/todoUtils");
const todoModel = require("./models/todoModel");
const ratelimiting = require("./middleware/rateLimiting");


// Constants
const app = express();
const PORT = process.env.PORT;
const store = new mongodbSession({
  uri: process.env.MONGO_URI,
  collection: "sessions",
}); 

// DB Connection
mongoose
.connect(process.env.MONGO_URI)
.then(() => {
    console.log(clc.yellowBright.bold("MongoDB connected Successfully..."))
})
.catch((err) =>
    console.log(clc.redBright.bold(err)));

// Middle-wares

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
    secret : process.env.SECRET_KEY,
    store : store,
    resave : false,
    saveUninitialized : false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
}));

app.get('/', (req, res) => {
  return res.render("index.html")
});



app.get("/register", (req, res) => {
    return res.render("registerPage")
})

app.post("/register", async (req,res) => {
    const { name, email, username, password } = req.body;

// Data Validation
try{
    await userDataValidation({ name, email, username, password});
} catch (error) {
    return res.status(400).json(error)
}




try {

// E-main and username should be unique

const userEmailExist = await userModel.findOne({ email : email });
if(userEmailExist)
{
    return res.status(400).json("E-mail Already Exist...")
}

const userUserNameExist = await userModel.findOne({ username : username });
if(userUserNameExist)
{
    return res.status(400).json("Username Already Exist...")
} 

// Encrypt the password

const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT));


// Store with in dataBase



const userObj = new userModel({
  name,
  email,
  username,
  password: hashedPassword,
});

    const userDb = await userObj.save();

//genrate a token
const token = generateToken(email);


//send mail
sendVerificationMail(email, token);

return res.redirect("/login");
} catch (error) {
return res.status(500).json({
  message: "Internal server error",
  error: error,
});
}
});

app.get("/verifytoken/:token", async (req, res) => {
const token = req.params.token;
const email = jwt.verify(token, process.env.SECRET_KEY);


try {
await userModel.findOneAndUpdate(
  { email: email },
  { isEmailVerified: true }
);
return res.send("Email has been verified successfully");
} catch (error) {
return res.status(500).json(error);
}
});

app.get("/login", (req, res) => {
return res.render("loginPage");
})

app.get("/login", (req, res) => {
    return res.render("loginPage");
})

app.post('/login', async (req, res) => {
    const { loginId, password } = req.body;
    try {
         await DataValidation({loginId, password});
      }
      catch (error) {
        return res.status(400).json(error);
      }

// Find the user from Database

try{
     let userDb = {};
     if(isEmailRgex({key : loginId}))
     {
        userDb = await userModel.findOne({email : loginId});
     }
     else{
        userDb = await userModel.findOne({username : loginId});
     }
    
     if(!userDb)
        return res.status(400).json("User Not Found, Please Register First ! ");

     //check for verified email

    if (!userDb.isEmailVerified)
    return res.status(400).json("verify your email id before login");   

// Compare the Password
     
     const isMatched = await bcrypt.compare(password, userDb.password);
     if (!isMatched) return res.status(400).json("Incorrect password");

    
     req.session.isAuth = true;
     req.session.user = {
        userId : userDb._id,
        username : userDb.username,
        email : userDb.email,
     }

     return res.redirect("/dashboard");    

} catch (error) {
    return res.status(500).json(console.log());

}

// Session base Authentication
      
});

app.get("/dashboard", isAuth, (req, res) => {
     return res.render("dashboardPage");
    
});

app.post("/logout", isAuth, (req, res) => {
    req.session.destroy(err => {
        if(err)
        {
            return res.status(500).json("Logout unsuccessfull");
        } else {
            return res.redirect("/login");
        }
    })
});


// TO-DO's API's

app.post("/create-item", isAuth, ratelimiting, async (req, res) => {
    const todo = req.body.todo;
    const username = req.session.user.username;
  
    try {
      await todoDataValidation({ todo });
    } catch (error) {
      return res.status(400).json(error);
    }
  
    const userObj = new todoModel({
      todo: todo,
      username: username,
    });
  
    try {
       const todoDb = await userObj.save();
  
      return res.status(201).json({
        message: "Todo created successfully",
        data: todoDb,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error,
      });
    }
  });


  app.get("/read-item", isAuth, async (req, res) => {
    const username = req.session.user.username;
    const SKIP = Number(req.query.skip) || 0;
    const LIMIT = 10;
    try {
      // const todoDb = await todoModel.find({ username: username });

      const todoDb = await todoModel.aggregate([
        {
          $match : { username : username },
        },
        {
          $skip : SKIP,
        },
        {
          $limit : LIMIT,
        },
      ]);
  
      if (todoDb.length === 0) {
        return res.send({
          status: 204,
          message: "No todo found.",
        });
      }
  
      return res.send({
        status: 200,
        message: "Read success",
        data: todoDb,
      });
    } catch (error) {
      return res.send({
        status: 500,
        message: "Internal server error",
        error: error,
      });
    } 
  });



  app.post("/edit-item", isAuth, async (req, res) => {
  const newData = req.body.newData;
  const todoId = req.body.todoId;
  const username = req.session.user.username;

  if (!todoId) return res.status(400).json("Todo id is missing");

  try {
    await todoDataValidation({ todo: newData });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }

  try {
    const todoDb = await todoModel.findOne({ _id: todoId });

    if (!todoDb) {
      return res.send({
        status: 400,
        message: `todo not found with this id : ${todoId}`,
      });
    }

    //check the ownership
    
    if (username !== todoDb.username) {
      return res.send({
        status: 403,
        message: "not allowed to edit the todo",
      });
    }

    //update the todo in db
    const todoDbPrev = await todoModel.findOneAndUpdate(
      { _id: todoId },
      { todo: newData }
    );

    return res.send({
      status: 200,
      message: "Todo updated sucecssfully",
      data: todoDbPrev,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      errro: error,
    });
  }
});

app.post("/delete-item", isAuth, async (req, res) => {
  const todoId = req.body.todoId;
  const username = req.session.user.username;

  if (!todoId) return res.status(400).json("Todo id is missing");


  try {
    const todoDb = await todoModel.findOne({ _id: todoId });
  
    if (!todoDb) {
      return res.send({
        status: 400,
        message: `todo not found with this id : ${todoId}`,
      });
    }

    //check the ownership
    
    if (username !== todoDb.username) {
      return res.send({
        status: 403,
        message: "not allowed to Delete todo",
      });
    }

    //update the todo in db
    const todoDbPrev = await todoModel.findOneAndDelete(
      { _id: todoId }
    );

    return res.send({
      status: 200,
      message: "Todo Deleted sucecssfully",
      data: todoDbPrev,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      errro: error,
    });
  }
});


  
  
       
app.listen(PORT, () => {
    console.log(clc.yellowBright.bold("Server is running at :"));
    console.log(clc.yellowBright.underline(`http://localhost:${PORT}`));
});
