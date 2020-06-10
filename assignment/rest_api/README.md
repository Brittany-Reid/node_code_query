## Creating a CRUD (REST) API
> Based on the [tutorial](https://medium.com/edureka/rest-api-with-node-js-b245e345f7a5) by Zulaikha Geer.

**Context**

You should implement a Web API with CRUD operations. 
CRUD refers to the kinds of operations an API needs to implement ---**C** is for Create a record, **R** is for Reading the records, **U** is for updating the records, and **D** is for deleting the records. 
The developer can store the records however he wants.

**Assignment**

Create a CRUD Web API to maintain names and ids of people.

**Solution**

1. Create a server.

Many options exist to create a web APIs in node.js. 
Let us use Express for its popularity.

```js
// spawn an express server
const express = require('express');
const app = express();   // create express object
app.use(express.json()); // load default configurations
// ** will refer to this place later **
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`)); // spawn the server
```
The server should be listening at port 8080 now. 
Open the browser and type "http://localhost:80". 
It should print "Cannot GET /" indicating that the API is not able to answer to GET requests on the route "/". 
Let us try to fix this.

2. Create a list of records

> IMPORTANT: _All the code snippet below should be placed at the location indicated on step 1._

We will implement our store as a non-persistent list. 
Add the list below, responsible for storing the local state of the app.

```js
// initialize records
const users = [
  {name: 'Brittany Reid', id: 1},
  {name: 'Marcelo d`Amorim', id: 2},
  {name: 'Keila Barbosa', id: 3}
]
```

3. Prepare application to parse urlencoded data.

```js
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
```

4. Add a create operation. The **C** in CRUD.

```js
app.post('/api/users', (req, res)=> {
  const user = {
    id: users.length + 1,
    name: req.body.name
  };
  users.push(user);
  res.send(user);
  console.log(users);
});
```

This operation responds to posts requests on the `/api/users` route. 
The second parameter of the call is a function with two parameters. 
The parameter req denotes the _HTTP_ request. 
The data can be read from this object. 
The parameter res denotes the response. This is where data should be written. 
The body of this function creates a user record, adds that record to the local store--variable users--and responds to the answer with the method send.

A user typically makes _POST_ requests using web forms (See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST). 
However, it is possible to forge a _POST_ request from the command line with the command curl:

```js
curl -d 'name=Joe' -H "Content-Type: application/x-www-form-urlencoded" -X POST http://localhost:8080/api/users
```

The command should answer with the following _JSON_.

```js
{"id":4,"name":"Joe"}
```

This is a confirmation that the record has been stored in the user list.


5. Add read operations. The **R** in CRUD.

Let's first get rid of the message "Cannot GET /" on the base route. 
The following command associates a function (handler) with the base route "/". 
The anonymous function has the same form as the one used in the call to app.post on step 3. 
This function is called when a GET request is made. Execute your code with this function and then access "http://localhost:8080".

```js
app.get('/', (req, res) => {
  res.send('Welcome to REST API with Node.js!');
});
```

Now you should see "Welcome to REST API with Node.js!".

- Add another route to read the list of users.

```js
app.get('/api/users', (req,res)=> {
  res.send(users);
});
```

Type `http://localhost:8080/api/users` on your browser.
Your browser should present a tree view of the JSON with the list of user records.

- Add another route that takes the id of the user and returns its data.

```js
app.get('/api/users/:id', (req, res) => {
  const user = users.find(c => c.id === parseInt(req.query.id));
  if (!user) res.status(404).send('<h2 style="font-family: Malgun Gothic; color: darkred;">Ooops... Cant find what you are looking for '+req.params.id+'!</h2>');
  res.send(user);
});
```

Type the URL `localhost:8080/api/users/:id?id=1` on your browser. 
It should show a JSON record for the user number 1 "Brittany Reid".

6. Add an update operation. The **U** in CRUD.

```js
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
```

Use the curl command, as in step 3, using the option `-X PUT` to indicate the method is _PUT_ and pass the parameters "id" and "name" on the command line.

7. Add an delete operation. The **D** in CRUD.

```js  
app.delete('/api/users/:id', (req, res) => {
   
  const user = users.find( c=> c.id === parseInt(req.params.id));
  if(!user) res.status(404).send('<h2 style="font-family: Malgun Gothic; color: darkred;"> Not Found!! </h2>');
   
  const index = users.indexOf(user);
  users.splice(index,1);
   
  res.send(user);
});
```

Again, to test this feature, use the curl operation with the option `-X DELETE` to delete the corresponding record. 
More precisely, run the following command in the shell:

```js
curl -d 'id=4' -H "Content-Type: application/x-www-form-urlencoded" -X DELETE http://localhost:8080/api/users/:id
```