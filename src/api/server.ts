import {createServer} from 'node:http';
import {route} from './app.ts';
const server=createServer(route);server.requestTimeout=5000;server.headersTimeout=5000;server.maxHeadersCount=32;
server.listen(Number(process.env.PORT||8080),process.env.HOST||'0.0.0.0');
process.on('SIGTERM',()=>server.close());
