const express = require('express')
var cors = require('cors');
const port = 3000
var path = require('path')
var bodyParser = require('body-parser')
const app = express()
var fs = require("fs");
var multer = require('multer');
var upload = multer({ dest: '/tmp/' })
const mysql = require('mysql');

app.use(cors());
app.use(express.static(path.join(__dirname, '')));
app.use(express.urlencoded());
app.use(bodyParser.json());
app.use(express.json());
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1'
});
AWS.config.apiVersions = {
  s3: '2006-03-01',
};
const s3 = new AWS.S3();

const con = mysql.createConnection({
  host: "my-node-database.cluster-cayiqizxzfad.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "scaaapEpupa"
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html");
})

app.get('/ReceiveData', (req, res) => {
  const con = mysql.createConnection({
    host: "my-node-database.cluster-cayiqizxzfad.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "scaaapEpupa"
  });
  con.connect(function (err) {
    con.query(`SELECT * FROM main.foundItem`, async function (err, result, fields) {
      if (err) res.send(err);
      if (result) {
        console.log(result);
        app.use(bodyParser.json());
      }
      const data = await result;
      res.json({ message: JSON.parse(JSON.stringify(data)) });
    })
  });
})

app.get('/lost-items.html', (req, res) => {
  // console.log('hi');
  res.sendFile(__dirname + "/lost-items.html");
})

app.get('/contact.html', (req, res) => {
  res.sendFile(__dirname + "/contact.html");
})

app.post('/uploadLostItem', upload.single("image"), (req, res) => {

  var file = __dirname + "/upload-images/" + req.file.originalname;
  console.log(JSON.stringify(req.body));

  fs.readFile(req.file.path, function (err, data) {
    fs.writeFile(file, data, function (err) {
      if (err) {
        console.error(err);
        response = {
          message: 'Sorry, file couldn\'t be uploaded.',
          filename: req.file.originalname
        };
      } else {
        response = {
          message: 'File uploaded successfully',
          filename: req.file.originalname
        };
        const folder = "upload-images/";
        const file = (req.file.originalname);
        const params = {
          Bucket: '204703q-lostandfoundwebsite',
          Key: (folder + file),
          ACL: 'public-read',
          Body: req.file.originalname
        };
        s3.putObject(params, function (err, data) {
          if (err) {
            console.log("Error: ", err);
          } else {
            console.log(data);
          }
        });
        // con.connect(function(err) {
        //     if (err) throw err;

        //     con.query('CREATE DATABASE IF NOT EXISTS main;');
        //     con.query('USE main;');
        //     con.query('CREATE TABLE IF NOT EXISTS foundItem(id int NOT NULL AUTO_INCREMENT, itemname varchar(200), image varchar(255), name varchar(150), contactno int, category varchar(100), date varchar(15), time varchar(10), location varchar(200), description varchar(500), PRIMARY KEY(id));', function(error, result, fields) {
        //         console.log(result);
        //     });
        //     con.end();
        // });
        con.connect(function (err) {
          con.query(`INSERT INTO main.foundItem (itemname, image, name, contactno, category, date, time, location, description) VALUES ('${req.body.itemname}', '${req.file.originalname.toString()}', '${req.body.name}', '${req.body.contactno}', '${req.body.category}', '${req.body.date}', '${req.body.time}', '${req.body.location}', '${req.body.description}')`, function (err, result, fields) {
            if (err) console.log(err);
            if (result) console.log('success in database');
            con.query(`SELECT * FROM main.foundItem`, function (err, result, fields) {
              if (err) console.log(err);
              if (result)
                //res.send(result);
                var result = JSON.parse(JSON.stringify(result));
              for (item in result) {
                console.log(result[item].name);
              }
              // result is  [{},{}] indeed
            });
            if (fields) console.log(fields);
          });
        });
      }
      console.log(JSON.stringify(response));
      res.end(JSON.stringify(response));
    });
  });
  res.sendFile(__dirname + "/submit-lost-item.html");
})

// app.listen(port, () => {
//   //console.log(`Example app listening on port ${port}`)
//   console.log(`Server running at http://localhost:${port}/lost-items.html`);
// })

module.exports = { mysql }
