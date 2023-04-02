const express = require('express');
const multer = require('multer');
const sql = require('mssql');

const app = express();
const port = process.env.PORT || 3000;

// Set up MSSQL connection
const config = {
  user: 'nodeAppDbServer@node-app-db-server',
  password: 'Punit@1230',
  server: 'node-app-db-server.database.windows.net',
  database: 'node-app-db',
  options: {
    encrypt: true
  }
};
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// Configure Multer to store uploaded files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000000 }
});

// Set up route to handle file uploads
app.post('/upload', upload.single('image'), (req, res) => {
  // Get the name and data of the uploaded file
  const name = req.file.originalname;
  const data = req.file.buffer;

  // Check if the images table exists, and create it if it doesn't
  poolConnect.then(() => {
    const request = new sql.Request(pool);
    request.query('IF OBJECT_ID(\'dbo.images\', \'U\') IS NULL CREATE TABLE dbo.images (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(255) NOT NULL, data VARBINARY(MAX) NOT NULL)', (err, result) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      } else {
        console.log(`Created table if it didn't already exist`);

        // Insert the file data into the database
        const insertRequest = new sql.Request(pool);
        insertRequest.input('name', sql.NVarChar, name);
        insertRequest.input('data', sql.VarBinary(sql.MAX), data);
        insertRequest.query('INSERT INTO dbo.images (name, data) VALUES (@name, @data)', (err, result) => {
          if (err) {
            console.error(err);
            res.sendStatus(500);
          } else {
            console.log(`Inserted ${result.rowsAffected} rows`);
            res.sendStatus(200);
          }
        });
      }
    });
  }).catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
