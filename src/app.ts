import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env';
import routes from './routes';
import { DatabaseManager } from './database/Database';

const app = express();

DatabaseManager.getInstance();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.resolve(process.cwd(), 'public')));

app.use('/', routes);

app.listen(ENV.PORT, () => {
    console.log(`OAuth Server & Client running on port ${ENV.PORT}`);
});
