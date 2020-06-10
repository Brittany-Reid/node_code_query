// import express library
const express = require('express');
const app = express();   // create express object
app.use(express.json()); // load default configurations
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`)); // spawn the server

// initialize records
const users = [
  {name: 'Brittany Reid', id: 1},
  {name: 'Marcelo d`Amorim', id: 2},
  {name: 'Keila Barbosa', id: 3}
]

// for parsing application/x-www-form-urlencoded
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); 

// CREAET
app.post('/api/users', (req, res)=> {
  const user = {
    id: users.length + 1,
    name: req.body.name
  };
  users.push(user);
  res.send(user);
  console.log(users);
});


// READ
app.get('/', (req, res) => {
  res.send('Welcome to REST API with Node.js!');
});

app.get('/api/users', (req,res)=> {
  res.send(users);
});


app.get('/api/users/:id', (req, res) => {
  const user = users.find(c => c.id === parseInt(req.query.id));
  if (!user) res.status(404).send('<h2 style="font-family: Malgun Gothic; color: darkred;">Ooops... Cant find what you are looking for '+req.params.id+'!</h2>');
  res.send(user);
});

// UPDATE
app.put('/api/users/:id', (req, res) => {
  const user = users.find(c=> c.id === parseInt(req.query.id));
  if (!user) res.status(404).send('<h2 style="font-family: Malgun Gothic; color: darkred;">Not Found!! </h2>');
  const { error } = validateuser(req.body);
  if (error){
     res.status(400).send(error.details[0].message);
     return;
  }
  user.name = req.body.name;
  res.send(user);
});

// DELETE
app.delete('/api/users/:id', (req, res) => {
   
  const user = users.find( c=> c.id === parseInt(req.params.id));
  if(!user) res.status(404).send('<h2 style="font-family: Malgun Gothic; color: darkred;"> Not Found!! </h2>');
   
  const index = users.indexOf(user);
  users.splice(index,1);
   
  res.send(user);
});
