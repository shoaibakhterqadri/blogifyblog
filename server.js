const express = require('express');
const dotEnv = require('dotenv');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const dbConnect = require('./config/dbConnect');

const authRouter = require('./routes/authRoutes');
const dashboadRoute = require('./routes/Dashborad/dashboradRoutes');
const homeRoutes = require('./routes/home/homeRoutes');
const homeCommentRoutes = require('./routes/home/homeCommentRoutes');
const contactRoute = require('./routes/home/contactRoutes');

app.get('/', (req, res) => {
    res.send('server is running')
})

dotEnv.config({
    path: 'backend/config/config.env'
})

app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use('/rest-api', authRouter);
app.use('/rest-api', dashboadRoute);
app.use('/rest-api', homeRoutes)
app.use('/rest-api/', homeCommentRoutes)
app.use('/rest-api', contactRoute); 

dbConnect();

const PORT = process.env.PORT || 5000

app.listen(PORT, (error) => {
    if (!error) {
        console.log(`server is running port ${PORT}`);
    }
})
