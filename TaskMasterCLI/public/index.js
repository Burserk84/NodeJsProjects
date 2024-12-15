#!/usr/bin/env node

import pkg from 'pg'; // Import the PostgreSQL module
const { Client } = pkg; // Destructure the client from the package
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'; // Required for yargs in ES modules

// PostgreSQL connection setup
const client = new Client({
  user: 'sharifiasldev', // Update with your PostgreSQL username
  host: 'localhost',     // Database host
  database: 'todo_db',   // Database name
  password: 'injairanast_84`', // Update with your PostgreSQL password
  port: 5432,            // Default PostgreSQL port
});

// Connect to PostgreSQL
client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('Connection error:', err.stack));

// Initialize the database (create table if not exists)
async function initializeDB() {
  const query = `
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      task TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done'))
    );
  `;
  await client.query(query);
}

initializeDB();

// CLI Command Handlers
async function addNewTask(task) {
  const res = await client.query('INSERT INTO todos (task) VALUES ($1) RETURNING *', [task]);
  console.log('New Task Added:', res.rows[0]);
}

async function listTasks(filter) {
  let query = 'SELECT * FROM todos';
  if (filter === 'pending' || filter === 'done') {
    query += ` WHERE status = '${filter}'`;
  }
  const res = await client.query(query);
  if (res.rows.length === 0) {
    console.log('No tasks found');
  } else {
    console.table(res.rows);
  }
}

async function markTaskAsDone(id) {
  const res = await client.query('UPDATE todos SET status = $1 WHERE id = $2 RETURNING *', ['done', id]);
  if (res.rowCount === 0) {
    console.log('Task not found');
  } else {
    console.log('Task Marked as Done:', res.rows[0]);
  }
}

async function deleteTask(id) {
  const res = await client.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
  if (res.rowCount === 0) {
    console.log('Task not found');
  } else {
    console.log('Task Deleted:', res.rows[0]);
  }
}

// Define CLI Commands
yargs(hideBin(process.argv))
  .scriptName('todo')
  .usage('Usage: $0 <command> [options]')
  .command('new <task>', 'Add a new todo item', {}, (args) => addNewTask(args.task))
  .command('list [filter]', 'List todo items', {
    filter: {
      describe: 'Filter by status',
      choices: ['all', 'pending', 'done'],
      default: 'all',
    },
  }, (args) => listTasks(args.filter))
  .command('done <id>', 'Mark a todo item as done', {}, (args) => markTaskAsDone(args.id))
  .command('delete <id>', 'Delete a todo item', {}, (args) => deleteTask(args.id))
  .command('help', 'List all available options', {}, () => yargs.showHelp())
  .command('version', 'Print the version of the application', {}, () => console.log('1.0.0'))
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;

// Graceful Exit
process.on('exit', () => {
  client.end();
});
