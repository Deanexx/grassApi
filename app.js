const express = require("express"),
      app = express(),
      morgan = require('morgan'),
      bodyParser = require('body-parser').json(),
      cookieParser = require('cookie-parser'),
      cors = require('cors'),
      merchandiseRouter = require('./routes/merchandiseRoute'),
      userRouter = require('./routes/userRoute')

app.use(bodyParser);
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:8080',
    optionsSuccessStatus: 200,
    credentials: true // allowing setting cookies
}))

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/users', userRouter);
app.use("/merchandise", merchandiseRouter);

module.exports = app;