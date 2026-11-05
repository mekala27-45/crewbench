import {createServer} from 'node:http';
import {STATEMENT, STATEMENT_ID} from '../report/statement.ts';

export const server = createServer((req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  const common = {statement_id: STATEMENT_ID, statement_url: '/statement'};
  if (req.method === 'GET' && req.url === '/healthz') {
    res.end(JSON.stringify({...common, service: 'crewbench', stage: 'health_scaffold', commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.SOURCE_COMMIT || 'local-uncommitted'}));
  } else if (req.method === 'GET' && req.url === '/statement') {
    res.end(JSON.stringify({...common, statement: STATEMENT}));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({...common, error: 'NOT_FOUND'}));
  }
});
server.listen(Number(process.env.PORT || 8080), process.env.HOST || '127.0.0.1');
