const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.odqhq4i.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db("todoDb").collection("users");
    const tasksCollection = client.db("todoDb").collection("tasks");

    // ========get users api============
    app.get("/users", async (req, res) => {
      let query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    // ========post user for db create============
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send("user already exists");
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // ========get tasks api============
    app.get("/tasks", async (req, res) => {
      try {
        const tasks = await tasksCollection.find({}).toArray();
        res.json(tasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // ========post tasks api============
    app.post("/tasks", async (req, res) => {
      const newTask = req.body;

      try {
        const result = await tasksCollection.insertOne(newTask);
        res.status(201).json(result);
      } catch (err) {
        console.error("Error creating task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.get("/task/:id", async (req, res) => {
      const taskId = req.params.id;
    
      try {
        const task = await tasksCollection.findOne({
          _id: new ObjectId(taskId),
        });
    
        if (!task) {
          res.status(404).json({ error: "Task not found", taskId });
        } else {
          res.json(task);
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
      }
    });
    

    app.delete("/task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tasksCollection.deleteOne(query);
      res.send({ deleteCount: result.deletedCount });
    });

    // ========delete tasks api============

    app.delete("/tasks/:id", async (req, res) => {
      const taskId = req.params.id;

      try {
        const result = await tasksCollection.deleteOne({
          _id: ObjectId(taskId),
        });
        if (result.deletedCount === 0) {
          res.status(404).json({ error: "Task not found" });
        } else {
          res.json({ message: "Task deleted successfully" });
        }
      } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
    // ========patch tasks api============
    app.patch("/task/:id", async (req, res) => {
      const taskId = req.params.id;
      const updatedTaskData = req.body;
    
      try {
        const result = await tasksCollection.updateOne(
          { _id: new ObjectId(taskId) },
          { $set: updatedTaskData }
        );
    
        if (result.matchedCount === 0) {
          res.status(404).json({ error: "Task not found", taskId });
        } else {
          res.json({ message: "Task updated successfully", taskId });
        }
      } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.get("/myTasks", async (req, res) => {
      const userId = req.params.userId;
    
      try {
        const userTasks = await tasksCollection.find({ assignedTo: userId }).toArray();
        res.json(userTasks);
      } catch (err) {
        console.error("Error fetching user tasks:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
    
    app.post("/myTasks", async (req, res) => {
      const userId = req.params.userId;
      const newTask = req.body;
    
      try {
        // Check if the user exists
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
          return res.status(404).json({ error: "User not found", userId });
        }
    
        // Assign the task to the user
        newTask.assignedTo = userId;
    
        const result = await tasksCollection.insertOne(newTask);
        res.status(201).json(result);
      } catch (err) {
        console.error("Error creating user task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
